import dagre from "dagre";
import type { Node, Edge } from "reactflow";

export function layoutDagre(nodes: Node[], edges: Edge[], opts?: { rankdir?: "TB" | "LR" }) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));

  const rankdir = opts?.rankdir ?? "TB";
  g.setGraph({ rankdir, nodesep: 28, ranksep: 70, marginx: 24, marginy: 24 });

  for (const n of nodes) g.setNode(n.id, { width: 250, height: 96 });
  for (const e of edges) g.setEdge(e.source, e.target);

  dagre.layout(g);

  const laidOut = nodes.map((n) => {
    const p = g.node(n.id);
    return {
      ...n,
      position: { x: p.x - 125, y: p.y - 48 }
    };
  });

  return { nodes: laidOut, edges };
}
