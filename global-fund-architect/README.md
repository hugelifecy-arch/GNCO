# Global Fund Architect (Mock)

High-performance decision-tree prototype for investment fund structuring.

## Stack
- React + TypeScript + Vite
- React Flow (graph engine)
- dagre (auto-layout)
- Zustand (state + persisted investor profile)
- Tailwind CSS
- lucide-react (icons)

## Non-negotiable UX rules implemented
- Click **node body** → opens Details Drawer (right sidebar).
- Click **caret** → expand/collapse only (uses `e.stopPropagation()`).
- "Ghost branch": selecting a node keeps branch opaque, fades siblings + their subtrees (opacity 0.2).
- Edges in unselected/faded branches turn **light red**.

## Lazy loading (simulated)
- Expanding any node fetches children with simulated latency.
- Data is generated deterministically per node id (stable IDs, dense tree).

## Run locally
```bash
npm install
npm run dev
```

## Notes
- Sources are intentionally limited to the URLs mandated in the spec.
- Nodes without a source show: "General market practice; verify with counsel."
