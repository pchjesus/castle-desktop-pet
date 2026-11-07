# B-CANONICAL-06 — Context menu and visual-proportions review

## User-verified Windows behavior
v0.5 real Windows 11: sprite drag, 180px default, right-click functionality, and transparent-pixel click-through all passed. However, a narrow native-looking `Castle Desktop Pet` title strip still appears **after right-click**, not at initial startup.

## UI fix
Replace `Menu.buildFromTemplate(...).popup({window:win})` with a separate **borderless transparent HTML context-menu window**. This avoids invoking the native menu popup and keeps the pet window frameless. Suppress `system-context-menu` on Windows; never restore CSS native draggable regions. Preserve alpha hit-test, custom drag and desktop click-through. Custom menu handles nine size presets, six real B keyposes, and direct image diagnostics for blocked/missing poses. Verify no native frame in **both** windows in Windows CI; final actual Windows 11 user confirmation still needed.

## User visual comparison
Screenshots dated 2026-11-07 show Smoking (image 045413) and Firing (image 045444) at a comparable window scale. **Visual recommendation:** establish *Drawing / Firing / Working* as the preferred proportion baseline (smaller head compared with body, slightly taller adult SD look). Compared with them, *Idle / Smoking / Sitting* need relative head/body proportion review.
- Source nine B canonical images are permanently immutable.
- Whole-image scaling changes absolute size **but cannot correct head-to-body ratio**. Do not claim a fix from padding/centering alone.
- Next artistically revised derivatives must retain exact B outfit, facial likeness, accessories, stance identity, fingers and revolvers, with no forehead scar.
- Firing Dynamic / Dual Firing / Speaking stay diagnostic preview; Dual Firing background mask blocked and Speaking face-only.
- All nine existing original images remain reachable through the diagnostic viewer. The menu does not display blocked art as a complete real-pet animation.
- Do not mark any revised proportion image visually approved without user examination.

## Validation
CI: strict TS build, Node tests, offline HTML sync. Windows QA: render custom menu HTML, verify button sets, contents and zero frame chrome, route one menu size command, and retain live B sprites/alpha hit-testing. Screenshot review still needed from the user's Windows PC after native-menu removal.
