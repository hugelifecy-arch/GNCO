# GNCO (Global Fund Architect)

GNCO is **prototype software** for visualizing fund-structuring scenarios and compliance-oriented decision paths.

## Important notice

- GNCO is informational tooling only.
- GNCO is **not** an offer, solicitation, or recommendation.
- GNCO is **not** legal, tax, or investment advice.

## Project layout

- Main app: [`global-fund-architect/`](./global-fund-architect/)
- Canonical investor/compliance truth file: [`truth/gnco.truth.json`](./truth/gnco.truth.json)

## Quickstart (Node 20)

```bash
cd global-fund-architect
npm ci
npm run dev
npm run build:compliance
```

## Deploy target

GitHub Pages deployment is configured for `/GNCO/` and generated via GitHub Actions.
