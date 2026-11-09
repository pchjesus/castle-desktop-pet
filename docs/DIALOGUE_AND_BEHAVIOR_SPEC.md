# Castle Desktop Pet — Dialogue & Behavior Specification v1.7
> Planning baseline for B-CANONICAL-13 onward; 2026-11-09.
> Scope: B-mustang Akila. **This is a design specification, not an implementation claim.**

## 0. Source of truth / approval boundaries
- Respect AGENTS.md, B_CANONICAL_12_RUNTIME.md, the nine approved B pose assets and `approved-runtime.json`; do not regenerate or change image SHA-256. A blouson is a separate unfinished runtime pack. Archived initial prototype is never a fallback.
- Keep all nine approved poses: idle, smoking, sitting, speaking (seven approved frames), drawing, firing, dual_firing (revolver casing correction), firing_dynamic, working.
- User-approved dialogue text below takes priority over older draft documents and current `src/characters/akila.ts` dialogue mappings; code still contains the old deploymentComplete mapping as of B-12, so B-13/B-15 must migrate it deliberately.
- Labels: **CONFIRMED** = user approved; **PROPOSED** = implementation default pending later tuning; **ORIGINAL-CANDIDATE** = wording/source requires checking against source comic before calling it an exact comic quotation. User-provided text should be preserved as specified even when it is adapted from the comic.
- No new sounds, generated art, releases, Pages deployment, or main merge without permission.

## 1. Character concept
A silent, steady, stationary desktop pet. It is interesting and autonomous when no Codex session is running, while Codex events trigger distinctive preassigned dialogue/action combos. Never make it wander, walk across screen, or chatter continuously. Character stays in place except intentional user drag. All actions finish into the *configured base pose*, not hardcoded idle.

## 2. Base pose and autonomous schedule — CONFIRMED
- Default base pose **Smoking** (Akila habitually smokes). User setting can switch base pose to **Idle**. Persist locally; apply at launch and after actions, after interruption, and on returning from hiding.
- Idle was the *old code* default; it must be changed in implementation. When base = Smoking, the opposite quiet/rest pose = Idle. When base = Idle, the 10% quiet/rest pose = Smoking.
- Autonomy default ON; after startup and each completed automatic action, pick a fresh uniform wait **2–3 minutes** before one autonomous action. Disabled: no spontaneous actions.
- Auto-fire default ON and separately toggleable. An automatic action from firing/dual_firing/firing_dynamic triggers a **3–5 minute randomized cooldown** counted from its end, not a forced shot after that interval. During cooldown exclude automatic shooting and renormalize remaining weights.
- Manual shooting and explicitly mapped Codex event shooting do not wait for autonomous-fire cooldown. Reset/reconcile cooldown and timers consistently after user interruptions. No queued/catch-up actions after hide/suspend.
- User input > Codex event > autonomous action in priority. Future Codex integration must not be implemented merely as part of the B-13 autonomy work.

### Autonomous action weights — CONFIRMED v1.7
| Action | Weight | Meaning |
| --- | ---: | --- |
| Quiet/rest: opposite of configured base (Idle when Smoking base; Smoking when Idle base) | 10% | Brief contrast; return to base |
| Sitting | 18% | 10–20 s |
| Speaking | 30% | One approved seven-frame speaking animation + dialogue |
| Drawing | 12% | Hold ~3–6 s |
| Firing | 18% | Existing ~1.5 s action |
| Dual Firing | 6% | Existing ~2.4 s action |
| Firing Dynamic | 6% | Existing ~1.5 s action, Cone homage |
| **Total** | **100%** | Automatic firing subtotal 30% |

- The persistent base pose is **not** a separately sampled `Smoking 25%` action. The rest 10% is defined relative to the chosen base; this avoids having base Smoking and repeatedly choosing Smoking as if it were a meaningful new action.
- Other previous durations are design defaults. On speech-containing actions, extend message/pose display to make the text readable rather than truncating to the 1.5–3.5 s action animation. Preserve existing approval of static frames.

