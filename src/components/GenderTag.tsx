import type { Gender } from "../lib/morphology.ts";

export function GenderTag({ gender, article }: { gender: Gender | null | undefined; article?: string | null }) {
  if (!gender && !article) return null;
  const kind = gender === "m" || gender === "f" || gender === "mf" ? gender : "mf";
  const label = gender === "m" ? "M" : gender === "f" ? "F" : gender === "mf" ? "M/F" : "";
  return <span className={`gtag ${kind}`}>{[article, label].filter(Boolean).join(" · ")}</span>;
}
