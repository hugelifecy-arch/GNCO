import React, { useCallback, useMemo, useState } from "react";
import { SlidersHorizontal, Filter, RotateCcw, Search } from "lucide-react";
import { useGraphStore } from "../store/graphStore";
import { useInvestorStore } from "../store/investorStore";
import type { ConstraintKey, FactorKey } from "../types";

const factorLabels: Record<FactorKey, string> = {
  speed: "Speed",
  cost: "Cost (Lower = Better)",
  governance: "Governance",
  digital: "Digital Readiness"
};

const constraintLabels: Record<ConstraintKey, string> = {
  EU_PASSPORT: "Must have EU Passport",
  TOKENIZATION: "Must allow Tokenization",
  CRYPTO_FINANCING: "Must allow Crypto Financing"
};

const presets: Record<string, Record<FactorKey, number>> = {
  balanced: { speed: 70, cost: 55, governance: 80, digital: 60 },
  fast_setup: { speed: 90, cost: 60, governance: 55, digital: 45 },
  low_cost: { speed: 55, cost: 95, governance: 55, digital: 45 },
  institutional: { speed: 55, cost: 45, governance: 95, digital: 45 },
  digital_first: { speed: 60, cost: 45, governance: 65, digital: 95 }
};

const presetOptions: ReadonlyArray<{ value: string; label: string }> = [
  { value: "custom", label: "Custom" },
  { value: "balanced", label: "Balanced" },
  { value: "fast_setup", label: "Fast Setup" },
  { value: "low_cost", label: "Low Cost" },
  { value: "institutional", label: "Institutional Governance" },
  { value: "digital_first", label: "Digital First" }
];

export function ControlPanel() {
  const { weights, constraints, setWeight, setWeights, toggleConstraint, reset } = useInvestorStore();
  const [preset, setPreset] = useState<string>("custom");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const nodesById = useGraphStore((s) => s.nodesById);
  const selectNode = useGraphStore((s) => s.selectNode);

  const searchableNodes = useMemo(() => Object.values(nodesById), [nodesById]);

  const onSearch = useCallback((): void => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const hit = searchableNodes.find((n) => n.label.toLowerCase().includes(q));
    if (hit) selectNode(hit.id);
  }, [searchQuery, searchableNodes, selectNode]);

  const applyPreset = useCallback((key: string): void => {
    setPreset(key);
    if (key === "custom") return;
    setWeights(presets[key] ?? presets.balanced);
  }, [setWeights]);

  const onReset = useCallback((): void => {
    reset();
    setPreset("custom");
  }, [reset]);

  return (
    <aside className="w-full shrink-0 border-b border-slate-800 bg-slate-950/60 backdrop-blur lg:h-full lg:w-[340px] lg:border-b-0 lg:border-r">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-slate-300" />
            <div className="font-semibold">Control Panel</div>
          </div>
          <button
            onClick={onReset}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-800 px-3 py-1.5 text-sm hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            title="Reset weights and filters"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
          <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-300">Scoring Preset</label>
          <select
            value={preset}
            onChange={(e) => applyPreset(e.target.value)}
            className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          >
            {presetOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <div className="mt-1 text-[11px] text-slate-400">Presets update sliders instantly. You can fine-tune after.</div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Search size={16} className="text-slate-300" />
            Search node
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
              placeholder="e.g., Cyprus, RAIF, Tokenization"
              className="min-h-[44px] w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <button
              onClick={onSearch}
              className="shrink-0 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              title="Select first match"
            >
              Go
            </button>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Search works for currently loaded nodes. Expand to load deeper layers.</div>
        </div>


        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal size={16} className="text-slate-300" />
            Weighted Scoring
          </div>

          <div className="mt-3 space-y-3">
            {(Object.keys(weights) as FactorKey[]).map((k) => (
              <div key={k}>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>{factorLabels[k]}</span>
                  <span className="font-semibold text-slate-100">{weights[k]}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={weights[k]}
                  onChange={(e) => setWeight(k, Number(e.target.value))}
                  className="mt-2 w-full accent-sky-400"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter size={16} className="text-slate-300" />
            Hard Constraints
          </div>

          <div className="mt-3 space-y-2">
            {(Object.keys(constraints) as ConstraintKey[]).map((k) => (
              <label
                key={k}
                className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 hover:bg-slate-900/60"
              >
                <span className="text-sm text-slate-100">{constraintLabels[k]}</span>
                <input
                  type="checkbox"
                  checked={constraints[k]}
                  onChange={() => toggleConstraint(k)}
                  className="h-4 w-4 accent-sky-400"
                />
              </label>
            ))}
          </div>

          <div className="mt-3 text-xs text-slate-400">
            Branches that fail a required tag are visually disabled and receive a heavy scoring penalty.
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
          <div className="text-sm font-semibold">Interaction Rules</div>
          <ul className="mt-2 list-disc pl-5 text-xs text-slate-300 space-y-1">
            <li>Click the <span className="font-semibold">node body</span> to open the details drawer.</li>
            <li>Click the <span className="font-semibold">caret</span> to expand/collapse only.</li>
            <li>Selected branch stays opaque; sibling branches fade and edges turn light red.</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
