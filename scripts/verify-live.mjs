import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const env = Object.fromEntries(
  envText
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const splitAt = line.indexOf("=");
      return [line.slice(0, splitAt), line.slice(splitAt + 1)];
    }),
);

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase environment variables are missing.");
}

const appUrl = process.env.APP_URL ?? "http://localhost:3000";
const deviceToken = `codex-live-verification-${randomUUID()}`;
const tokenHash = createHash("sha256").update(deviceToken).digest("hex");
let testRowCreated = false;

const headers = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

try {
  const before = await fetch(`${appUrl}/api/leaderboard`).then((response) => response.json());
  if (before.mode !== "live") throw new Error("Leaderboard is not in live mode.");

  const writeResponse = await fetch(`${appUrl}/api/leaderboard`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      deviceToken,
      rankings: [
        { vendorId: "shake-smart", bucket: "liked", withinBucketRank: 1, computedScore: 10 },
        { vendorId: "mod-pizza", bucket: "liked", withinBucketRank: 2, computedScore: 6.7 },
        { vendorId: "wildcat-deli", bucket: "fine", withinBucketRank: 1, computedScore: 5 },
        { vendorId: "tech-express", bucket: "disliked", withinBucketRank: 1, computedScore: 1.7 },
      ],
      favoriteDish: { vendorId: "shake-smart", dishName: "PB Squared" },
    }),
  });
  const write = await writeResponse.json();
  if (!writeResponse.ok || write.mode !== "live") throw new Error("Live write failed.");
  testRowCreated = true;

  const afterWrite = await fetch(`${appUrl}/api/leaderboard`).then((response) => response.json());
  const shakeSmart = afterWrite.entries.find((entry) => entry.vendorId === "shake-smart");
  if (afterWrite.completionCount !== before.completionCount + 1 || shakeSmart?.favoriteDish !== "PB Squared") {
    throw new Error("Live read did not return the test ranking.");
  }

  console.log(`Live Supabase write/read verified (${before.completionCount} → ${afterWrite.completionCount} rankings).`);
} finally {
  if (testRowCreated) {
    const cleanupResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/sessions?token_hash=eq.${tokenHash}`, {
      method: "DELETE",
      headers: { ...headers, Prefer: "return=representation" },
    });
    if (!cleanupResponse.ok) throw new Error("Could not remove the verification row.");

    const afterCleanup = await fetch(`${appUrl}/api/leaderboard`).then((response) => response.json());
    console.log(`Verification row removed (${afterCleanup.completionCount} rankings remain).`);
  }
}
