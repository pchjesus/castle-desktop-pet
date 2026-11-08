# Castle Desktop Pet — Current A/B lineage (2026-11-07)
User correction: the **initial prototype is NOT later A**. Its pre-migration source lives only on `archive/initial-prototype-20261107`. In current main, the desktop must show the **later B** mustang official artwork derivative from the nine canonical originals, not the initial olive-jacket prototype.

## Asset identity
- **Later A**: `design/references/akila-sheet-02.png` blouson variant. Not a standalone runtime pack; unavailable rather than incorrectly using initial prototype.
- **Later B**: 9 immutable official images `design/canonical/b-mustang-20261107/approved_visual_sources/`, B QA derivatives `src/characters/candidates/b-mustang-20261107/action-pack-v04/`.
- B QA active by default. `mustang.ready=false` explicitly indicates final visual sign-off still outstanding, not legacy A runtime.
- JPEG-derived Dual Firing is blocked. Speaking crops are face-only; no invalid full-size fallback.

## Remaining work
### B-CANONICAL-07 review-only candidates
See `docs/B_CANONICAL_07_PROPORTIONS.md`. New Idle/Smoking/Sitting PNGs live in `proportions-v07`, separately from official originals and active v04. The offline preview has a five-image comparison, manual anatomical guides and separate `b07/*` review-note keys. None are visually approved or registered in the pet. Sitting neck/shoulder continuity and generated hand/prop/detail drift need user inspection. Do not merge or apply candidates without explicit user approval.

Manual visual QA 180/240/360 and windows 10/11; fix image fringes, blocked masks and Speaking; later A standalone sprite extraction only from later A design; integrate per-outfit action sequences after approval. Avoid altering canonical originals or introducing any first-prototype art. `npm ci`, `npm run build`, `npm test`, `npm run preview:package`.

See `docs/AB_ASSET_CONTRACT_2026-11-07.md`, `docs/B_MUSTANG_CANONICAL_ASSETS_2026-11-07.md`. No releases without user approval.
