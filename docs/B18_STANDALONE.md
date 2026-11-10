# Aquila B-18 — standalone desktop pet

## Base and scope
- Based on the user-approved `main` merge `c3b060a` (B mustang, dark rectangular resizable menu and Windows focus/title-strip quick repair).
- Do not replace any canonical B PNG, approved costume, pose or facial proportions.
- No Codex hook, Codex event listener, browser bridge, Brave extension, cloud service, API key or background polling of other applications.
- This draft branch is not a release. The approved `main` is unchanged until user acceptance.

## Behavior
- Working is an ordinary autonomous pose with default relative weight **12**; the existing 0–40 relative-weight controls still allow the user to turn it off.
- Automatic movement, dialogue, and post-automatic-shot cooldown have separate **1–15 minute** sliders.
- On application start, legacy quiet/default/active preferences migrate to fixed minutes: movement 8/3/2, dialogue 10/5/2. Shot cooldown defaults to 4 minutes. Existing explicit fixed minute preferences are preserved. These values persist in `behavior.json`.
- A manual action, current dialogue, ongoing timer or firing animation should not be interrupted when only a slider changes. Manually triggered firing bypasses the automatic cooldown.

## Windows-only event reactions
- **AC connected (`on-ac`)**: during the quiet base pose, transition directly to approved Working for its normal short duration, saying “남이 망가뜨리게 둘 바에야.. 먼저 작업부터, 처리한다.”
- **AC disconnected (`on-battery`)**: keep the current idle/base pose; say exactly “충전기.. 그놈이 네게 신중함과 유연함을 더해줄 거다.”
- **Lock (`lock-screen`)**: pause visible behavior and hide speech.
- **Unlock (`unlock-screen`)**: resume behavior and, when free, say “여러모로... 나쁘지 않았다. 신입.”
- System notifications never override manually held poses, and the same kind of notification has a 20-second throttle. If another line is active, no delayed replay is queued.
- These are native Electron `powerMonitor` events; they do not contact another program or service.

## Dialogue provenance
- The former `E-jobStart` content is now `PWR-AC-01`, used for the AC-connected Working response.
- The former `E-testPassed` content is now `C-CODE-01`, an **ordinary normal-rarity autonomous dialogue** (no special weighting) with the original text “코딩 실력은 인정하지. 감탄했다, 오픈AI.”
- Previously deployment-specific `O-10` is now part of the ordinary dialogue pool and can also play on unlock.
- Exact character lines are preserved as approved; their classification does not assert independently verified webtoon wording.

## Manual Windows acceptance
1. Extract the entire QA ZIP, close the prior pet, and launch `CastlePet.exe`.
2. In **우클릭 → 빈도**, adjust all three minute sliders and reopen to verify persistence. Verify Working's relative weight is 12 by default, and it can be set to zero.
3. Plug and unplug the laptop charger. Confirm the Working pose/AC line and the exact unplug line, preferably while the pet is at rest.
4. Lock Windows, then unlock. Verify the pet pauses/resumes without queued dialogue bursts.
5. Repeat the pet-click → click-other-window sequence and confirm the approved fast title-strip repair still works.
6. Confirm no Codex or Brave setup, status, background listener, test button or extension is present.

## Release boundary
- Use a new development branch and draft PR until the user confirms the Windows result.
- Do not merge into `main`, create a GitHub Release, or deploy without the user's approval.
