# Castle Desktop Pet — B-15 local event bridge

## Scope and truthfulness
This version receives **local** events. No API key, external server, account token, or AI/API call is required.
The app cannot directly inspect ChatGPT/Codex web conversations, paid usage, test results, or deployments.
The project-scoped Codex hook (when trusted and enabled) sends **jobStart** when a prompt is submitted.
It does **not** claim that a turn completed successfully. The app never guesses `testPassed` or
`deploymentComplete` from a generic Codex completion event.

## Quick user acceptance
1. Extract the complete QA ZIP; do **not** run the executable directly from ZIP. Close any older pet.
2. Run `CastlePet.exe` and right-click the character. Under **기본**, choose **앉기**. Under
   **더보기 → 현재 상태**, verify the stored base pose is `앉기`.
3. Press the **작업 시작 / 테스트 통과 / 배포 완료** buttons separately, allowing each
   event animation to finish before testing another. Inspect the actual character and
   recent event log. These are **simulation buttons**, not evidence of a real Codex event.
4. To test the external bridge from a local repository checkout while the pet is open:
   ```powershell
   node scripts/emit-codex-event.mjs jobStart
   node scripts/emit-codex-event.mjs testPassed
   node scripts/emit-codex-event.mjs deploymentComplete
   ```
   Do not send consecutive events immediately: the system prioritizes/discards some
   overlapping events. The event log distinguishes `[시험]` and `[외부]`.
5. The exact monitored JSONL location is shown in **더보기 → 현재 상태 → 수신 파일**.
   If your environment uses a different Electron application data folder, set the
   `CASTLE_PET_EVENTS_FILE` environment variable to that exact path before running
   a hook/emitter. The app itself always watches its own userData location.
6. Menu test buttons do not mark a real Codex connection active. "외부 이벤트 수신됨"
   means only that **some process** appended a valid event to the local file.

## Optional Codex project hook
This repo includes `.codex/hooks.json` with a **UserPromptSubmit** hook that runs
`node scripts/codex-hook.mjs`. It is subject to Codex project trust and hook approval.
Open Codex in the repository root, inspect the hook with `/hooks`, and approve/trust
it if you want automatic `jobStart` events. Codex might be in a different
sandbox/container or working directory with no access to the local Windows
`%APPDATA%` folder; in that environment this hook cannot reach the running pet.
Only tests on your actual Windows machine can establish whether this route works.

The hook stores only a timestamp and `jobStart`. It does not store prompt text,
turn IDs, code, credentials, or transcript data. It is intentionally non-blocking
and does not invoke an AI model. Hooks work only for supported Codex clients
and when project-local hooks are enabled/trusted.

## Verified test or deployment event
To emit an actual `testPassed` from a successful local test invocation:
```powershell
npm test
if ($LASTEXITCODE -eq 0) { node scripts/emit-codex-event.mjs testPassed }
```
Only signal `deploymentComplete` after independently verifying that a real deployment
completed successfully, e.g. `node scripts/emit-codex-event.mjs deploymentComplete`.
The scripts cannot verify an arbitrary GitHub/Pages deployment by themselves.
These remain explicit opt-in event sources, not automatic detection.

## Event file format
Append one UTF-8 JSON object per line:
```json
{"event":"jobStart","createdAt":"2026-11-09T11:00:00.000Z"}
```
Only `jobStart`, `testPassed`, `deploymentComplete` are accepted.
Existing rows at launch are intentionally ignored. Malformed, oversized and
unrecognized rows are discarded. No input is executed as a command.

## Event priority and known deferred issues
Manual pose interactions take priority. If a manual action is playing, an
incoming Codex event may appear as blocked in the history; wait for the pose
to finish and send it again. The existing event priority and action
sequences in the behavior controller remain authoritative.

B-13.4 Windows focus/click-through title-ribbon regression remains deferred.
Reload/Maintenance art was not generated or integrated, approved sprite hashes
remain immutable. Never merge to main or release without user approval.
