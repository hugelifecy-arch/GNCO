import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, type Edge, type Node, type NodeTypes } from "reactflow";
import { Loader2, SlidersHorizontal, Info, X } from "lucide-react";
import { useGraphStore } from "../../store/graphStore";
import { useInvestorStore } from "../../store/investorStore";
import { computeNodeFit, computeTopPaths } from "../../utils/scoring";
import type { ConstraintKey, FactorKey, FundNode } from "../../types";
import { SOURCE_FALLBACK } from "../../data/mockDataManager";

const presets: Record<string, Record<FactorKey, number>> = {
  balanced: { speed: 70, cost: 55, governance: 80, digital: 60 },
  fast_setup: { speed: 90, cost: 60, governance: 55, digital: 45 },
  low_cost: { speed: 55, cost: 95, governance: 55, digital: 45 },
  institutional: { speed: 55, cost: 45, governance: 95, digital: 45 },
  digital_first: { speed: 60, cost: 45, governance: 65, digital: 95 }
};

const presetOptions = [
  { value: "balanced", label: "Balanced" },
  { value: "fast_setup", label: "Fast Setup" },
  { value: "low_cost", label: "Low Cost" },
  { value: "institutional", label: "Institutional Governance" },
  { value: "digital_first", label: "Digital First" }
] as const;

const topSliderKeys: FactorKey[] = ["speed", "cost", "governance"];

const factorLabels: Record<FactorKey, string> = {
  speed: "Speed",
  cost: "Cost",
  governance: "Governance",
  digital: "Digital Readiness"
};

const factorHelp: Record<FactorKey, string> = {
  speed: "Speed: favors jurisdictions with faster setup/ops.",
  cost: "Cost: prioritizes lower setup and operating burden.",
  governance: "Governance: favors stronger oversight and institutional alignment.",
  digital: "Digital readiness: favors tech-enabled structures and operations."
};

const constraintLabels: Record<ConstraintKey, string> = {
  EU_PASSPORT: "Must have EU Passport",
  TOKENIZATION: "Must allow Tokenization",
  CRYPTO_FINANCING: "Must allow Crypto Financing"
};

type Props = {
  isLoading: boolean;
  styledNodes: Node[];
  styledEdges: Edge[];
  nodeTypes: NodeTypes;
  leafIds: string[];
  parentByChild: Record<string, string | undefined>;
  nodesById: ReturnType<typeof useGraphStore.getState>["nodesById"];
};

function getBadges(weights: Record<FactorKey, number>): string[] {
  return (["speed", "cost", "digital", "governance"] as FactorKey[])
    .sort((a, b) => weights[b] - weights[a])
    .slice(0, 3)
    .map((key) => {
      if (key === "speed") return "Fast";
      if (key === "cost") return "Low Cost";
      if (key === "digital") return "Digital";
      return "Governance";
    });
}

