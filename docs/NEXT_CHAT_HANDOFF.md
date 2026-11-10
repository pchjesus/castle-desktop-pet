# Castle Desktop Pet — Current A/B lineage (2026-11-07)
User correction: the **initial prototype is NOT later A**. Its pre-migration source lives only on `archive/initial-prototype-20261107`. In current main, the desktop must show the **later B** mustang official artwork derivative from the nine canonical originals, not the initial olive-jacket prototype.

## Asset identity
- **Later A**: `design/references/akila-sheet-02.png` blouson variant. Not a standalone runtime pack; unavailable rather than incorrectly using initial prototype.
- **Later B**: 9 immutable official images `design/canonical/b-mustang-20261107/approved_visual_sources/`, B QA derivatives `src/characters/candidates/b-mustang-20261107/action-pack-v04/`.
- B QA active by default. `mustang.ready=true` reflects explicit user approval of the B pose pack, not legacy A runtime.
- JPEG-derived Dual Firing is blocked. Speaking crops are face-only; no invalid full-size fallback.

## B-CANONICAL-09 current status
Idle and Smoking v07 and Sitting v08 are user-approved and registered in the runtime. See `approved-runtime.json` for their hashes and `B_CANONICAL_09_RUNTIME.md` for validation; the following B-07/08 notes describe historical status. B-12 subsequently approved B-11 Speaking and Firing Dynamic.

## Remaining work
### B-CANONICAL-07 review-only candidates
See `docs/B_CANONICAL_07_PROPORTIONS.md`. B-07 source images are preserved separately from official originals. The offline preview retains the comparison, manual anatomical guides and separate `b07/*` review-note keys. B-07 Sitting remains unapproved; the user approved B-07 Idle/Smoking and B-08 Sitting in B-CANONICAL-09. Do not merge main without explicit user authorization.

Manual visual QA 180/240/360 and windows 10/11; fix image fringes, blocked masks and Speaking; later A standalone sprite extraction only from later A design; integrate per-outfit action sequences after approval. Avoid altering canonical originals or introducing any first-prototype art. `npm ci`, `npm run build`, `npm test`, `npm run preview:package`.

See `docs/AB_ASSET_CONTRACT_2026-11-07.md`, `docs/B_MUSTANG_CANONICAL_ASSETS_2026-11-07.md`. No releases without user approval.

## B-CANONICAL-10 (historical; B-12 supersedes approval status)
Review-only `cleanup-v10` contains Dual Firing / Firing Dynamic edits and seven full-body Speaking trials, all unapproved. See `B_CANONICAL_10_REVIEW.md` for alpha-composited comparison screenshots, hashes and remaining quality limitations. The approved runtime images and live registry remain unchanged. Do not interpret raw RGB behind transparent pixels as visible background; inspect alpha compositing on light/dark/checker backgrounds.

## B-CANONICAL-11 (historical; B-12 supersedes approval status)
`cleanup-v11` holds nine new unapproved trials, preserving B-10 and all approved/runtime assets. See `B_CANONICAL_11_REVIEW.md` for neck/collar and internal-background zoom comparisons, playback video, hashes and pixel metrics. Speaking still changes body pixels below the face and does not meet the mouth-only invariance requirement; do not mark complete or apply it. Use alpha-composited previews, preserve real black clothing/shadows/weapons, and require further visual review.

## B-CANONICAL-12
All nine B poses are registered; Speaking and Firing Dynamic use user-approved cleanup-v11. Speaking body pixel differences are known and accepted; do not regenerate. See `B_CANONICAL_12_RUNTIME.md`. Previous candidate status notes are historical.

## B-CANONICAL-13 next work — user-approved behavior/dialogue design v1.7 (2026-11-09)
**Source of truth:** [DIALOGUE_AND_BEHAVIOR_SPEC.md](DIALOGUE_AND_BEHAVIOR_SPEC.md). This is a planning document; B-13 implementation has **not** started.

- Base pose defaults to **Smoking**, with user switch to Idle; after a transient action return to selected base, never always idle.
- Auto action interval **2–3 minutes**, automatic shooting cooldown **3–5 minutes** (a cooldown, not guaranteed fire interval); both tunable from future status UI, autonomy and auto-fire default ON.
- Action distribution: opposite rest pose 10%, sitting 18%, speaking 30%, drawing 12%, firing 18%, dual firing 6%, firing dynamic 6%.
- Dialogue registry: preserve user-provided original lines, distinguish adaptations/creative text, 4 independent `부동심` fragments, fixed Cone/Firing Dynamic homage, 5/6-click Black Mamba easter egg.
- **Codex event approval change**: jobStart = `남이 망가뜨리게 둘 바에야.. 먼저 작업부터, 처리한다.`; testPassed unchanged; deploymentComplete = `여러모로... 나쁘지 않았다. 신입.`. Drop old jobStart phrase. These are future integrations, not B-13 implementation.
- B-13: autonomous scheduling, clicks and dialogue behavior; B-14: cartoon/game status UI, archives, help and extended settings; B-15: Codex linkage. Keep user-approved B images immutable and PR #11 draft, no merge/deploy without approval.

## B-CANONICAL-13
Implemented v1.7 behavior/controller and dialogue registry. Default Smoking; renderer uses managed animation completion and restores configured base. Settings persist in behavior.json via the existing custom menu. See B_CANONICAL_13_BEHAVIOR.md for proposed timing/cooldown defaults and tests. External Codex integration and B-14 UI remain out of scope. Approved image files/mappings are unchanged.

