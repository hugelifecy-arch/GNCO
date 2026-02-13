import type { FundNode, FactorKey, ConstraintKey } from "../types";
import { useInvestorStore } from "../store/investorStore";

export type FitResult = {
  fitScore: number; // 0-100
  penalty: number;  // negative
  isDisabled: boolean;
  missingTags: ConstraintKey[];
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function computeNodeFit(node: FundNode): FitResult {
  const { weights, constraints } = useInvestorStore.getState();

  const required = (Object.keys(constraints) as ConstraintKey[]).filter(k => constraints[k]);
  const missing = required.filter(t => !node.data.tags.includes(t));

  // Weighted average (weights are 0..100)
  const wSum = weights.speed + weights.cost + weights.governance + weights.digital;
  const wNorm = wSum === 0 ? 1 : wSum;

  const raw =
    (node.data.factorScores.speed * weights.speed +
      (100 - node.data.factorScores.cost) * weights.cost +
      node.data.factorScores.governance * weights.governance +
      node.data.factorScores.digital * weights.digital) / wNorm;

  // Penalize missing tags heavily
  const penalty = missing.length ? -35 * missing.length : 0;

  const fitScore = clamp(raw + penalty, 0, 100);
  const isDisabled = missing.length > 0;

  return { fitScore, penalty, isDisabled, missingTags: missing };
}

export type PathScore = {
  leafId: string;
  score: number;
  pathNodeIds: string[];
};

export function computeTopPaths(params: {
  leafIds: string[];
  parentByChild: Record<string, string | undefined>;
  nodesById: Record<string, FundNode>;
}): PathScore[] {
  const { leafIds, parentByChild, nodesById } = params;

  const results: PathScore[] = [];
  for (const leafId of leafIds) {
    const path: string[] = [];
    let cur: string | undefined = leafId;
    while (cur) {
      path.push(cur);
      cur = parentByChild[cur];
    }
    path.reverse();

    const fits = path.map(id => nodesById[id]).filter(Boolean).map(n => computeNodeFit(n));
    if (!fits.length) continue;

    // If any node along path is disabled, deprioritize strongly.
    const invalidCount = fits.filter(f => f.isDisabled).length;
    const avg = fits.reduce((a, f) => a + f.fitScore, 0) / fits.length;
    const score = avg - invalidCount * 25;

    results.push({ leafId, score, pathNodeIds: path });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 3);
}
