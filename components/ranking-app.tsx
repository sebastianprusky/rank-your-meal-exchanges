"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { scoreBucket } from "@/lib/scoring";
import { SITE_HOSTNAME, SITE_URL } from "@/lib/site";
import { vendorById, vendors, type Bucket, type Vendor } from "@/lib/vendors";

type Phase = "landing" | "bucket" | "compare" | "dish" | "results";
type BucketMap = Record<Bucket, string[]>;

type SortMachine = {
  bucket: Bucket;
  remainingBuckets: Bucket[];
  runs: string[][];
  mergedRuns: string[][];
  left: string[] | null;
  right: string[] | null;
  leftIndex: number;
  rightIndex: number;
  output: string[];
};

type LeaderboardEntry = {
  vendorId: string;
  averageScore: number;
  ratingCount: number;
  favoriteDish?: string;
};

type LeaderboardResponse = {
  completionCount: number;
  entries: LeaderboardEntry[];
  mode?: "live" | "demo";
};

const emptyBuckets = (): BucketMap => ({ liked: [], fine: [], disliked: [] });
const bucketOrder: Bucket[] = ["liked", "fine", "disliked"];

const bucketMeta: Record<Bucket, { label: string; mark: string }> = {
  liked: { label: "Liked", mark: "↑" },
  fine: { label: "Fine", mark: "—" },
  disliked: { label: "Disliked", mark: "↓" },
};

function createSortMachine(bucket: Bucket, items: string[], remainingBuckets: Bucket[]): SortMachine {
  return {
    bucket,
    remainingBuckets,
    runs: items.map((item) => [item]),
    mergedRuns: [],
    left: null,
    right: null,
    leftIndex: 0,
    rightIndex: 0,
    output: [],
  };
}

function advanceMachine(machine: SortMachine): { machine?: SortMachine; completed?: string[] } {
  let next = { ...machine };

  while (!next.left || !next.right) {
    if (next.runs.length >= 2) {
      const [left, right, ...rest] = next.runs;
      return {
        machine: {
          ...next,
          runs: rest,
          left,
          right,
          leftIndex: 0,
          rightIndex: 0,
          output: [],
        },
      };
    }

    if (next.runs.length === 1) {
      next = { ...next, mergedRuns: [...next.mergedRuns, next.runs[0]], runs: [] };
    }

    if (next.runs.length === 0) {
      if (next.mergedRuns.length === 1) return { completed: next.mergedRuns[0] };
      next = { ...next, runs: next.mergedRuns, mergedRuns: [] };
    }
  }

  return { machine: next };
}

function VendorArt({ vendor, compact = false }: { vendor: Vendor; compact?: boolean }) {
  return (
    <div
      className={`vendor-art${compact ? " vendor-art--compact" : ""}`}
      style={{ "--vendor": vendor.accent, "--vendor-soft": vendor.accentSoft } as React.CSSProperties}
      aria-hidden="true"
    >
      <span className="vendor-art__halo" />
      <span className="vendor-art__glyph">{vendor.glyph}</span>
      <span className="vendor-art__word">{vendor.shortName}</span>
    </div>
  );
}

function AppHeader({ step, onRestart }: { step?: string; onRestart?: () => void }) {
  return (
    <header className="app-header">
      <button className="wordmark" onClick={onRestart} disabled={!onRestart} aria-label="Go to start">
        <span className="wordmark__n">N</span>
        <span>meal exchanges</span>
      </button>
      {step && <span className="step-label">{step}</span>}
    </header>
  );
}

function getDeviceToken() {
  const key = "ryme-device-token";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.localStorage.setItem(key, next);
  return next;
}

