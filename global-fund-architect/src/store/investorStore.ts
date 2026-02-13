import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FactorKey, ConstraintKey } from "../types";

type Weights = Record<FactorKey, number>;
type Constraints = Record<ConstraintKey, boolean>;

type InvestorState = {
  weights: Weights;
  constraints: Constraints;
  setWeight: (k: FactorKey, v: number) => void;
  toggleConstraint: (k: ConstraintKey) => void;
  reset: () => void;
};

const defaultWeights: Weights = {
  speed: 70,
  cost: 55,
  governance: 80,
  digital: 60
};

const defaultConstraints: Constraints = {
  EU_PASSPORT: false,
  TOKENIZATION: false,
  CRYPTO_FINANCING: false
};

export const useInvestorStore = create<InvestorState>()(
  persist(
    (set) => ({
      weights: defaultWeights,
      constraints: defaultConstraints,
      setWeight: (k, v) => set((s) => ({ weights: { ...s.weights, [k]: v } })),
      toggleConstraint: (k) => set((s) => ({ constraints: { ...s.constraints, [k]: !s.constraints[k] } })),
      reset: () => set(() => ({ weights: defaultWeights, constraints: defaultConstraints }))
    }),
    {
      name: "gfa_investor_profile_v1",
      partialize: (s) => ({ weights: s.weights, constraints: s.constraints })
    }
  )
);
