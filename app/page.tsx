import { RankingApp } from "@/components/ranking-app";
import { vendors } from "@/lib/vendors";

export default function Home() {
  return (
    <>
      {vendors.map((vendor) => (
        <link key={vendor.id} rel="preload" as="image" href={vendor.image} type="image/webp" />
      ))}
      <RankingApp />
    </>
  );
}