### Dialogue probability when a pose is selected — PROPOSED
- Sitting 25%, Drawing 50%, Firing 30%, Dual Firing 20%; Speaking 100%. Quiet/rest 25% by default, with Smoking-specific ~35% if that is the base or explicit rest.
- Firing Dynamic is a fixed homage: the confirmed Cone line is coupled to that animation rather than randomly selecting C-16.
- Distinguish (a) chance of selecting a pose from (b) chance to speak during that pose.
- Draw dialogue from action-compatible candidates; allow silence. Suggested non-event speech pool: 30% original-inspired / 70% creative, tunable. Special and rare lines should not repeat immediately.

## 3. Dialogue registry conventions
Every record: ID, approved display text, origin (`user-supplied comic line` / `original-inspired adaptation` / `original candidate pending verification` / `original creative` / `Codex event`), approved vs proposed, associated pose(s), trigger/context, rarity, cooldown, and whether selectable randomly.
- Do not relabel original-inspired adaptations as exact original quotes.
- Original language and punctuation from the user should not be silently rewritten.
- Rare iconic original scenes should be action-specific and not repeated quickly.
- UI includes all dialogues, their origins and activation rules.

### 3A. Comic and adapted scene lines
| ID | Text | Type | Suggested association |
| --- | --- | --- | --- |
| O-01 | 그런 건 중요한 게 아니다, 애송아. | User confirmed, Cone scene | **Firing Dynamic** fixed homage; dialogue before the shot |
| O-02 | 이제 전반전 정도 지났겠군 | User confirmed | Smoking / Sitting; long Codex work candidate |
| O-03 | 부동(不動)의 마음이라는 함은.. | User confirmed | Smoking / Speaking rare |
| O-04 | 그저 감정의 통제를 이르는 것이 아니라, | User confirmed | Smoking / Speaking rare |
| O-05 | 세상 어디서라도. 그 어떤 상황에서도. 결코 굴하지 않고. | User confirmed | Smoking / Speaking rare |
| O-06 | 자신의 자유 의지를, 잃지 않음을.. 뜻한다. | User confirmed | Smoking / Speaking rare |
| O-07 | 거기까지. 경고는 방금으로 끝이다. | User-confirmed combined edited warning | Drawing; can be used for build failure |
| O-09 | 신입들 압박면접 좀 볼까. | ORIGINAL-CANDIDATE | Drawing / Speaking rare, not the discarded Codex job-start line |
| O-10 | 여러모로... 나쁘지 않았다. 신입. | User confirmed | **Codex deploymentComplete**, fixed, not general random |
| O-11 | 사명감 없는 철부지는 매가 답이다. | ORIGINAL-CANDIDATE | Drawing warning |
| O-12 | 존중을 모르는 놈들과는... 더는 못해 먹겠군. | ORIGINAL-CANDIDATE | Smoking rare complaint |
| O-13 | 난 그저.. 누가 이 작업을 망치고 있는지 알고 싶을 뿐. | User approved comic-based **adaptation** (이스크라 → 작업) | Repeated errors / Drawing or Smoking |
| O-14 | 그래도 같은 업종, 같은 조직에 속한 이에 대한 존중은 필요하지. | User approved comic-based **adaptation** | Smoking / Speaking rare |
| O-16 | 너까지 움직일 필요도 없다. 이 간격 안에선 하나님이 온다 한들 못 피하니까. | User supplied wording; original variants to be verified | Drawing rare |
| O-17 | 날 뭘로 보나. 단 한 발이면 차고 넘친다. | User supplied composite; exact source sentence boundary to be verified | Firing rare |
| O-18 | 작업에 '독'이 되는 것을 제거한다. 이게 내가 제일 중요하게 여기는 룰이다. | User approved adaptation (이스크라 → 작업) | Dual Firing rare, also error-clearing candidate |

