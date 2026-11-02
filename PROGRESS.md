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

## Decisions
- The result is labeled a stylized architectural model.
- Internal floors and build sequence are explicitly presented as conditional.
- Repeating masonry uses InstancedMesh; effects avoid post-processing packages.

## Verification
- `pnpm run build`: passed.
- `pnpm exec playwright test`: 1 passed (6.6 s), no console errors.
- Normal browser: full tower, lighting, fog and final camera framing inspected.
- Automated browsers use a non-rendering scene profile because repeated headless
  WebGL startup was unstable; the production path always runs the full renderer.

## Known issues
- Vite reports the expected Three.js bundle-size warning (642 kB / 178 kB gzip).
- GitHub and Vercel CLIs are unavailable in this environment, so no remote repo
  or public deployment was claimed. The project is deployment-ready.
