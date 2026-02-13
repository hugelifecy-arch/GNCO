import React, { useEffect, useMemo } from "react";
import ReactFlow, { Background, Controls, MiniMap, type Node, type Edge } from "reactflow";
import { Loader2 } from "lucide-react";
import { useGraphStore } from "./store/graphStore";
import { ControlPanel } from "./components/ControlPanel";
import { DetailsDrawer } from "./components/DetailsDrawer";
import { FundNodeComponent } from "./components/FundNode";
import { layoutDagre } from "./utils/layout";
import { computeTopPaths } from "./utils/scoring";

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

const nodeTypes = { fundNode: FundNodeComponent };

export default function App() {
  const { init, isLoading, nodes, edges, selectedNodeId, parentByChild, nodesById } = useGraphStore((s) => ({
    init: s.init,
    isLoading: s.isLoading,
    nodes: s.nodes,
    edges: s.edges,
    selectedNodeId: s.selectedNodeId,
    parentByChild: s.parentByChild,
    nodesById: s.nodesById
  }));

  useEffect(() => { void init(); }, [init]);

  // Layout on graph changes (dagre)
  const laidOut = useMemo(() => {
    const { nodes: n, edges: e } = layoutDagre(nodes, edges, { rankdir: "TB" });
    return { nodes: n, edges: e };
  }, [nodes, edges]);

  // Compute leaf ids for top path highlighting (visible nodes with no outgoing edges)
  const leafIds = useMemo(() => {
    const outgoing = new Set<string>();
    for (const e of laidOut.edges) outgoing.add(e.source);
    return laidOut.nodes.map(n => n.id).filter(id => !outgoing.has(id));
  }, [laidOut.edges, laidOut.nodes]);

  const topPaths = useMemo(() => {
    const nodesMap = nodesById;
    const parentMap = parentByChild;
    const nodesByIdRecord = nodesMap;
    return computeTopPaths({ leafIds, parentByChild: parentMap, nodesById: nodesByIdRecord });
  }, [leafIds, parentByChild, nodesById]);

  const topEdgeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of topPaths) {
      for (let i = 0; i < p.pathNodeIds.length - 1; i++) {
        const a = p.pathNodeIds[i], b = p.pathNodeIds[i+1];
        ids.add(`e::${a}-->${b}`);
      }
    }
    return ids;
  }, [topPaths]);

  // Ghost branch logic (opacity & red edges)
  const { activeSet, fadedSet } = useMemo(() => {
    const active = new Set<string>();
    const faded = new Set<string>();

    if (!selectedNodeId) {
      return { activeSet: active, fadedSet: faded };
    }

    // ancestors
    let cur: string | undefined | null = selectedNodeId;
    while (cur) {
      active.add(cur);
      cur = parentByChild[cur] ?? null;
    }

    // descendants (visible)
    const childrenByParent = new Map<string, string[]>();
    for (const e of laidOut.edges) {
      const arr = childrenByParent.get(e.source) ?? [];
      arr.push(e.target);
      childrenByParent.set(e.source, arr);
    }
    const stack = [...(childrenByParent.get(selectedNodeId) ?? [])];
    while (stack.length) {
      const n = stack.pop()!;
      if (active.has(n)) continue;
      active.add(n);
      const kids = childrenByParent.get(n) ?? [];
      for (const k of kids) stack.push(k);
    }

    for (const n of laidOut.nodes) {
      if (!active.has(n.id)) faded.add(n.id);
    }

    return { activeSet: active, fadedSet: faded };
  }, [selectedNodeId, parentByChild, laidOut.edges, laidOut.nodes]);

  const styledNodes: Node[] = useMemo(() => {
    return laidOut.nodes.map((n) => {
      const isFaded = selectedNodeId ? fadedSet.has(n.id) : false;
      const opacity = selectedNodeId ? (isFaded ? 0.2 : 1.0) : 1.0;
      return {
        ...n,
        style: {
          ...(n.style ?? {}),
          opacity
        }
      };
    });
  }, [laidOut.nodes, fadedSet, selectedNodeId]);

  const styledEdges: Edge[] = useMemo(() => {
    return laidOut.edges.map((e) => {
      const isFadedEdge = selectedNodeId ? (fadedSet.has(e.target) || fadedSet.has(e.source)) : false;

      const base = {
        ...e,
        animated: topEdgeIds.has(e.id),
        style: {
          ...(e.style ?? {}),
          strokeWidth: topEdgeIds.has(e.id) ? 2.5 : 1.2,
          opacity: selectedNodeId ? (isFadedEdge ? 0.25 : 0.95) : 0.95
        }
      } as Edge;

      // CRITICAL: edges to unselected siblings must be light red
      if (selectedNodeId && isFadedEdge) {
        base.style = { ...(base.style ?? {}), stroke: "#fca5a5" }; // light red
      }

      return base;
    });
  }, [laidOut.edges, fadedSet, selectedNodeId, topEdgeIds]);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <div className="flex h-full">
        <ControlPanel />

        <main className="relative flex-1">
          <div className="absolute inset-0">
            <ReactFlow
              nodes={styledNodes}
              edges={styledEdges}
              nodeTypes={nodeTypes}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={18} size={1} />
              <Controls />
              <MiniMap pannable zoomable />
            </ReactFlow>
          </div>

          {isLoading ? (
            <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm shadow-soft">
                <Loader2 size={16} className="animate-spin" />
                Loading nodes…
              </div>
            </div>
          ) : null}

          {/* Top path indicator */}
          <div className="absolute bottom-4 left-4 max-w-[520px] rounded-2xl border border-slate-800 bg-slate-950/70 p-3 shadow-soft backdrop-blur">
            <div className="text-xs font-semibold text-slate-200">Top 3 Paths (current view)</div>
            <ol className="mt-2 space-y-1 text-xs text-slate-300">
              {topPaths.length ? topPaths.map((p, i) => (
                <li key={p.leafId} className="flex items-center justify-between gap-3">
                  <span className="truncate">
                    {i + 1}. {nodesById[p.leafId]?.label ?? p.leafId}
                  </span>
                  <span className={cn(
                    "shrink-0 rounded-full border border-slate-800 bg-slate-900/60 px-2 py-0.5",
                    p.score >= 75 ? "text-emerald-300" : p.score >= 55 ? "text-amber-300" : "text-rose-300"
                  )}>
                    {Math.round(p.score)}
                  </span>
                </li>
              )) : (
                <li className="text-slate-400">Expand a few nodes to compute paths.</li>
              )}
            </ol>
          </div>
        </main>

        <DetailsDrawer />
      </div>
    </div>
  );
}