- O-08 merged into O-07: do **not** maintain duplicate entry.
- O-15 intentionally deleted.
- O-03, O-04, O-05, O-06 are **four separate independent random items**, *never* automatically sequentially read as a four-part monologue.
- Source verification: original quote candidates compiled from NamuWiki character/acts pages in earlier planning; do not assert exactness until comic panels are verified. Comic excerpts in public distribution require a separate copyright review.
- Firing Dynamic: approved current image remains, despite a future desire to add a distinct hip-fire/fanning key pose. **Do not fabricate or generate that art within B-13.**

### 3B. Original creative lines — PROPOSED, except removed entries
| ID | Text | Association |
| --- | --- | --- |
| C-01 | 오늘은 조용하군. | Smoking / Speaking |
| C-02 | 별일 없으면 된 거다. | Speaking |
| C-03 | 머리 좀 식혀라. | Smoking |
| C-04 | 생각은 하고 움직이는 거겠지. | Smoking |
| C-05 | 시끄러운 놈들이 문제야. | Smoking |
| C-06 | 서두를 이유는 없지. | Sitting |
| C-07 | 한동안은 여기 있겠다. | Sitting |
| C-08 | 왜 그러지? | Click |
| C-09 | 용건이 있나? | Click |
| C-10 | ……할 말 없으면 가라. | Click |
| C-11 | 선을 넘지 마라. | Drawing |
| C-14 | 쓸데없는 건 걷어내라. | Working |
| C-15 | 할 일은 끝났군. | General job completed candidate |
| C-17 | 계속 지켜보지. | Speaking |
| C-18 | 한 발이면 충분하지. | Firing **superseded in spirit by O-17; default DISABLED** |

- **Remove C-12, C-13 and C-16**, replaced by O-17, O-18 and O-01 respectively. C-18 is redundant with the new O-17 and should remain disabled unless user explicitly restores it.
- Do not present any creative lines as original comic quotations.

## 4. Click interaction and Black Mamba homage — CONFIRMED concept
- Normal left click: chance of short speaking or silent/pose acknowledgement; examples C-08/09/10. Drag must remain functional and never count as a click. Right click opens contextual menu, never counts.
- Recognize five distinct left clicks in any rolling **3-second** window (even if normal dialogue output has a cooldown).
- On fifth click: immediately enter **Drawing** as a silent warning, do not fire. On the next (sixth) click while that warning is held, show one short **original-based click adaptation**: `또다시 같잖은 클릭을 조질 시에… 그땐 목구멍에 샛길 터버린다.`
- Further rapid clicks: ignore without firing or endlessly restarting. After a sensible hold, return to configured base and reset combo detection. Avoid clicks getting swallowed by alpha hit-testing or the transparent window.
- Manual context actions and drag override this interaction reliably.

## 5. Codex event contract — 3 key mappings CONFIRMED
These are design-approved combinations; integration is a *future* milestone after autonomy and UI. Existing code's old hardcoded event mapping is stale.

| Event | Approved display text | Proposed matching action |
| --- | --- | --- |
| **jobStart** | 남이 망가뜨리게 둘 바에야.. 먼저 작업부터, 처리한다. | Smoking → Working |
| **testPassed** | 코딩 실력은 인정하지. 감탄했다, 오픈AI. | Speaking / restrained acknowledgement |
| **deploymentComplete** | 여러모로... 나쁘지 않았다. 신입. | Smoking → Speaking |

- **Discard** old job-start quote `신입들 실력이나 한번 볼까.`. Do not accidentally restore it as a jobStart dialogue.
- **Move** the old deploymentComplete quote to jobStart; replace deploymentComplete quote with O-10. Keep testPassed text exactly.
- Other event mappings below are **unconfirmed candidates**; retain in planning only, do not treat as mandatory preexisting user approvals:
  - long-running job: O-02 + Smoking.
  - build success: `깔끔하게 처리했군.` + Speaking.
  - test failure: `사춘기 소년들의 장난질은 여기까지다.` + Smoking.
  - build failure: O-07 + Drawing.
  - repeated error: O-13 + Drawing.
  - generic job finished: `끝났다, 애송아. 가서 확인해.` + Firing → base (subject to later approval).
