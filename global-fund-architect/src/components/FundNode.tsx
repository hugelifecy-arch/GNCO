import React, { memo, useMemo } from "react";
import type { NodeProps } from "reactflow";
import { ChevronRight, ChevronDown, Scale, Ban, Star } from "lucide-react";
import { useGraphStore } from "../store/graphStore";
import { useInvestorStore } from "../store/investorStore";
import { computeNodeFit } from "../utils/scoring";

type RFData = { fundNodeId: string; };

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

export const FundNodeComponent = memo((props: NodeProps<RFData>) => {
  const fundNodeId = props.data.fundNodeId;
  const { nodesById, selectedNodeId, expanded, toggleExpand, selectNode } = useGraphStore((s) => ({
    nodesById: s.nodesById,
    selectedNodeId: s.selectedNodeId,
    expanded: s.expanded,
    toggleExpand: s.toggleExpand,
    selectNode: s.selectNode
  }));

  const { weights, constraints } = useInvestorStore((s) => ({ weights: s.weights, constraints: s.constraints }));

  const node = nodesById[fundNodeId];
  const isSelected = selectedNodeId === fundNodeId;
  const isExpanded = !!expanded[fundNodeId];
  const hasChildren = (node?.children?.length ?? 0) > 0;

  const fit = useMemo(() => (node ? computeNodeFit(node, weights, constraints) : null), [node, weights, constraints]);
  const score = fit ? Math.round(fit.fitScore) : 0;

  const onCaretClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // NON-NEGOTIABLE: avoid opening drawer
    if (!hasChildren) return;
    await toggleExpand(fundNodeId);
  };

  const onBodyClick = () => {
    // NON-NEGOTIABLE: Body click opens drawer, never expands/collapses
    selectNode(fundNodeId);
  };

  if (!node) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 shadow-soft w-[250px]">
        <div className="text-sm text-slate-300">Loading…</div>
      </div>
    );
  }

  const disabled = fit?.isDisabled ?? false;

  return (
    <div
      onClick={onBodyClick}
      className={cn(
        "w-[250px] rounded-2xl border px-3 py-2 shadow-soft transition",
        "bg-slate-900/85 backdrop-blur",
        isSelected ? "border-sky-400/80 ring-2 ring-sky-500/30" : "border-slate-800 hover:border-slate-700",
        disabled ? "opacity-70" : ""
      )}
    >
      <div className="flex items-start gap-2">
        <button
          aria-label={isExpanded ? "Collapse" : "Expand"}
          onClick={onCaretClick}
          className={cn(
            "mt-[2px] flex h-7 w-7 items-center justify-center rounded-lg border",
            hasChildren ? "border-slate-700 hover:bg-slate-800" : "border-slate-800 opacity-40 cursor-not-allowed"
          )}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="truncate font-semibold">{node.label}</div>
            <span className="text-[11px] px-2 py-0.5 rounded-full border border-slate-700 text-slate-200">
              L{node.layer}
            </span>
          </div>

          <div className="mt-1 line-clamp-2 text-xs text-slate-300">
            {node.summary}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-slate-300">
              <Scale size={14} />
              <span>Fit: <span className={cn("font-semibold", score >= 75 ? "text-emerald-300" : score >= 55 ? "text-amber-300" : "text-rose-300")}>{score}</span></span>
            </div>

            <div className="flex items-center gap-1">
              {disabled ? (
                <span
                  title={fit?.missingTags?.length ? `Missing: ${fit.missingTags.join(", ")}` : "Filtered by constraints"}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-rose-600/40 text-rose-200"
                >
                  <Ban size={12} /> Filtered
                </span>
              ) : isSelected ? (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-sky-500/40 text-sky-200">
                  <Star size={12} /> Active
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

FundNodeComponent.displayName = "FundNodeComponent";
