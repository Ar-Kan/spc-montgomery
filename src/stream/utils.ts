import { computePcr } from "./data/functions";

export function formatedPcr(std: number | null, d2: number): string {
  if (std === null) {
    return "N/A";
  }
  const pcr = computePcr({ LSL: 0, USL: 1, std, d2 });
  return `${(100 / pcr).toFixed(2)}%`;
}