export function WorkspaceDemoSection({
  isLoading,
  styledNodes,
  styledEdges,
  nodeTypes,
  leafIds,
  parentByChild,
  nodesById
}: Props) {
  const [activeTab, setActiveTab] = useState<"goal" | "constraints" | "explain">("goal");
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [showAllJurisdictions, setShowAllJurisdictions] = useState(false);
  const [showMobileInspector, setShowMobileInspector] = useState(true);
  const [preset, setPreset] = useState("fast_setup");
  const initializedScenario = useRef(false);

  const { selectedNodeId, selectNode, clearSelection } = useGraphStore((s) => ({
    selectedNodeId: s.selectedNodeId,
    selectNode: s.selectNode,
    clearSelection: s.clearSelection
  }));

  const { weights, constraints, setWeight, setWeights, toggleConstraint } = useInvestorStore((s) => ({
    weights: s.weights,
    constraints: s.constraints,
    setWeight: s.setWeight,
    setWeights: s.setWeights,
    toggleConstraint: s.toggleConstraint
  }));

  const rankedPaths = useMemo(
    () =>
      computeTopPaths({
        leafIds,
        parentByChild,
        nodesById,
        weights,
        constraints,
        limit: null
      }),
    [leafIds, parentByChild, nodesById, weights, constraints]
  );

  const topFive = rankedPaths.slice(0, 5);

  const selectedNode = selectedNodeId ? nodesById[selectedNodeId] : null;
  const selectedFit = useMemo(() => {
    if (!selectedNode) return null;
    return computeNodeFit(selectedNode, weights, constraints);
  }, [selectedNode, constraints, weights]);

  const loadSampleScenario = useCallback(() => {
    setPreset("fast_setup");
    setWeights(presets.fast_setup);
    const candidate = rankedPaths[0]?.leafId ?? leafIds[0];
    if (candidate) selectNode(candidate);
  }, [leafIds, rankedPaths, selectNode, setWeights]);

  useEffect(() => {
    if (initializedScenario.current || !leafIds.length) return;
    initializedScenario.current = true;
    setWeights(presets.fast_setup);
  }, [leafIds.length, setWeights]);

  return (
    <section id="example" className="section-pad border-y border-slate-800/80 bg-slate-950/70">
      <div className="site-container">
        <h2 className="h2-title font-bold">See the structuring map in action</h2>
        <p className="mt-2 max-w-[60ch] text-slate-200">
          Compare pathways, tune scoring assumptions, and review node-level guidance in one clear workspace.
        </p>

        <div id="product" className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-soft lg:p-6">
          <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
            <aside className="hidden lg:col-span-3 lg:block" aria-label="Scoring controls">
              <div className="sticky top-24 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <ControlsContent
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  weights={weights}
                  constraints={constraints}
                  setWeight={setWeight}
                  setWeights={setWeights}
                  toggleConstraint={toggleConstraint}
                  onExplainOpen={() => setShowExplainModal(true)}
                  preset={preset}
                  setPreset={setPreset}
                />
              </div>
            </aside>

            <main className="lg:col-span-6" aria-label="Structuring map workspace">
              <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50">
                <div className="absolute inset-0">
                  <ReactFlow nodes={styledNodes} edges={styledEdges} nodeTypes={nodeTypes} fitView proOptions={{ hideAttribution: true }}>
                    <Background gap={18} size={1} />
                    <Controls />
                    <MiniMap pannable zoomable />
                  </ReactFlow>
                </div>

                {isLoading ? (
                  <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-4 py-2 text-sm">
                      <Loader2 size={16} className="animate-spin" />
                      Loading nodes…
                    </div>
                  </div>
                ) : null}

                {!selectedNode ? (
                  <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-slate-700 bg-slate-950/90 p-4">
                    <h3 className="text-base font-semibold text-slate-100">Quick start</h3>
                    <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-300">
                      <li>Choose a jurisdiction</li>
                      <li>Pick a preset goal</li>
                      <li>Adjust sliders to refine the ranking</li>
                    </ol>
                    <button
                      onClick={loadSampleScenario}
                      className="btn btn-primary mt-4 w-full sm:w-auto"
                      aria-label="Load a sample scenario"
                    >
                      Load a sample scenario
                    </button>
                  </div>
                ) : null}
              </div>

              <section className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4" aria-label="Ranked jurisdictions">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-100">Top jurisdictions</h3>
                  <button
                    onClick={() => setShowAllJurisdictions(true)}
                    className="text-sm text-sky-300 underline-offset-2 hover:text-sky-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    View all jurisdictions
                  </button>
                </div>
                <ul className="mt-3 space-y-2" role="listbox" aria-label="Top jurisdictions">
                  {topFive.map((item, index) => {
                    const node = nodesById[item.leafId];
                    const isActive = selectedNodeId === item.leafId;
                    const badges = getBadges(weights);
                    return (
                      <li key={item.leafId}>
                        <button
                          className={`w-full rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                            isActive ? "border-sky-400 bg-slate-900" : "border-slate-800 bg-slate-950/60 hover:border-slate-600"
                          }`}
                          aria-selected={isActive}
                          aria-label={`Select ranked jurisdiction ${node?.label ?? item.leafId}`}
                          onClick={() => selectNode(item.leafId)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-slate-300">#{index + 1}</span>
                              <span className="text-sm font-medium text-slate-100">{node?.label ?? item.leafId}</span>
                            </div>
                            <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-200">Score {Math.round(item.score)}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {badges.map((badge) => (
                              <span key={badge} className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300">
                                {badge}
                              </span>
                            ))}
                            <span className="ml-auto text-xs text-sky-300">Select</span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <div className="mt-4 lg:hidden">
                <button
                  onClick={() => setShowMobileInspector((v) => !v)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-left text-sm font-semibold text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  aria-expanded={showMobileInspector}
                  aria-controls="mobile-inspector"
                >
                  Selection details
                </button>
                {showMobileInspector ? (
                  <div id="mobile-inspector" className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                    <InspectorPanel node={selectedNode} fit={selectedFit} onClearSelection={clearSelection} />
                  </div>
                ) : null}
              </div>
            </main>

            <aside className="hidden lg:col-span-3 lg:block" aria-label="Selection inspector">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                <InspectorPanel node={selectedNode} fit={selectedFit} onClearSelection={clearSelection} />
              </div>
            </aside>
          </div>
        </div>
      </div>

      <button
        onClick={() => setShowMobileControls(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-sky-400/70 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-100 shadow-soft lg:hidden"
        aria-label="Open scoring controls"
      >
        <SlidersHorizontal size={16} />
        Adjust scoring
      </button>

      {showMobileControls ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/60 lg:hidden" role="dialog" aria-modal="true" aria-label="Scoring controls">
          <div className="max-h-[88vh] w-full rounded-t-2xl border border-slate-700 bg-slate-950 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-100">Adjust scoring</div>
              <button
                onClick={() => setShowMobileControls(false)}
                aria-label="Close controls"
                className="rounded-lg border border-slate-700 p-2 text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto">
              <ControlsContent
                activeTab={activeTab}
                onTabChange={setActiveTab}
                weights={weights}
                constraints={constraints}
                setWeight={setWeight}
                setWeights={setWeights}
                toggleConstraint={toggleConstraint}
                onExplainOpen={() => setShowExplainModal(true)}
                preset={preset}
                setPreset={setPreset}
              />
            </div>
          </div>
        </div>
      ) : null}

      {showExplainModal ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="How scoring works">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold">How scoring works</h4>
              <button onClick={() => setShowExplainModal(false)} aria-label="Close explanation" className="rounded-lg border border-slate-700 p-2">
                <X size={16} />
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Scores combine weighted factors (speed, cost, governance, digital readiness). Cost is inverted so lower burden improves fit.
              Hard constraints can disable options that do not meet required tags.
            </p>
          </div>
        </div>
      ) : null}

      {showAllJurisdictions ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="All jurisdictions list">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-100">All ranked jurisdictions</h4>
              <button onClick={() => setShowAllJurisdictions(false)} aria-label="Close jurisdiction list" className="rounded-lg border border-slate-700 p-2">
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <ul className="space-y-2">
                {rankedPaths.map((item, index) => (
                  <li key={item.leafId} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2">
                    <span className="text-sm text-slate-200">#{index + 1} {nodesById[item.leafId]?.label ?? item.leafId}</span>
                    <button
                      onClick={() => {
                        selectNode(item.leafId);
                        setShowAllJurisdictions(false);
                      }}
                      className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                    >
                      Select ({Math.round(item.score)})
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

type ControlsContentProps = {
  preset: string;
  setPreset: (preset: string) => void;
  activeTab: "goal" | "constraints" | "explain";
  onTabChange: (tab: "goal" | "constraints" | "explain") => void;
  weights: Record<FactorKey, number>;
  constraints: Record<ConstraintKey, boolean>;
  setWeight: (k: FactorKey, v: number) => void;
  setWeights: (w: Partial<Record<FactorKey, number>>) => void;
  toggleConstraint: (k: ConstraintKey) => void;
  onExplainOpen: () => void;
};

function ControlsContent({ activeTab, onTabChange, weights, constraints, setWeight, setWeights, toggleConstraint, onExplainOpen, preset, setPreset }: ControlsContentProps) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Control panel tabs">
        {(["goal", "constraints", "explain"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            className={`min-h-[44px] rounded-xl px-3 text-sm capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              activeTab === tab ? "border border-slate-700 bg-slate-950 text-slate-100" : "bg-slate-900/50 text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "goal" ? (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-100">Preset goal</label>
            <select
              onChange={(e) => {
                setPreset(e.target.value);
                setWeights(presets[e.target.value]);
              }}
              value={preset}
              aria-label="Preset goal"
              className="mt-2 min-h-[44px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm"
            >
              {presetOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          {topSliderKeys.map((key) => (
            <div key={key}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-100" title={factorHelp[key]}>{factorLabels[key]}</label>
                <span className="text-sm text-slate-300">{weights[key]}</span>
              </div>
              <p className="text-xs text-slate-400">{factorHelp[key]}</p>
              <input
                type="range"
                min={0}
                max={100}
                value={weights[key]}
                aria-label={`${factorLabels[key]} weight`}
                onChange={(e) => setWeight(key, Number(e.target.value))}
                className="mt-2 w-full accent-sky-400"
              />
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "constraints" ? (
        <div className="mt-4 space-y-2">
          {(Object.keys(constraints) as ConstraintKey[]).map((key) => (
            <label key={key} className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100">
              <span className="min-w-0 break-words pr-1">{constraintLabels[key]}</span>
              <input type="checkbox" checked={constraints[key]} onChange={() => toggleConstraint(key)} aria-label={constraintLabels[key]} className="h-4 w-4 shrink-0 accent-sky-400" />
            </label>
          ))}
        </div>
      ) : null}

      {activeTab === "explain" ? (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-slate-300">
          <div className="mb-2 flex items-center gap-2 font-semibold text-slate-100"><Info size={14} />How scoring works</div>
          <p>Each node receives a weighted fit score from speed, cost, governance, and digital readiness, then constraints can filter out ineligible options.</p>
          <button onClick={onExplainOpen} className="mt-3 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-100">Read detailed logic</button>
        </div>
      ) : null}
    </div>
  );
}

type InspectorPanelProps = {
  node: FundNode | null;
  fit: ReturnType<typeof computeNodeFit> | null;
  onClearSelection: () => void;
};

function InspectorPanel({ node, fit, onClearSelection }: InspectorPanelProps) {
  if (!node) {
    return <p className="text-sm text-slate-300">Select a jurisdiction or node to see guidance and scoring details.</p>;
  }

  const sources = node.data.sources.length ? node.data.sources : [SOURCE_FALLBACK];

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-100">{node.label}</h3>
          <p className="text-xs text-slate-400">Layer {node.layer}</p>
        </div>
        <button onClick={onClearSelection} aria-label="Clear selected node" className="rounded-lg border border-slate-700 p-2 text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400">
          <X size={14} />
        </button>
      </div>
      <p className="text-sm text-slate-300">{node.summary}</p>
      {fit ? <p className="text-xs text-slate-300">Fit score {Math.round(fit.fitScore)} · Raw {Math.round(fit.rawScore)}</p> : null}
      <div>
        <div className="text-xs font-semibold text-slate-200">Sources</div>
        <ul className="mt-1 space-y-1 text-xs text-slate-400">
          {sources.slice(0, 3).map((source: string, idx: number) => (
            <li key={`${source}-${idx}`} className="truncate">{source}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
