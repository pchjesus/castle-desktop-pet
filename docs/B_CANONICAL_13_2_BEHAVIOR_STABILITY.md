# B-13.2 behavior stability and independent cadence

Baseline `b0b7eef`, same feature branch / Draft PR #11. All approved image bytes, SHA manifests and runtime mappings remain unchanged. B-14 full UI, B-15 external Codex integration, new art/sounds/dependencies, merge/release/deploy remain excluded.

## Independent schedules and persistence

| Setting | Quiet | Default | Active |
| --- | --- | --- | --- |
| Movement (`autonomy`) | 5–10 min | 2–3 min | 1–2 min |
| Random autonomous dialogue (`dialogueEnabled`) | 8–12 min | 4–6 min | 2–3 min |

Fresh defaults: Smoking, movement ON/Default, dialogue ON/Default, auto-fire ON. The existing `autonomy` field now controls movement; frequency keys are `movementFrequency` and `dialogueFrequency`. `behavior.json` saves `settingsVersion:2`. Old autonomy OFF migrates **both** schedules OFF, preserving the user's prior quiet preference; each can then be enabled independently. Old base and auto-fire choices persist. Invalid presets fall back to Default; absent/corrupt files use safe defaults. Load does not overwrite the old file before a setting is saved.

The two schedules have separate handles/revisions. Normal movement completion starts a new movement wait without restarting the dialogue clock. Dialogue can run while movement is OFF, at the chosen base pose without a pose change. At an automatic rest/Sitting/Speaking pose it chooses compatible text; at Idle it may use the Speaking pool while retaining Idle. Speaking still has **30% movement weight** and plays the seven approved frames; it does not bypass the random dialogue cadence. Busy manual/event/shooting slots are discarded and rescheduled, never queued. A manual held pose blocks both autonomous pose changes and autonomous lines. Manual input cancels lower-priority speech/actions. Hidden/suspend/dispose cancels all clocks; resume starts fresh waits, with no catch-up. Cancelled scheduler/action/speech callbacks have independent revision checks.

The fixed **Dynamic O-01 action cue** remains outside the random dialogue cadence when autonomous dialogue is ON; it counts as a recent automatic line so the independent scheduler cannot immediately add another. When autonomous dialogue is OFF, **automatic Dynamic is silent**, retaining its 1s preparation / 1.5s shot / .85s aftermath. **Manual Dynamic always retains O-01**, and clicks/manual Speaking/event dialogue bypass the autonomous dialogue switch. Manual Speaking falls back to existing normal creative C-02 if every eligible random record is cooling down; rare records retain cooldowns. The action weights, automatic shot cooldown (3–5 min) and three Codex event mappings are unchanged.

Firing/Dual Firing return after **1500/2400ms** even when their line needs longer. Speech has its own lifetime and may continue briefly at base; user interruption clears it. Dynamic retains the verified B-13.1 timeline. No firing warning or cooldown blocks a manual shot.

## Manual-response diagnosis and repair

[Executed before/after reproduction](qa/b13-2/regression.json) uses the exact committed B-13.1 controller:

- `manual('firing')` followed by a duplicate visible/resume signal used to force Smoking immediately. The controller previously reset even if visibility had not changed. Visibility is now idempotent; a late identical show/resume cannot cancel a newer user command. Real hidden→visible transitions still clear and rearm safely.
- The previous renderer treated any `document.hidden` as a true pet-window hide, and `manual()` silently returned while hidden. Native window lifecycle is now authoritative via the existing hide/minimize/power IPC; mere DOM occlusion does not suspend the native behavior controller. Browser preview still uses tab visibility. Browser QA injects the occlusion case; native QA records whether the real menu caused DOM hiding rather than assuming Windows always reports it.
- Firing/Dual display used `max(action duration, dialogue duration)`, leaving a static approved shot visible for several unnecessary seconds. Separate completion clocks remove that delay.
- Same-pose shots/Speaking/Drawing create new renderer instances; persistent static poses may explicitly acknowledge a successful **reuse**. A static approved PNG with subtle runtime effects is not a failed animation. Pending duplicate requests no longer reuse a stage of a different pose before image decode.