export function RankingApp() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [bucketIndex, setBucketIndex] = useState(0);
  const [buckets, setBuckets] = useState<BucketMap>(emptyBuckets);
  const [untried, setUntried] = useState<string[]>([]);
  const [sorted, setSorted] = useState<BucketMap>(emptyBuckets);
  const [machine, setMachine] = useState<SortMachine | null>(null);
  const [comparisons, setComparisons] = useState(0);
  const [favoriteDish, setFavoriteDish] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const savedSignature = useRef<string | null>(null);

  const scoredRanking = useMemo(() => {
    return bucketOrder.flatMap((bucket) =>
      scoreBucket(bucket, sorted[bucket]).map((result) => ({
        ...result,
        bucket,
        vendor: vendorById[result.vendorId],
      })),
    );
  }, [sorted]);

  const topVendor = scoredRanking[0]?.vendor;

  const reset = useCallback(() => {
    setPhase("landing");
    setBucketIndex(0);
    setBuckets(emptyBuckets());
    setUntried([]);
    setSorted(emptyBuckets());
    setMachine(null);
    setComparisons(0);
    setFavoriteDish(null);
    setShareStatus(null);
  }, []);

  const beginComparisons = useCallback((finalBuckets: BucketMap) => {
    const sortable = bucketOrder.filter((bucket) => finalBuckets[bucket].length >= 2);
    setSorted({
      liked: [...finalBuckets.liked],
      fine: [...finalBuckets.fine],
      disliked: [...finalBuckets.disliked],
    });

    if (bucketOrder.every((bucket) => finalBuckets[bucket].length === 0)) {
      setPhase("results");
      return;
    }

    if (sortable.length === 0) {
      setPhase("dish");
      return;
    }

    const [first, ...remaining] = sortable;
    const started = advanceMachine(createSortMachine(first, finalBuckets[first], remaining));
    setMachine(started.machine ?? null);
    setPhase("compare");
  }, []);

  function chooseBucket(choice: Bucket | "untried") {
    const vendor = vendors[bucketIndex];
    let nextBuckets = buckets;

    if (choice === "untried") {
      setUntried((current) => [...current, vendor.id]);
    } else {
      nextBuckets = { ...buckets, [choice]: [...buckets[choice], vendor.id] };
      setBuckets(nextBuckets);
    }

    if (bucketIndex === vendors.length - 1) {
      beginComparisons(nextBuckets);
    } else {
      setBucketIndex((current) => current + 1);
    }
  }

  function undoBucketChoice() {
    if (bucketIndex === 0) return;
    const previousVendor = vendors[bucketIndex - 1];
    setBuckets((current) => ({
      liked: current.liked.filter((id) => id !== previousVendor.id),
      fine: current.fine.filter((id) => id !== previousVendor.id),
      disliked: current.disliked.filter((id) => id !== previousVendor.id),
    }));
    setUntried((current) => current.filter((id) => id !== previousVendor.id));
    setBucketIndex((current) => current - 1);
  }

  function chooseComparison(preferredId: string) {
    if (!machine?.left || !machine.right) return;

    let leftIndex = machine.leftIndex;
    let rightIndex = machine.rightIndex;
    const output = [...machine.output, preferredId];

    if (machine.left[leftIndex] === preferredId) leftIndex += 1;
    else rightIndex += 1;

    setComparisons((current) => current + 1);

    if (leftIndex < machine.left.length && rightIndex < machine.right.length) {
      setMachine({ ...machine, leftIndex, rightIndex, output });
      return;
    }

    const merged = [
      ...output,
      ...machine.left.slice(leftIndex),
      ...machine.right.slice(rightIndex),
    ];
    const advanced = advanceMachine({
      ...machine,
      mergedRuns: [...machine.mergedRuns, merged],
      left: null,
      right: null,
      leftIndex: 0,
      rightIndex: 0,
      output: [],
    });

    if (advanced.machine) {
      setMachine(advanced.machine);
      return;
    }

    const completed = advanced.completed ?? merged;
    const nextSorted = { ...sorted, [machine.bucket]: completed };
    setSorted(nextSorted);

    const [nextBucket, ...remainingBuckets] = machine.remainingBuckets;
    if (nextBucket) {
      const nextMachine = advanceMachine(createSortMachine(nextBucket, buckets[nextBucket], remainingBuckets));
      setMachine(nextMachine.machine ?? null);
    } else {
      setMachine(null);
      setPhase("dish");
    }
  }

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Leaderboard unavailable");
      setLeaderboard(await response.json());
    } catch {
      setLeaderboard(null);
    }
  }, []);

  useEffect(() => {
    if (phase !== "results") return;
    let cancelled = false;
    fetch("/api/leaderboard", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Leaderboard unavailable");
        return response.json() as Promise<LeaderboardResponse>;
      })
      .then((data) => {
        if (!cancelled) setLeaderboard(data);
      })
      .catch(() => {
        if (!cancelled) setLeaderboard(null);
      });

    return () => { cancelled = true; };
  }, [phase]);

  useEffect(() => {
    if (phase !== "results" || scoredRanking.length === 0) return;

    const signature = JSON.stringify({ scoredRanking, favoriteDish });
    if (savedSignature.current === signature) return;
    savedSignature.current = signature;

    const rankings = scoredRanking.map(({ vendorId, bucket, withinBucketRank, score }) => ({
      vendorId,
      bucket,
      withinBucketRank,
      computedScore: score,
    }));

    void fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceToken: getDeviceToken(),
        rankings,
        favoriteDish: topVendor && favoriteDish ? { vendorId: topVendor.id, dishName: favoriteDish } : null,
      }),
    }).then(() => void loadLeaderboard()).catch(() => void loadLeaderboard());
  }, [favoriteDish, loadLeaderboard, phase, scoredRanking, topVendor]);

  async function createShareFile() {
    await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unsupported");

    context.fillStyle = "#F7F4EF";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#4E2A84";
    context.fillRect(0, 0, 26, canvas.height);

    context.fillStyle = "#211B24";
    context.font = "700 35px 'DM Sans', sans-serif";
    context.fillText("NORTHWESTERN", 82, 95);
    context.fillStyle = "#4E2A84";
    context.font = "800 76px 'Fraunces', Georgia, serif";
    context.fillText("My meal exchanges", 82, 184);
    context.fillText("ranked.", 82, 266);

    scoredRanking.forEach(({ vendor, score }, index) => {
      const y = 335 + index * 86;
      context.fillStyle = index === 0 ? "#4E2A84" : "#FFFFFF";
      context.beginPath();
      context.roundRect(72, y, 936, 66, 18);
      context.fill();

      context.fillStyle = index === 0 ? "#FFFFFF" : "#4E2A84";
      context.font = "700 27px 'DM Sans', sans-serif";
      context.fillText(String(index + 1).padStart(2, "0"), 98, y + 43);
      context.fillStyle = index === 0 ? "#FFFFFF" : "#211B24";
      context.font = "650 30px 'DM Sans', sans-serif";
      context.fillText(vendor.name, 178, y + 43);
      context.textAlign = "right";
      context.font = "700 27px 'DM Sans', sans-serif";
      context.fillText(score.toFixed(1), 974, y + 43);
      context.textAlign = "left";
    });

    if (favoriteDish && topVendor) {
      context.fillStyle = "#4E2A84";
      context.font = "700 22px 'DM Sans', sans-serif";
      context.fillText("MY GO-TO", 82, 1165);
      context.fillStyle = "#211B24";
      context.font = "650 30px 'DM Sans', sans-serif";
      context.fillText(`${favoriteDish} at ${topVendor.name}`, 82, 1206);
    }

    context.fillStyle = "#6D6571";
    context.font = "500 24px 'DM Sans', sans-serif";
    context.fillText(SITE_HOSTNAME, 82, 1285);

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not create image")), "image/png"),
    );
    return new File([blob], "my-meal-exchange-ranking.png", { type: "image/png" });
  }

  async function shareResult() {
    try {
      const file = await createShareFile();
      const data = {
        title: "My Northwestern meal exchange ranking",
        text: `I ranked Northwestern's meal exchanges — make yours at ${SITE_URL}`,
        files: [file],
      };

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share(data);
        setShareStatus("Shared");
      } else {
        downloadFile(file);
        setShareStatus("Image downloaded");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") setShareStatus("Could not share. Try downloading instead.");
    }
  }

  async function downloadResult() {
    try {
      downloadFile(await createShareFile());
      setShareStatus("Image downloaded");
    } catch {
      setShareStatus("Could not create the image.");
    }
  }

  function downloadFile(file: File) {
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (phase === "landing") {
    return (
      <main className="site-shell landing">
        <AppHeader />
        <section className="landing__hero">
          <div className="landing__copy">
            <p className="eyebrow">A two-minute taste test</p>
            <h1>Rank your<br /><em>meal exchanges.</em></h1>
            <p className="landing__subhead">Nine spots. A few quick choices. Your definitive Northwestern ranking.</p>
            <button className="button button--primary button--large" onClick={() => setPhase("bucket")}>Start ranking <span>→</span></button>
            <p className="privacy-note">No account. No signup. Just your picks.</p>
          </div>
          <div className="card-stack" aria-hidden="true">
            {[vendors[0], vendors[4], vendors[1]].map((vendor, index) => (
              <div className={`stack-card stack-card--${index + 1}`} key={vendor.id}>
                <VendorArt vendor={vendor} />
                <div className="stack-card__label"><span>{vendor.name}</span><b>{9 - index}.<small>{8 - index}</small></b></div>
              </div>
            ))}
          </div>
        </section>
        <div className="landing__ticker"><span>MOD PIZZA</span><i>✦</i><span>SHAKE SMART</span><i>✦</i><span>FRAN&apos;S</span><i>✦</i><span>BUEN DIA</span></div>
      </main>
    );
  }

  if (phase === "bucket") {
    const vendor = vendors[bucketIndex];
    return (
      <main className="site-shell flow-shell">
        <AppHeader step="First pass" onRestart={reset} />
        <div className="progress-row"><span>{bucketIndex + 1} of {vendors.length}</span><div className="progress-track"><i style={{ width: `${((bucketIndex + 1) / vendors.length) * 100}%` }} /></div></div>
        <section className="flow-content bucket-screen">
          <div className="prompt-block"><p className="eyebrow">Go with your gut</p><h2>How do you feel about<br /><em>{vendor.name}?</em></h2></div>
          <article className="focus-card">
            <VendorArt vendor={vendor} />
            <div className="focus-card__copy"><div><h3>{vendor.name}</h3><p>{vendor.eyebrow}</p></div><span className="mini-tag">Meal exchange</span></div>
          </article>
          <div className="bucket-buttons">
            {bucketOrder.map((bucket) => <button key={bucket} onClick={() => chooseBucket(bucket)}><span>{bucketMeta[bucket].mark}</span>{bucketMeta[bucket].label}</button>)}
          </div>
          <button className="text-button" onClick={() => chooseBucket("untried")}>Haven&apos;t tried it</button>
          {bucketIndex > 0 && <button className="back-button" onClick={undoBucketChoice}>← Back</button>}
        </section>
      </main>
    );
  }

  if (phase === "compare" && machine?.left && machine.right) {
    const left = vendorById[machine.left[machine.leftIndex]];
    const right = vendorById[machine.right[machine.rightIndex]];
    return (
      <main className="site-shell flow-shell">
        <AppHeader step="Head-to-head" onRestart={reset} />
        <div className="progress-row"><span>Choice {comparisons + 1}</span><div className="progress-track progress-track--open"><i /></div></div>
        <section className="flow-content compare-screen">
          <div className="prompt-block"><p className="eyebrow">Ordering your {bucketMeta[machine.bucket].label.toLowerCase()} picks</p><h2>Which would you<br /><em>rather have?</em></h2></div>
          <div className="versus-grid">
            {[left, right].map((vendor, index) => (
              <button className="versus-card" key={vendor.id} onClick={() => chooseComparison(vendor.id)}>
                <VendorArt vendor={vendor} />
                <span className="versus-card__name">{vendor.name}</span>
                <small>{vendor.eyebrow}</small>
                <b>Pick this <span>→</span></b>
                {index === 0 && <i className="or-badge">or</i>}
              </button>
            ))}
          </div>
          <p className="helper-copy">Tap the one you&apos;d choose today.</p>
        </section>
      </main>
    );
  }

  if (phase === "dish") {
    if (!topVendor) return null;
    return (
      <main className="site-shell flow-shell">
        <AppHeader step="One last thing" onRestart={reset} />
        <section className="flow-content dish-screen">
          <div className="dish-winner"><span>Your #1</span><VendorArt vendor={topVendor} compact /><h3>{topVendor.name}</h3></div>
          <div className="prompt-block"><p className="eyebrow">Optional</p><h2>What&apos;s your go-to<br />at <em>{topVendor.name}?</em></h2><p>We&apos;ll add it to your result card.</p></div>
          <div className="dish-list">
            {topVendor.menuItems.map((item) => <button key={item} onClick={() => { setFavoriteDish(item); setPhase("results"); }}><span>{item}</span><i>→</i></button>)}
          </div>
          <button className="text-button" onClick={() => setPhase("results")}>Skip this</button>
        </section>
      </main>
    );
  }

  return (
    <main className="site-shell results-shell">
      <AppHeader step="Your results" onRestart={reset} />
      <section className="results-intro"><p className="eyebrow">The verdict is in</p><h2>Your meal exchanges,<br /><em>ranked.</em></h2><p>Screenshot it. Share it. Defend it.</p></section>
      <section className="result-card" aria-label="Your ranked meal exchanges">
        <div className="result-card__head"><span>MY NORTHWESTERN</span><b>{scoredRanking.length}<small>/9 tried</small></b></div>
        {scoredRanking.length > 0 ? (
          <ol className="ranking-list">
            {scoredRanking.map(({ vendor, score }, index) => (
              <li key={vendor.id} className={index === 0 ? "ranking-list__winner" : ""}>
                <span className="ranking-number">{String(index + 1).padStart(2, "0")}</span>
                <VendorArt vendor={vendor} compact />
                <span className="ranking-name">{vendor.name}<small>{vendor.eyebrow}</small></span>
                <b className="ranking-score">{score.toFixed(1)}</b>
              </li>
            ))}
          </ol>
        ) : <div className="empty-result"><b>Nothing to rank yet.</b><span>Try again after you&apos;ve had a few meal exchanges.</span></div>}
        {favoriteDish && topVendor && <div className="go-to"><span>My go-to</span><b>{favoriteDish}</b><small>at {topVendor.name}</small></div>}
        {untried.length > 0 && <p className="untried-note">Not ranked: {untried.map((id) => vendorById[id].name).join(", ")}</p>}
      </section>

      {scoredRanking.length > 0 && <div className="share-actions">
        <button className="button button--primary" onClick={shareResult}>Share result <span>↗</span></button>
        <button className="button button--secondary" onClick={downloadResult}>Download image <span>↓</span></button>
        {shareStatus && <p role="status">{shareStatus}</p>}
      </div>}

      <section className="campus-section">
        <div className="section-heading"><div><p className="eyebrow">The campus take</p><h2>Northwestern&apos;s ranking</h2></div>{leaderboard && <span>{leaderboard.mode === "demo" ? "Preview data" : `${leaderboard.completionCount.toLocaleString()} rankings`}</span>}</div>
        {!leaderboard ? <div className="leaderboard-loading">Loading the campus ranking…</div> : (
          <ol className="leaderboard-list">
            {leaderboard.entries.map((entry, index) => {
              const vendor = vendorById[entry.vendorId];
              if (!vendor) return null;
              return <li key={entry.vendorId}><span className="leaderboard-rank">{index + 1}</span><VendorArt vendor={vendor} compact /><span><b>{vendor.name}</b><small>{entry.favoriteDish ? `Most picked: ${entry.favoriteDish}` : `${entry.ratingCount} ratings`}</small></span><strong>{entry.averageScore.toFixed(1)}</strong></li>;
            })}
          </ol>
        )}
        <p className="campus-footnote">{leaderboard?.mode === "demo" ? "Connect Supabase to replace this preview with live campus results." : "Your ranking is counted automatically. Rank again anytime to update it."}</p>
      </section>
      <button className="button button--ghost" onClick={reset}>Rank again</button>
      <footer>Made for Northwestern students <span>✦</span> No account required</footer>
    </main>
  );
}
