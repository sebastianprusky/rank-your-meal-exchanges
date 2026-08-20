import type { Bucket } from "./vendors";

const ranges: Record<Bucket, [number, number]> = {
  disliked: [0, 3.3],
  fine: [3.4, 6.6],
  liked: [6.7, 10],
};

export function scoreBucket(bucket: Bucket, orderedIds: string[]) {
  const [minimum, maximum] = ranges[bucket];

  return orderedIds.map((vendorId, index) => {
    const score = orderedIds.length === 1
      ? (minimum + maximum) / 2
      : maximum - (index * (maximum - minimum)) / (orderedIds.length - 1);

    return { vendorId, score: Number(score.toFixed(1)), withinBucketRank: index + 1 };
  });
}
