# Castle Desktop Pet — Later A/B Canonical Project

Windows Electron desktop pet derived from the user's **later A/B character designs**, not the initial prototype.

## What opens
- **QA desktop default: later B / brown mustang**. The exact nine 2026-11-07 user-approved original images are immutable in `design/canonical/b-mustang-20261107/approved_visual_sources/`. The desktop uses user-approved Idle and Smoking from `proportions-v07` and Sitting from `proportions-v08`; Drawing, Firing and Working remain in `action-pack-v04`. Dual Firing uses the user-requested revolver-casing correction; Firing Dynamic and the seven full-body Speaking frames use user-approved B-11 images. Speaking frames have known body pixel differences. See `approved-runtime.json` for exact SHA-256 values.
- **Later A / blouson** is the distinct character in `design/references/akila-sheet-02.png`. A standalone later-A runtime sprite pack has **not** been approved or populated. Never substitute early prototype assets for later A.
- Dual Firing is blocked due to mask remnants; face-only Speaking is a separate diagnostic, not a whole-body sprite.

## Initial prototype archive
The initial prototype and all pre-migration runtime sources are preserved on branch **`archive/initial-prototype-20261107`**. They must not appear in current runtime or current main content.

## QA
`npm ci && npm run build && npm test && npm run preview:package`

Run `npm start` for B as the visible QA desktop pet. `preview.html` and `preview-offline.zip` contain B visual comparisons and user-entered notes. Windows QA executable is generated on GitHub Actions and remains unapproved.

Do not equate CI pass with visual approval. No GitHub Release or Pages deployment is authorized.
