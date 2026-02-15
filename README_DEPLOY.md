# GNCO Max Pack (Investor-grade)

This pack adds:
- `coverage.html` (Jurisdiction Coverage Library with sources + last verified + export)
- `methodology.html` (Methodology & Sources)
- `changelog.html` (Change log & update policy)
- `robots.txt` + `sitemap.xml`
- `data/jurisdictions/*.json` (date-stamped, source-linked entries)
- `assets_gnco.css` + `assets_gnco.js` (shared UI + filtering/export)
- validation script: `scripts_validate-jurisdictions.mjs`

## How to deploy into your GitHub Pages folder (/GNCO)

1) Copy these files into your `/GNCO/` folder in the repo:
   - `coverage.html`
   - `methodology.html`
   - `changelog.html`
   - `robots.txt`
   - `sitemap.xml`
   - `assets_gnco.css`
   - `assets_gnco.js`
   - `data/` folder

2) Keep your existing `investor.html` and `disclosures.html` as-is.

3) (Optional) Replace `/GNCO/index.html` with `index.proposed.html` (rename to `index.html`).

4) (Optional) Run validation locally:
   - Node 18+
   - `node scripts_validate-jurisdictions.mjs`

## Updating jurisdictions
Edit `data/jurisdictions/*.json` and re-upload. The coverage page is data-driven via `data-json` attributes (for filtering/export).
If you want full static generation, use Codex to add a generator step in your repo pipeline.

Build: 4ad1b8c
Date: 2026-02-14
