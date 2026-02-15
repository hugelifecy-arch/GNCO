# Global Fund Architect (GNCO app)

React + TypeScript + Vite application deployed to GitHub Pages under `/GNCO/`.

## Compliance posture

This is prototype software for informational use only.
It is not an offer or solicitation and does not provide legal/tax/investment advice.

## Requirements

- Node 20

## Run locally

```bash
npm ci
npm run dev
```

## Build with compliance checks

```bash
npm run build:compliance
```

This runs:

1. Static compliance page generation
2. Jurisdiction data validation
3. TypeScript build + Vite bundle
4. Investor claims guard scanning

## Data

Production jurisdiction data is served from:

- `public/data/jurisdictions/manifest.json`
- `public/data/jurisdictions/*.json`

`src/data/mockDataManager.ts` contains a **DEV-only fallback** dataset when local data fetch is unavailable.
