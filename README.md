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

Run `npm start` for B as the visible desktop pet. `preview.html` and `preview-offline.zip` contain B visual comparisons and user-entered notes.

## B-19 approved default (2026-11-10)

The user approved the standalone B-19 Windows desktop pet (squash merge PR #16). B-19 includes position lock, favorite poses/dialogues, and selectable dialogue tone. The brown mustang later-B outfit remains the default. Local behavior preferences and favorites are stored per user; no Codex/Brave connection.

### Sharing with a friend

The Windows x64 installer workflow (`.github/workflows/b19-installer.yml`) builds `CastlePet-B19-Setup-x64.exe` using the **same pinned Electron runtime** that already passes the packaged Windows QA. Unlike the QA portable `CastlePet.exe`, the installer EXE is a self-contained distribution file: a recipient runs it once to install the desktop pet, with no runtime folder to send separately. It installs for the current Windows user without elevation, adds a Start Menu entry and optionally a desktop icon.

Once the publishing workflow passes on `main`, the public download appears under GitHub [Releases](https://github.com/pchjesus/castle-desktop-pet/releases). Verify published SHA256 if sharing the unsigned EXE; Windows SmartScreen may warn. The intermittent native title strip remains a known visual issue on some PCs.

Maintain clear separation between automatic QA and user visual approval. Never replace the approved B image assets.
