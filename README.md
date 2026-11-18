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

## B-21 local MP3 player (Draft, user QA pending)

Right-click Akila → **음악** to choose local MP3 files, play/pause, skip, change
volume, manage the playlist and toggle list repeat. Audio continues when the
right-click panel closes: playback runs inside the persistent pet renderer, not
the disposable menu window. The native file chooser accepts multiple MP3s and
stores **only local paths plus settings** under Electron userData in
`music-playlist.json`. Tracks are not copied or uploaded. Maximum: 200 tracks,
80 MB per file. The originals must remain in their selected folders.

Optional **박자 사격** is OFF by default, samples low-frequency transients via
the Web Audio API and briefly displays the existing firing sprite on occasional
strong beats, with a hard 11-second minimum gap. This does **not** call the
behavior controller's manual action or change its timers. Respect the existing
automatic firing OFF preference. Automatic speech lines are otherwise
untouched; additional music-only lines:
- End of non-repeating playlist: `오늘은 여기까지다.`
- Manually increasing the player volume to 90% or above: `시끄럽군.`
  (no more than once a minute)

Playlists are not shipped with any music. An original synthetic MP3 in the
codebase is used solely by Windows automated playback QA; it is never a
playlist track in production.

This feature is based on **B-20.1 PR #20** (menu stays open + Basic skin choice)
and is developed separately in **Draft PR #21**. Before approval, neither the
production `main` branch nor the existing public installer release changes.

## B-20 blouson skin (Draft PR; not released)

The B-20 work branch adds nine separately mapped transparent **blue/olive blouson** Akila PNGs at `src/characters/candidates/a-blouson-b20/`, derived from the user-selected 3×3 design sheet. Image files are 1024×1600 and checked by SHA-256 in `tests/b20-blouson.test.mjs`; original mustang source and derived images remain unmodified.

Open the right-click menu → **더보기 → 개인화 → 스킨 선택**, then choose **무스탕** or **푸른 블루종**. The appearance preference is saved to `appearance.json` under Electron per-user data; defaults to mustang on fresh installations. Changing skin re-renders the **current pose only** without replacing dialogue/behavior controllers, action weights, cadence, favorites, position lock, or Windows power/unlock handlers. Both outfits use the same nine existing action names; B-20 speaking is one illustration frame rather than B's seven-frame mouth animation.

This B-20 draft is based on the unmerged B-19.1 drag-size safeguard branch `fix/b19-drag-size-dpi-regression` (Draft PR #18), so verify and merge those changes in the correct order once the user approves. **Do not publish new EXE/replace v0.19.0 or merge B-20 before real-device review.**

## B-19 approved default (2026-11-10)

The user approved the standalone B-19 Windows desktop pet (squash merge PR #16). B-19 includes position lock, favorite poses/dialogues, and selectable dialogue tone. The brown mustang later-B outfit remains the default. Local behavior preferences and favorites are stored per user; no Codex/Brave connection.

### Sharing with a friend

The Windows x64 installer workflow (`.github/workflows/b19-installer.yml`) builds `CastlePet-B19-Setup-x64.exe` using the **same pinned Electron runtime** that already passes the packaged Windows QA. Unlike the QA portable `CastlePet.exe`, the installer EXE is a self-contained distribution file: a recipient runs it once to install the desktop pet, with no runtime folder to send separately. It installs for the current Windows user without elevation, adds a Start Menu entry and optionally a desktop icon.

Once the publishing workflow passes on `main`, the public download appears under GitHub [Releases](https://github.com/pchjesus/castle-desktop-pet/releases). Verify published SHA256 if sharing the unsigned EXE; Windows SmartScreen may warn. The intermittent native title strip remains a known visual issue on some PCs.

Maintain clear separation between automatic QA and user visual approval. Never replace the approved B image assets.
