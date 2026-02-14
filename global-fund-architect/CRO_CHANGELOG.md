# CRO Update Notes

## 1) Hero clarity
- Updated the hero headline and supporting copy in `src/App.tsx` under the `#top` section.
- Added clear dual-CTA actions: **Build Your Structure** (primary) and **See Example** (secondary).

## 2) Primary CTA emphasis
- Standardized CTA styles in `src/styles.css` with reusable `.btn`, `.btn-primary`, and `.btn-secondary` classes.
- Repeated the primary CTA in the sticky header and final conversion block (`#final-cta`).

## 3) Trust near first CTA
- Added a compact trust strip directly below hero (`#trust`) with 3 proof points:
  - No credit card required
  - Export-ready structuring plan
  - Built for fund professionals

## 4) Typography + spacing system
- Added a lightweight design system in `src/styles.css`:
  - Type scale variables (`--text-h1`, `--text-h2`, `--text-body`)
  - 8px-based spacing tokens
  - Shared container width (`.site-container`) and section rhythm (`.section-pad`)
- Applied consistent heading/body utility classes in `src/App.tsx`.

## 5) Mobile fundamentals
- Added mobile navigation drawer with 44px tap targets.
- Made the workspace responsive with stacked layout on small screens.
- Updated side panels (`ControlPanel`, `DetailsDrawer`) to avoid fixed-width overflow on mobile.
- Added global `overflow-x: hidden` and verified no horizontal scroll at 320px width.

## Future hero copy edits
- Edit hero headline/subhead/CTA text in `src/App.tsx` within the `section` with `id="top"`.