Main-process manual commands carry monotonically increasing IDs. Bounded QA records connect **menu-received → sent → received → accepted/requested → rendered/reused**, including hidden state and render version. Invalid senders/IDs/poses/phases are rejected; no dialogue text or debug UI is exposed. Generation checks discard obsolete renders and completions. Pointer clicks/drags reset menu-command attribution. Actual window show/resume signals cannot retroactively erase accepted commands.

## Smoking presentation

The unchanged B-07 Smoking PNG already contains a painted plume. It remains visible. Two pointer-transparent CSS strands add a staggered **2s** rise/bend/fade loop at source pixel **(597,282), 1003×1568**. Source contain/letterbox scaling is recomputed on resize; the overlay shares the tiny B-13.1 breathing transform. Both ends of each cycle have zero opacity. The supplemental layer and observer are removed on pose exit, hide/suspend, Reduced Motion and disposal. Reduced Motion keeps only the static approved image. This is an overlay, not newly generated character art or a replacement of the embedded painted plume.

[Browser recording: loop, exit, Reduced Motion](qa/b13-2/smoking-loop-browser.webm) · [menu capture](qa/b13-2/menu-browser.png) · [browser trace/coordinate report](qa/b13-2/browser-report.json). Browser recording/captures are **not Windows GUI evidence**.

## Dialogue candidate

`C-19`: **사춘기 소년들의 어깨 싸움은 그걸로 끝이다.** Registered as a proposed, rare, user-supplied creative/adapted candidate, `original-inspired adaptation`, never an exact comic quote. Speaking/Drawing random context, 30-minute cooldown; rare records receive one-tenth selection weight within their origin group. It is not a click warning, firing gate or Codex event. Existing text/IDs/event mappings remain unchanged.

## Verification and boundaries

- Node tests cover both uniform ranges, independent switches/clocks, coincident Speaking/dialogue slots, manual priority, all manual shots repeated during automatic cooldown, strict shot completion despite long text, stale callbacks, true hide/resume, duplicate resume, settings save/restore/migration and approved SHA integrity.
- B-13.2 browser QA: nine manual poses twice under simulated menu occlusion, correlated render acknowledgements, true native suspend vs occlusion, old-timer interruption, menu frequency restore, two smoke strands/2s seamless endpoints, resize coordinates at 120/180/240/360px, Reduced Motion/cleanup. Measured anchor error <0.1px in the recorded run.
- Existing B-12 visual browser suite (81 checks), B-13 clicks/Black Mamba/drag/menu, B-13.1 side-speech/Dynamic/transparent composites and offline preview are retained. Timing QA identifies base **after** the shot rather than mistaking the legitimate preparation/base render for completion.
- Windows workflow builds the pinned portable app and retains B-13.1 native alpha/desktop/timing/input checks. Additional B-13.2 QA focuses the real menu and injects mouse down/up on its actual buttons for 18 pose requests, verifies menu IPC + controller acknowledgement + current decoded image, replays duplicate native resume, restores independent presets through menu IPC, checks smoke scaling and native CDP Reduced Motion. Settings are restored after the QA exercise. `windows-qa-report.json` contains full bounded command traces and `behavior132` results; screenshots are in `windows-b13-2-captures/`.
- Download the matching successful [Windows workflow](https://github.com/pchjesus/castle-desktop-pet/actions/workflows/windows-smoke.yml) artifact **`castle-pet-windows-b13-2-qa-unapproved`**. Extract the whole folder and run `검수 QA/electron.exe`. Check the run's packaged commit and success status; an artifact from a failed run is diagnostic only. CI results are authoritative on [Draft PR #11](https://github.com/pchjesus/castle-desktop-pet/pull/11).
- Human Windows 10/11 device review, mixed-DPI/multi-monitor interaction and visual judgement of supplemental smoke remain separate from Windows GUI automation. No human device test is claimed here.

Risk review: **local improvement** was needed because the single action timer set could not provide independent dialogue cadence and speech lifetimes. Only controller clock ownership, native visibility/acknowledgements and presentation smoke were changed; no full application refactor. Recheck these boundaries when adding B-14 settings or B-15 events. A new pose/source should not introduce an independent completion owner that forces the base over newer input.
