# Castle Desktop Pet — active development contract
1. The **initial prototype** is **not** later A. It is archived only in `archive/initial-prototype-20261107`. Never restore its sprites, tests or visual assets into main/current runtime.
2. The only current canonical designs are **later A (blouson)**, represented by `design/canonical/a-blouson-later/approved_reference_sheet.png`, and **later B (mustang)**, represented by the exact nine user-approved files in `design/canonical/b-mustang-20261107/approved_visual_sources/`.
3. The desktop QA runtime opens later B by default; derived sprites live under `src/characters/candidates/b-mustang-20261107/action-pack-v04/`. Official originals are immutable; verify their SHA-256.
4. Do not turn the original prototype into a fallback for later A. Later A standalone transparent sprites are not yet verified; keep that runtime outfit unavailable until proper sources are provided.
5. B dual_firing is blocked by a background mask, and Speaking seven-head reference is not a full-body runtime sprite. Present them only in diagnostics; do not substitute another outfit.
6. Preserve offline preview, Windows portable smoke, all valid B tests, drag/size/dialogues/reduced motion, and A/B isolation. Distinguish technical QA from user visual approval. Never fake successful image or GUI validation.
7. Commit to feature branch, run CI, then update main only after success. Avoid GitHub Release or Pages deployment without user authorization.
8. See `docs/AB_ASSET_CONTRACT_2026-11-07.md` and `docs/NEXT_CHAT_HANDOFF.md`.