## B-CANONICAL-13.1
See [B_CANONICAL_13_1_UX_HOTFIX.md](B_CANONICAL_13_1_UX_HOTFIX.md). Native speech now uses a separate click-through transparent surface; pet window geometry/settings are unchanged. Dynamic lead-in is 1s, approved shot 1.5s, aftermath .85s; speech readability is independent. B-only managed rendering decodes before 160ms crossfade and uses restrained presentation effects. Approved assets/mappings/hashes and B-13 behavior contracts remain unchanged. Browser evidence is not native Windows approval; see the matching Windows smoke run and QA artifact, then user-device visual review. Keep PR #11 draft; no merge/release/deploy.

B-13.1 runtime code `629cfe0`: Windows-2022 GUI smoke [run #122](https://github.com/pchjesus/castle-desktop-pet/actions/runs/42542164281) passed all 12 compositions and eight speech-edge placements. New portable artifact `castle-pet-windows-b13-1-qa-unapproved` includes native captures/report. Unit tests: 71; B preview browser: 81 checks; B13 behavior and B13.1 browser QA passed. User-device Windows 10/11 visual approval remains outstanding. See the B-13.1 report for links and scope.

## B-CANONICAL-13.2
See [B_CANONICAL_13_2_BEHAVIOR_STABILITY.md](B_CANONICAL_13_2_BEHAVIOR_STABILITY.md). Default movement ON/Default (2–3m), autonomous dialogue ON/Default (4–6m), auto-fire ON. Separate Quiet/Default/Active presets and toggles persist in behavior.json v2; old autonomy OFF migrates both OFF. Speaking retains 30% visual weight; random text obeys its independent cadence. Auto Dynamic O-01 is fixed when dialogue ON and silent when OFF; manual Dynamic always keeps O-01 and B-13.1 timing. Firing/Dual finish at 1.5/2.4s with independent readable speech. Real hide/suspend differs from native DOM occlusion; repeated resume is idempotent. Menu commands have bounded sent/received/accepted/rendered/reused QA traces. C-19 is a rare creative/adapted candidate, never an exact quote or firing gate. Smoking gets two 2s CSS smoke strands at approved source (597,282); embedded painted smoke/approved PNGs remain unchanged. Reduced Motion/exit/hide clean supplemental smoke. New Windows QA artifact: castle-pet-windows-b13-2-qa-unapproved, with real menu mouse-input/9-pose repeat traces and native smoke checks; use the matching successful PR workflow run. Browser evidence is labeled separately from Windows automation and unperformed human Windows device review. Keep PR #11 draft; no main merge/Release/deploy.

## B-CANONICAL-13.3
See [B_CANONICAL_13_3_UX_STABILITY.md](B_CANONICAL_13_3_UX_STABILITY.md). Portable entry is now `검수 QA/CastlePet.exe`: extract the entire ZIP first; internal runtime/electron.exe/HTML are not user entry points. The launcher validates full resources/main+HTML hashes. Read-only Win32 baseline audit found caption=false on pet/speech and true only on the separate diagnostic tool; the user's exact screenshot HWND was not identified. Preserve that evidence boundary and use the normal-launch/full-clear-region QA, not only four-corner checks. Smoking now uses >=2px strands; normal motion rises every2s, Reduced Motion retains opacity-only stationary wisps. Ordinary Sitting/Working/held-rest clicks and drag retain pose; warning 5/6 behavior remains. Native speech is a measured-width, light tail balloon near upper-left head; edge fallbacks protect the face. Menu is 316x316, four Korean tabs with all original settings/poses/diagnostics. PNGs/SHA/mapping/schedules/shooting/dialogue contracts unchanged. New artifacts: castle-pet-windows-b13-3-qa-unapproved, windows-b13-3-captures, windows-plain-launch.json. Use matching successful CI, distinguish browser/Windows automation/human device review. Keep PR11 draft; no main merge/Release/deploy.


## B-19 current development (2026-11-10)
- B-18.1 standalone character is **already merged into main** (baseline `986af9ba`) after user Windows confirmation of the three visible minute sliders and layout. No Codex/Brave integrations. Prior B-13/B-15 descriptions above are historical, not a request to reintroduce integrations.
- Active B-19 development branch: `feat/b19-position-favorites-dialogue-style`; Draft PR #16: https://github.com/pchjesus/castle-desktop-pet/pull/16
- New bundled features: (1) persisted **position lock** that blocks dragging, remembers the user's anchor and temporarily constrains it to the available monitor work area if disconnected; (2) saved **pose and dialogue favorites**, stars in the pose menu/dialogue archive, one-place favorite replay/removal in More; (3) independent dialogue styles **reserved/balanced/original**, changing selection preferences but neither dialogue strings nor frequency settings.
- Favorites saved locally under Electron userData (`favorites.json`); window lock saved in `window.json`; style is normalized and saved with other behavior preferences. Restrict favorite IPC to known pose/dialogue identifiers; no arbitrary path/command input.
- Canonical B nine pose images, approved timing/interaction, local Windows power/unlock dialogue, B-18 minute sliders, title-strip workaround remain unchanged. The intermittent Windows title strip remains **unresolved on the user's device** despite automated regression passes.
- Do not merge the B-19 Draft PR or publish a release until user Windows visual approval. Distinguish tests from human review. New work must stay on the B-19 feature branch, protect `main`.
