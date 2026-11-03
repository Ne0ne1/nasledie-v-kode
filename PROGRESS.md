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
- `pnpm run export:model`: valid glTF 2.0 GLB, 212 meshes, 12 materials.
- `pnpm run render:stills`: four 1600×1000 PNG files created and inspected.
- Normal browser: full tower, lighting, fog and final camera framing inspected.
- Automated checks now run the real WebGL renderer in headed Chromium; the old
  webdriver rendering stub has been removed.

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

## Detailed exploded model — 2026-11-03
- Expanded 7 components to 23 selectable groups: decks, beam sets, column, six roof steps, cap, corbels and entrance.
- Replaced four solid floor slabs with individual boards; reused existing materials.
- Preserved assembled positions and stage visibility; bounded animation stagger for the larger part count.
- Build and WebGL renders verified; GLB regenerated (114 meshes); regression covers new component selection.

## Furnished, selectable interiors — 2026-11-03
- Added furniture and household objects on four decks: chests, tables, benches, vessels, sacks, bedding, ladders and floor hatches.
- Added hand quern and wooden bucket; each exhibit has independent picking metadata and an explanatory card.
- Furnishings remain children of the deck, preserving assembly and construction-stage behavior.
- Interiors explicitly labeled an artistic interpretation.
- Production build passed; renders and GLB updated (212 meshes, 12 materials).

## Final competition QA — 2026-11-03
- Six viewport layouts checked; fixed heading, panel, mobile-label and landscape overlaps.
- Fixed hidden-ancestor picking, x-ray exhibit selection, cinematic reset, home navigation and selection-helper disposal.
- Reduced-motion preference skips cinematic flight; real WebGL used in all browser tests.
- Main regression: 11/11 passed. Final cinematic/mobile follow-up: 5/5 passed; 12 unique tests in suite.
- GitHub destination verified: Ne0ne1/nasledie-v-kode; origin configured.
