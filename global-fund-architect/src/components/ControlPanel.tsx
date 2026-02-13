import React, { useState } from "react";
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

export function ControlPanel() {
  const { weights, constraints, setWeight, setWeights, toggleConstraint, reset } = useInvestorStore();
  const [preset, setPreset] = useState<string>("custom");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { nodesById, selectNode } = useGraphStore((s) => ({ nodesById: s.nodesById, selectNode: s.selectNode }));

  const onSearch = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;
    const hit = Object.values(nodesById).find((n) => n.label.toLowerCase().includes(q));
    if (hit) selectNode(hit.id);
  };

  const applyPreset = (key: string) => {
    setPreset(key);
    if (key === "custom") return;
    const presets: Record<string, Record<FactorKey, number>> = {
      balanced: { speed: 70, cost: 55, governance: 80, digital: 60 },
      fast_launch: { speed: 90, cost: 60, governance: 55, digital: 45 },
      low_cost: { speed: 55, cost: 95, governance: 55, digital: 45 },
      institutional: { speed: 55, cost: 45, governance: 95, digital: 45 },
      digital_first: { speed: 60, cost: 45, governance: 65, digital: 95 }
    };
    setWeights(presets[key] ?? presets.balanced);
  };

  return (
    <aside className="h-full w-[340px] shrink-0 border-r border-slate-800 bg-slate-950/60 backdrop-blur">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-slate-300" />
            <div className="font-semibold">Control Panel</div>
          </div>
          <button
            onClick={() => { reset(); setPreset("custom"); }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-1.5 text-sm hover:bg-slate-900"
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
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
          >
            <option value="custom">Custom</option>
            <option value="balanced">Balanced</option>
            <option value="fast_launch">Fast Launch</option>
            <option value="low_cost">Low Cost</option>
            <option value="institutional">Institutional Governance</option>
            <option value="digital_first">Digital First</option>
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
              className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <button
              onClick={onSearch}
              className="shrink-0 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm hover:bg-slate-900"
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
                className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 hover:bg-slate-900/60"
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