- Handle simultaneous Codex events without dialogue pileups: prioritize consequential final event over noisy intermediate events. Preserve user control priority.

## 6. Game/cartoon status UI — B-14 follow-up, not B-13's full redesign
Dark charcoal / steel / muted gold. Right-click entry into:
1. Actions: all nine approved B poses, manual command.
2. Dialogue archive: all usable dialogue, filters for original-inspired / creative / click / Codex; show origin and triggers.
3. Settings: autonomous ON/OFF, auto-fire ON/OFF, **base pose Smoking(default)/Idle**, **autonomous frequency**, **automatic firing cooldown/frequency**, local persistence.
4. Help/manual: clicks vs drag, special click Easter egg, pose controls, Codex connection status, start/hide/exit.
- Frequency presets proposed: Quiet (auto 5–10m, fire 8–10m); **Default (auto 2–3m, fire 3–5m)**; Active (auto 1–2m, fire 2–3m); optional custom min/max ranges. All presets except confirmed default are proposals and can be adjusted during UI review.
- Distinguish a *cooldown* from a *guaranteed firing interval*. Expose useful settings labels, not misleading 'shoot every N minutes'.
- Do not imply Codex is connected until external integration exists. Preserve existing Windows custom frameless menu, drag, scale, click-through, reduced motion and approved visuals.

## 7. Priority, timing, stability, verification
- User manual action > Codex event > autonomous scheduler; manual long-lived poses suppress autonomy until returning to base; explicit return starts fresh randomized wait.
- Inactivity does not backlog actions; hide/exit/visibility changes cancel or pause with safe resume and fresh interval. Avoid overlapping timers, speech/animation conflicts and completion callbacks forcing idle over the current configured base.
- Apply Reduced Motion to avoid extra interpolation/effects but retain approved pose swaps and readable text.
- Test 2–3min distribution bounds, 3–5min fire cooldown, selection and renormalization, base restoration, both base-pose selections, frequency persistence, 5/6 click sequence, timer cleanup and high-priority interruptions. Use controllable time/random functions as useful for tests, rather than waiting literal minutes.
- Preserve B-12 browser QA, Windows build/export smoke, and source SHA checks. Windows automated smoke is not the same as actual human GUI review.
- B-13 implementation scope: autonomous scheduling + click interactions + dialogue registry and speech display; settings essentials/persistence. B-14: full game/cartoon UI, dialogue archive and help. B-15: actual Codex event connection. Keep Draft PR #11; no main merge or release before explicit user request.

## 8. Current state / next chat
- GitHub: `pchjesus/castle-desktop-pet`, feature branch `feat/b-canonical-07-proportions`, Draft PR #11.
- B-12 integrated user-approved B pose art; baseline `src/characters/akila.ts` still defaults to `initialState:'idle'` and lists old `deploymentComplete` dialogue. The proposals here are not yet coded.
- Next task: B-CANONICAL-13 implementation guided by this file, without modifying any approved visual asset or implementing B-14/B-15 prematurely.

## B-13 implementation note
The v1.7 planning baseline above remains the source of approved wording. Implementation and chosen PROPOSED defaults, validation evidence and outstanding Windows/CI checks are documented in `B_CANONICAL_13_BEHAVIOR.md`. B-14/B-15 remain excluded.

## B-13.2 user-authorized implementation override
B-13.2 authorizes the three movement/dialogue presets and independent ON/OFF settings described in [B_CANONICAL_13_2_BEHAVIOR_STABILITY.md](B_CANONICAL_13_2_BEHAVIOR_STABILITY.md). Random autonomous dialogue now uses its own 8–12 / 4–6 / 2–3 minute cadence instead of per-movement probability; Speaking retains its 30% visual weight. Fixed Dynamic O-01 remains when autonomous dialogue is ON; automatic Dynamic is silent when OFF, while manual Dynamic always keeps O-01. Manual Speaking/clicks/events remain available. C-19 is a rare creative/adapted candidate, not an exact quotation. B-14 full UI/custom ranges and B-15 external linkage remain excluded.
