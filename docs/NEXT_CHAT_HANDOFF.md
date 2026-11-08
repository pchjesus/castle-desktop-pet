# Castle Desktop Pet — Current A/B lineage (2026-11-07)
User correction: the **initial prototype is NOT later A**. Its pre-migration source lives only on `archive/initial-prototype-20261107`. In current main, the desktop must show the **later B** mustang official artwork derivative from the nine canonical originals, not the initial olive-jacket prototype.

## Asset identity
- **Later A**: `design/references/akila-sheet-02.png` blouson variant. Not a standalone runtime pack; unavailable rather than incorrectly using initial prototype.
- **Later B**: 9 immutable official images `design/canonical/b-mustang-20261107/approved_visual_sources/`, B QA derivatives `src/characters/candidates/b-mustang-20261107/action-pack-v04/`.
- B QA active by default. `mustang.ready=false` explicitly indicates final visual sign-off still outstanding, not legacy A runtime.
- JPEG-derived Dual Firing is blocked. Speaking crops are face-only; no invalid full-size fallback.

## B-CANONICAL-09 current status
Idle and Smoking v07 and Sitting v08 are user-approved and registered in the runtime. See `approved-runtime.json` for their hashes and `B_CANONICAL_09_RUNTIME.md` for validation; the following B-07/08 notes describe historical status. Other poses remain unchanged.

## Remaining work
### B-CANONICAL-07 review-only candidates
See `docs/B_CANONICAL_07_PROPORTIONS.md`. B-07 source images are preserved separately from official originals. The offline preview retains the comparison, manual anatomical guides and separate `b07/*` review-note keys. B-07 Sitting remains unapproved; the user approved B-07 Idle/Smoking and B-08 Sitting in B-CANONICAL-09. Do not merge main without explicit user authorization.

Manual visual QA 180/240/360 and windows 10/11; fix image fringes, blocked masks and Speaking; later A standalone sprite extraction only from later A design; integrate per-outfit action sequences after approval. Avoid altering canonical originals or introducing any first-prototype art. `npm ci`, `npm run build`, `npm test`, `npm run preview:package`.

See `docs/AB_ASSET_CONTRACT_2026-11-07.md`, `docs/B_MUSTANG_CANONICAL_ASSETS_2026-11-07.md`. No releases without user approval.

## B-CANONICAL-10
Review-only `cleanup-v10` contains Dual Firing / Firing Dynamic edits and seven full-body Speaking trials, all unapproved. See `B_CANONICAL_10_REVIEW.md` for alpha-composited comparison screenshots, hashes and remaining quality limitations. The approved runtime images and live registry remain unchanged. Do not interpret raw RGB behind transparent pixels as visible background; inspect alpha compositing on light/dark/checker backgrounds.

## B-CANONICAL-11
`cleanup-v11` holds nine new unapproved trials, preserving B-10 and all approved/runtime assets. See `B_CANONICAL_11_REVIEW.md` for neck/collar and internal-background zoom comparisons, playback video, hashes and pixel metrics. Speaking still changes body pixels below the face and does not meet the mouth-only invariance requirement; do not mark complete or apply it. Use alpha-composited previews, preserve real black clothing/shadows/weapons, and require further visual review.
