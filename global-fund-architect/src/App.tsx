import React, { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, type Node, type Edge } from "reactflow";
import { Loader2, Menu, X } from "lucide-react";
import { useGraphStore } from "./store/graphStore";
import { useInvestorStore } from "./store/investorStore";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { init, isLoading, nodes, edges, selectedNodeId, parentByChild, nodesById, selectNode } = useGraphStore((s) => ({
    init: s.init,
    isLoading: s.isLoading,
    nodes: s.nodes,
    edges: s.edges,
    selectedNodeId: s.selectedNodeId,
    parentByChild: s.parentByChild,
    nodesById: s.nodesById,
    selectNode: s.selectNode
  }));

  const { weights, constraints } = useInvestorStore((s) => ({ weights: s.weights, constraints: s.constraints }));

  useEffect(() => {
    void init();
  }, [init]);

  const laidOut = useMemo(() => {
    const { nodes: n, edges: e } = layoutDagre(nodes, edges, { rankdir: "TB" });
    return { nodes: n, edges: e };
  }, [nodes, edges]);

  const leafIds = useMemo(() => {
    const outgoing = new Set<string>();
    for (const e of laidOut.edges) outgoing.add(e.source);
    return laidOut.nodes.map((n) => n.id).filter((id) => !outgoing.has(id));
  }, [laidOut.edges, laidOut.nodes]);

  const topPaths = useMemo(() => {
    return computeTopPaths({ leafIds, parentByChild, nodesById, weights, constraints });
  }, [leafIds, parentByChild, nodesById, weights, constraints]);

  const topEdgeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of topPaths) {
      for (let i = 0; i < p.pathNodeIds.length - 1; i++) {
        const a = p.pathNodeIds[i],
          b = p.pathNodeIds[i + 1];
        ids.add(`e::${a}-->${b}`);
      }
    }
    return ids;
  }, [topPaths]);

  const { fadedSet } = useMemo(() => {
    const active = new Set<string>();
    const faded = new Set<string>();

    if (!selectedNodeId) {
      return { activeSet: active, fadedSet: faded };
    }

    let cur: string | undefined | null = selectedNodeId;
    while (cur) {
      active.add(cur);
      cur = parentByChild[cur] ?? null;
    }

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
      return {
        ...n,
        style: {
          ...(n.style ?? {}),
          opacity: selectedNodeId ? (isFaded ? 0.2 : 1.0) : 1.0
        }
      };
    });
  }, [laidOut.nodes, fadedSet, selectedNodeId]);

  const styledEdges: Edge[] = useMemo(() => {
    return laidOut.edges.map((e) => {
      const isFadedEdge = selectedNodeId ? fadedSet.has(e.target) || fadedSet.has(e.source) : false;

      const base = {
        ...e,
        animated: topEdgeIds.has(e.id),
        style: {
          ...(e.style ?? {}),
          strokeWidth: topEdgeIds.has(e.id) ? 2.5 : 1.2,
          opacity: selectedNodeId ? (isFadedEdge ? 0.25 : 0.95) : 0.95
        }
      } as Edge;

      if (selectedNodeId && isFadedEdge) {
        base.style = { ...(base.style ?? {}), stroke: "#fca5a5" };
      }

      return base;
    });
  }, [laidOut.edges, fadedSet, selectedNodeId, topEdgeIds]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800/90 bg-slate-950/95 backdrop-blur">
        <div className="site-container flex min-h-[72px] items-center justify-between gap-4">
          <a href="#top" className="text-sm font-semibold tracking-wide text-slate-200">Global Fund Architect</a>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#product" className="text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">Product</a>
            <a href="#trust" className="text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">Trust</a>
            <a href="#final-cta" className="btn btn-primary">Build Your Structure</a>
          </nav>
          <button
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-700 p-2 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((v) => !v)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {isMenuOpen ? (
          <div className="site-container pb-4 md:hidden">
            <div className="grid gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <a href="#product" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-2 text-slate-200 hover:bg-slate-800">Product</a>
              <a href="#trust" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-2 text-slate-200 hover:bg-slate-800">Trust</a>
              <a href="#final-cta" onClick={() => setIsMenuOpen(false)} className="btn btn-primary text-center">Build Your Structure</a>
            </div>
          </div>
        ) : null}
      </header>

      <section id="top" className="section-pad">
        <div className="site-container">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">Guided Fund Setup Platform</p>
            <h1 className="h1-display">Design your fund structure in minutes — with a guided decision map.</h1>
            <p className="body-lg mt-4 text-slate-300">
              For fund managers and advisors who need a clear path from idea to compliant setup and launch.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="#product" className="btn btn-primary">Build Your Structure</a>
              <a href="#example" className="btn btn-secondary">See Example</a>
            </div>
          </div>
        </div>
      </section>

      <section id="trust" className="pb-12">
        <div className="site-container">
          <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:grid-cols-3">
            <p className="trust-item">No credit card required</p>
            <p className="trust-item">Export-ready structuring plan</p>
            <p className="trust-item">Built for fund professionals</p>
          </div>
        </div>
      </section>

      <section id="example" className="section-pad border-y border-slate-800/80 bg-slate-950/70">
        <div className="site-container">
          <h2 className="h2-title">See the structuring map in action</h2>
          <p className="mt-2 max-w-2xl text-slate-300">
            Adjust constraints, compare jurisdictions, and open node-level guidance without leaving the workspace.
          </p>

          <div id="product" className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 shadow-soft">
            <div className="flex min-h-[70vh] flex-col lg:flex-row">
              <ControlPanel />

              <main className="relative min-h-[420px] min-w-0 flex-1">
                <div className="absolute inset-0">
                  <ReactFlow nodes={styledNodes} edges={styledEdges} nodeTypes={nodeTypes} fitView proOptions={{ hideAttribution: true }}>
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

                <div className="absolute bottom-4 left-4 right-4 max-w-[520px] rounded-2xl border border-slate-800 bg-slate-950/70 p-3 shadow-soft backdrop-blur">
                  <div className="text-xs font-semibold text-slate-200">Top 3 Paths (current view)</div>
                  <ol className="mt-2 space-y-1 text-xs text-slate-300">
                    {topPaths.length ? (
                      topPaths.map((p, i) => (
                        <li key={p.leafId} className="flex items-center justify-between gap-3">
                          <button
                            onClick={() => selectNode(p.leafId)}
                            className="truncate text-left hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                            title="Open details"
                          >
                            {i + 1}. {nodesById[p.leafId]?.label ?? p.leafId}
                          </button>
                          <span
                            className={cn(
                              "shrink-0 rounded-full border border-slate-800 bg-slate-900/60 px-2 py-0.5",
                              p.score >= 75 ? "text-emerald-300" : p.score >= 55 ? "text-amber-300" : "text-rose-300"
                            )}
                          >
                            {Math.round(p.score)}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-400">Expand a few nodes to compute paths.</li>
                    )}
                  </ol>
                </div>
              </main>

              <DetailsDrawer />
            </div>
          </div>
        </div>
      </section>

      <section id="final-cta" className="section-pad">
        <div className="site-container">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-8 text-center">
            <h2 className="h2-title">Ready to move from idea to launch plan?</h2>
            <p className="mt-2 text-slate-300">Build your structure in minutes and export a clear path for your team.</p>
            <a href="#product" className="btn btn-primary mt-6 inline-flex">Build Your Structure</a>
          </div>
        </div>
      </section>
    </div>
  );
}
