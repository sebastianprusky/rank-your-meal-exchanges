import { createHash } from "node:crypto";
import { vendors, type Bucket } from "@/lib/vendors";

export const dynamic = "force-dynamic";

const schoolId = "northwestern";
const requestTimes = new Map<string, number>();

const demoScores: Record<string, number> = {
  "shake-smart": 8.6,
  "forno-pizza-co": 8.2,
  "buen-dia": 7.8,
  "847-burger": 7.3,
  "chicken-and-boba": 7.0,
  "frans-cafe": 6.8,
  "lunas-pub-and-grill": 6.6,
  "wildcat-deli": 6.4,
  "starbucks": 5.9,
  "lisas-cafe": 5.5,
  "tech-express": 5.1,
};

const demoFavorites: Record<string, string> = {
  "shake-smart": "PB Squared",
  "forno-pizza-co": "Pepperoni pizza",
  "buen-dia": "Buen Dia Bowl",
  "847-burger": "847 Classic",
};

function demoLeaderboard() {
  return {
    completionCount: 0,
    mode: "demo" as const,
    entries: vendors
      .map((vendor) => ({
        vendorId: vendor.id,
        averageScore: demoScores[vendor.id],
        ratingCount: 0,
        favoriteDish: demoFavorites[vendor.id],
      }))
      .sort((a, b) => b.averageScore - a.averageScore),
  };
}

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

async function supabaseFetch(path: string, init: RequestInit = {}) {
  const current = config();
  if (!current) throw new Error("Supabase is not configured");

  return fetch(`${current.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: current.key,
      Authorization: `Bearer ${current.key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
}

export async function GET() {
  if (!config()) return Response.json(demoLeaderboard());

  try {
    const [rankingsResponse, favoritesResponse] = await Promise.all([
      supabaseFetch(`session_rankings?select=session_id,vendor_id,computed_score&school_id=eq.${schoolId}`),
      supabaseFetch(`session_favorite_dishes?select=vendor_id,dish_name&school_id=eq.${schoolId}`),
    ]);

    if (!rankingsResponse.ok || !favoritesResponse.ok) throw new Error("Could not read leaderboard");

    const rankings = await rankingsResponse.json() as Array<{ session_id: string; vendor_id: string; computed_score: number }>;
    const favorites = await favoritesResponse.json() as Array<{ vendor_id: string; dish_name: string }>;
    const sessions = new Set(rankings.map((ranking) => ranking.session_id));

    const entries = vendors.map((vendor) => {
      const scores = rankings.filter((ranking) => ranking.vendor_id === vendor.id).map((ranking) => Number(ranking.computed_score));
      const dishCounts = new Map<string, number>();
      favorites.filter((favorite) => favorite.vendor_id === vendor.id).forEach((favorite) => {
        dishCounts.set(favorite.dish_name, (dishCounts.get(favorite.dish_name) ?? 0) + 1);
      });
      const favoriteDish = [...dishCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

      return {
        vendorId: vendor.id,
        averageScore: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
        ratingCount: scores.length,
        favoriteDish,
      };
    }).sort((a, b) => b.averageScore - a.averageScore || b.ratingCount - a.ratingCount);

    return Response.json({ completionCount: sessions.size, entries, mode: "live" });
  } catch {
    return Response.json(demoLeaderboard());
  }
}

type RankingInput = {
  vendorId: string;
  bucket: Bucket;
  withinBucketRank: number;
  computedScore: number;
};

function validRanking(value: unknown): value is RankingInput {
  if (!value || typeof value !== "object") return false;
  const ranking = value as Partial<RankingInput>;
  return typeof ranking.vendorId === "string"
    && vendors.some((vendor) => vendor.id === ranking.vendorId)
    && ["liked", "fine", "disliked"].includes(ranking.bucket ?? "")
    && Number.isInteger(ranking.withinBucketRank)
    && typeof ranking.computedScore === "number"
    && ranking.computedScore >= 0
    && ranking.computedScore <= 10;
}

function cleanFavoriteDish(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned && cleaned.length <= 80 ? cleaned : null;
}

export async function POST(request: Request) {
  if (!config()) return Response.json({ ok: true, mode: "demo" });

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = createHash("sha256").update(forwarded).digest("hex");
  const lastRequest = requestTimes.get(ipHash) ?? 0;
  if (Date.now() - lastRequest < 3_000) return Response.json({ error: "Please wait a moment." }, { status: 429 });
  requestTimes.set(ipHash, Date.now());

  try {
    const body = await request.json() as {
      deviceToken?: string;
      rankings?: unknown[];
      favoriteDish?: { vendorId?: string; dishName?: string } | null;
    };

    if (!body.deviceToken || body.deviceToken.length > 100 || !Array.isArray(body.rankings) || !body.rankings.every(validRanking)) {
      return Response.json({ error: "Invalid ranking" }, { status: 400 });
    }

    const tokenHash = createHash("sha256").update(body.deviceToken).digest("hex");
    const sessionResponse = await supabaseFetch("sessions?on_conflict=school_id,token_hash", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({ school_id: schoolId, token_hash: tokenHash, updated_at: new Date().toISOString() }),
    });
    if (!sessionResponse.ok) throw new Error("Could not save session");
    const sessions = await sessionResponse.json() as Array<{ id: string }>;
    const sessionId = sessions[0]?.id;
    if (!sessionId) throw new Error("Missing session id");

    const deleteRankings = await supabaseFetch(`session_rankings?session_id=eq.${sessionId}`, { method: "DELETE" });
    const deleteFavorites = await supabaseFetch(`session_favorite_dishes?session_id=eq.${sessionId}`, { method: "DELETE" });
    if (!deleteRankings.ok || !deleteFavorites.ok) throw new Error("Could not replace ranking");

    if (body.rankings.length > 0) {
      const insertRankings = await supabaseFetch("session_rankings", {
        method: "POST",
        body: JSON.stringify(body.rankings.map((ranking) => ({
          session_id: sessionId,
          school_id: schoolId,
          vendor_id: (ranking as RankingInput).vendorId,
          bucket: (ranking as RankingInput).bucket,
          within_bucket_rank: (ranking as RankingInput).withinBucketRank,
          computed_score: (ranking as RankingInput).computedScore,
        }))),
      });
      if (!insertRankings.ok) throw new Error("Could not insert rankings");
    }

    const favorite = body.favoriteDish;
    if (favorite?.vendorId && body.rankings.some((ranking) => (ranking as RankingInput).vendorId === favorite.vendorId)) {
      const vendor = vendors.find((candidate) => candidate.id === favorite.vendorId);
      const dishName = cleanFavoriteDish(favorite.dishName);
      if (vendor && dishName) {
        await supabaseFetch("session_favorite_dishes", {
          method: "POST",
          body: JSON.stringify({
            session_id: sessionId,
            school_id: schoolId,
            vendor_id: favorite.vendorId,
            dish_name: dishName,
          }),
        });
      }
    }

    return Response.json({ ok: true, mode: "live" });
  } catch {
    return Response.json({ error: "Could not save ranking" }, { status: 500 });
  }
}
