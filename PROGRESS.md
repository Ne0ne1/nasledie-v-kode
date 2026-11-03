# Progress

## Completed
- Stage 1: Vite project, minimal dependencies, UI and scene architecture.
- Stage 2: procedural tapered tower, instanced stone courses, openings, floors,
  corbels, stepped roof, landscape, fog, lights and shadows.
- Stage 3: OrbitControls, raycast selection, detail cards and camera presets.
- Stage 4: exploded view, digital build stages and reassembly.
- Stage 5: x-ray opacity and cinematic reconstruction sequence.
- Stage 6: responsive museum UI, information panel and source links.
- Stage 7: adaptive quality, production build, Playwright interaction suite and
  full WebGL visual inspection in a normal browser.
- Stage 8: README, competition annotation, 3-minute demo script and Vercel config.
- Stage 9: GLB export with structural validation, four PNG renders, source list,
  technical passport and defense script.

## Decisions
- The result is labeled a stylized architectural model.
- Internal floors and build sequence are explicitly presented as conditional.
- Repeating masonry uses InstancedMesh; effects avoid post-processing packages.

## Verification
- `pnpm run build`: passed (Vite 7.3.7).
- `pnpm exec playwright test --reporter=line`: 1 passed (7.0 s).
- `pnpm run export:model`: valid glTF 2.0 GLB, 82 meshes, 7 materials.
- `pnpm run render:stills`: four 1600×1000 PNG files created and inspected.
- Normal browser: full tower, lighting, fog and final camera framing inspected.
- Automated browsers use a non-rendering scene profile because repeated headless
  WebGL startup was unstable; the production path always runs the full renderer.

## Remaining
- Owner upload and public Vercel production verification.

## Known issues
- Vite reports the expected Three.js bundle-size warning (about 642 kB / 178 kB gzip).

## Visual polish — 2026-11-03
- Warm key and cool rim lighting, brighter varied stone, reduced overlay grain.
- Corrected stone material vertex-color flag; instance colors remain enabled.
- Reframed hero/front views, increased orbit range for exploded view, lowered mountain silhouettes.
- Improved typography, control sizing and contrast; smoother existing tweens.
- Build passed; Playwright modes passed (1/1); before/after WebGL PNGs inspected.
- No Vercel project binding or Git remote found; no deployment updated.

## Information panel repair — 2026-11-03
- Removed conflicting CSS/GSAP translation; all four information buttons now open the panel in the viewport.
- Added section scrolling, animation overwrite and focus return on close.
- Refined menu spacing, source cards, reading-panel typography and exhibit accents.
- Production build passed; both Playwright tests passed (18.1s), including each menu target, footer button and Escape.
