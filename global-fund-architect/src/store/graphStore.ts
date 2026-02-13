import { create } from "zustand";
import type { Node, Edge } from "reactflow";
import { mockDataManager } from "../data/mockDataManager";
import type { FundNode } from "../types";

type GraphState = {
  isLoading: boolean;
  nodes: Node[];
  edges: Edge[];
  nodesById: Record<string, FundNode>;
  selectedNodeId: string | null;
  expanded: Record<string, boolean>;
  parentByChild: Record<string, string | undefined>;
  init: () => Promise<void>;
  selectNode: (id: string) => void;
  clearSelection: () => void;
  toggleExpand: (id: string) => Promise<void>;
  collapseSubtree: (id: string) => void;
};

const rfNode = (n: FundNode): Node => ({
  id: n.id,
  type: "fundNode",
  position: { x: 0, y: 0 },
  data: { fundNodeId: n.id }
});

const rfEdge = (source: string, target: string): Edge => ({
  id: `e::${source}-->${target}`,
  source,
  target,
  type: "smoothstep"
});

function collectDescendants(rootId: string, edges: Edge[]): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const e of edges) {
    const arr = childrenByParent.get(e.source) ?? [];
    arr.push(e.target);
    childrenByParent.set(e.source, arr);
  }
  const out = new Set<string>();
  const stack = [...(childrenByParent.get(rootId) ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    if (out.has(cur)) continue;
    out.add(cur);
    const kids = childrenByParent.get(cur) ?? [];
    for (const k of kids) stack.push(k);
  }
  return out;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  isLoading: false,
  nodes: [],
  edges: [],
  nodesById: {},
  selectedNodeId: null,
  expanded: {},
  parentByChild: {},

  init: async () => {
    set({ isLoading: true });
    const roots = await mockDataManager.getRootNodes();
    const nodesById = { ...get().nodesById };
    for (const r of roots) nodesById[r.id] = r;

    set({
      isLoading: false,
      nodes: roots.map(rfNode),
      edges: [],
      nodesById,
      expanded: {},
      parentByChild: {}
    });
  },

  selectNode: (id) => set({ selectedNodeId: id }),
  clearSelection: () => set({ selectedNodeId: null }),

  toggleExpand: async (id: string) => {
    const { expanded } = get();
    if (expanded[id]) {
      get().collapseSubtree(id);
      return;
    }

    set({ isLoading: true });
    const children = await mockDataManager.fetchChildren(id);
    const s = get();

    const nodesById = { ...s.nodesById };
    for (const c of children) nodesById[c.id] = c;

    const existingNodeIds = new Set(s.nodes.map(n => n.id));
    const newNodes: Node[] = [];
    for (const c of children) {
      if (!existingNodeIds.has(c.id)) newNodes.push(rfNode(c));
    }

    const existingEdgeIds = new Set(s.edges.map(e => e.id));
    const newEdges: Edge[] = [];
    const parentByChild = { ...s.parentByChild };
    for (const c of children) {
      const e = rfEdge(id, c.id);
      if (!existingEdgeIds.has(e.id)) newEdges.push(e);
      parentByChild[c.id] = id;
    }

    set({
      isLoading: false,
      nodes: [...s.nodes, ...newNodes],
      edges: [...s.edges, ...newEdges],
      nodesById,
      expanded: { ...s.expanded, [id]: true },
      parentByChild
    });
  },

  collapseSubtree: (id: string) => {
    const s = get();
    const desc = collectDescendants(id, s.edges);

    const nodes = s.nodes.filter(n => !desc.has(n.id));
    // remove edges where either endpoint is in descendants OR edge is from root to descendant
    const edges = s.edges.filter(e => !desc.has(e.source) && !desc.has(e.target));

    const expanded = { ...s.expanded };
    for (const d of desc) delete expanded[d];
    expanded[id] = false;

    set({ nodes, edges, expanded });
  }
}));
