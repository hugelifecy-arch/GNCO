import React, { useMemo, useState } from "react";
import { X, Link as LinkIcon, ThumbsUp, ThumbsDown, Info } from "lucide-react";
import { useGraphStore } from "../store/graphStore";
import { useInvestorStore } from "../store/investorStore";
import { SOURCE_FALLBACK } from "../data/mockDataManager";
import { computeNodeFit } from "../utils/scoring";

type TabKey = "overview" | "proscons" | "sources";

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export function DetailsDrawer() {
  const { selectedNodeId, nodesById, clearSelection } = useGraphStore((s) => ({
    selectedNodeId: s.selectedNodeId,
    nodesById: s.nodesById,
    clearSelection: s.clearSelection
  }));

  const { weights, constraints } = useInvestorStore((s) => ({ weights: s.weights, constraints: s.constraints }));

  const node = selectedNodeId ? nodesById[selectedNodeId] : null;
  const fit = useMemo(() => (node ? computeNodeFit(node, weights, constraints) : null), [node, weights, constraints]);
  const [tab, setTab] = useState<TabKey>("overview");

  if (!node) return null;

  const sources = node.data.sources.length ? node.data.sources : [SOURCE_FALLBACK];

  return (
    <aside className="h-full w-[420px] shrink-0 border-l border-slate-800 bg-slate-950/70 backdrop-blur">
      <div className="flex items-start justify-between p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="truncate text-lg font-semibold">{node.label}</div>
            <span className="text-[11px] px-2 py-0.5 rounded-full border border-slate-700 text-slate-200">
              L{node.layer}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {node.data.jurisdiction ? <>Jurisdiction: <span className="text-slate-200">{node.data.jurisdiction}</span></> : "—"}
          </div>

          {fit ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-slate-800 bg-slate-900/60 px-2 py-1">
                Fit Score: <span className="font-semibold text-slate-100">{Math.round(fit.fitScore)}</span>
              </span>
              <span className="rounded-full border border-slate-800 bg-slate-900/60 px-2 py-1">
                Raw: <span className="font-semibold text-slate-100">{Math.round(fit.rawScore)}</span>
              </span>
              <span className="rounded-full border border-slate-800 bg-slate-900/60 px-2 py-1 text-slate-300">
                Breakdown S/C/G/D: {Math.round(fit.breakdown.speed)}/{Math.round(fit.breakdown.cost)}/{Math.round(fit.breakdown.governance)}/{Math.round(fit.breakdown.digital)}
              </span>
              {fit.isDisabled ? (
                <span className="rounded-full border border-rose-700/50 bg-rose-950/30 px-2 py-1 text-rose-200">
                  Disabled by filter: {fit.missingTags.join(", ")}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <button
          onClick={clearSelection}
          className="ml-3 rounded-xl border border-slate-800 p-2 hover:bg-slate-900"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-1">
          <button
            onClick={() => setTab("overview")}
            className={cn("rounded-xl px-3 py-2 text-sm", tab === "overview" ? "bg-slate-950 border border-slate-800" : "text-slate-300 hover:bg-slate-900")}
          >
            Overview
          </button>
          <button
            onClick={() => setTab("proscons")}
            className={cn("rounded-xl px-3 py-2 text-sm", tab === "proscons" ? "bg-slate-950 border border-slate-800" : "text-slate-300 hover:bg-slate-900")}
          >
            Pros/Cons
          </button>
          <button
            onClick={() => setTab("sources")}
            className={cn("rounded-xl px-3 py-2 text-sm", tab === "sources" ? "bg-slate-950 border border-slate-800" : "text-slate-300 hover:bg-slate-900")}
          >
            Sources
          </button>
        </div>
      </div>

      <div className="p-4 overflow-auto h-[calc(100%-140px)]">
        {tab === "overview" ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Info size={16} className="text-slate-300" />
              Summary
            </div>
            <p className="mt-2 text-sm text-slate-200 leading-relaxed">
              {node.summary}
            </p>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
              <div className="text-xs font-semibold text-slate-300">Tags</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {node.data.tags.length ? node.data.tags.map((t) => (
                  <span key={t} className="text-[11px] rounded-full border border-slate-800 bg-slate-900/60 px-2 py-1 text-slate-200">
                    {t}
                  </span>
                )) : (
                  <span className="text-xs text-slate-400">No tags</span>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "proscons" ? (
          <div className="grid gap-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ThumbsUp size={16} className="text-emerald-300" />
                Advantages
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-200 space-y-1">
                {node.data.advantages.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ThumbsDown size={16} className="text-rose-300" />
                Disadvantages
              </div>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-200 space-y-1">
                {node.data.disadvantages.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          </div>
        ) : null}

        {tab === "sources" ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <LinkIcon size={16} className="text-slate-300" />
              Source Anchors
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {sources.map((s, i) => (
                <li key={i} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                  {s === SOURCE_FALLBACK ? (
                    <span className="text-slate-300">{s}</span>
                  ) : (
                    <a href={s} target="_blank" rel="noreferrer" className="break-all text-sky-300 hover:text-sky-200">
                      {s}
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-3 text-xs text-slate-400">
              Do not treat mock sources as legal advice. Always verify current regulations with counsel.
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
