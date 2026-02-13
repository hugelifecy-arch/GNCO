export interface FundNode {
  id: string; // Stable ID
  layer: number; // 1-9
  label: string;
  summary: string;
  data: {
    jurisdiction?: string;
    advantages: string[];
    disadvantages: string[];
    sources: string[]; // URLs
    tags: string[]; // e.g. "EU_PASSPORT", "CRYPTO_FINANCING"
    factorScores: {
      speed: number; governance: number; familiarity: number;
      cost: number; conservatism: number; digital: number;
    }; // 0-100
  };
  children: string[]; // IDs of children (loaded on demand)
}

export type FactorKey = "speed" | "cost" | "governance" | "digital";
export type ConstraintKey = "EU_PASSPORT" | "TOKENIZATION" | "CRYPTO_FINANCING";
