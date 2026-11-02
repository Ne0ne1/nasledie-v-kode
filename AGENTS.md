# Наследие в коде — project guide

- Stack: Vite, JavaScript, Three.js, OrbitControls, GSAP, CSS, Playwright.
- All 3D geometry is procedural; do not add React, models or textures without need.
- Work in order: stable scene → interaction → effects → optimization → docs.
- Use instancing and shared materials; keep draw calls and pixel ratio controlled.
- Describe the tower as a stylized model, not an exact historical reconstruction.
- Read files with `rg` and focused ranges. Never inspect `node_modules` or build output.
- Test production build and critical interactions with Playwright.
- Update `PROGRESS.md` and commit after each finished stage.
- Keep the UI responsive and keyboard accessible; support reduced motion.
- Do not publish or change remote repositories without verifying the exact target.
