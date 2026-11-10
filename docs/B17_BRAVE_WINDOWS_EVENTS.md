# B-17 — Brave downloads and Windows power/lock events

This is a **draft**, stacked on the pending B-15.1 settings/Codex PR. The
approved `main` is unchanged, and all approved Aquila sprites, titlestrip
workaround, action menu and manual poses remain untouched.

## What works

- Electron powerMonitor emits `on-ac`, `on-battery`, `lock-screen`,
  `unlock-screen` events. Lock suspends activity, unlock resumes activity and
  may display a short creative line.
- Four opt-in notification toggles live in **더보기 → 외부 연동**. Windows
  AC/battery/unlock toggles default ON, Brave download toggle defaults OFF.
- The pet displays an ordinary speech bubble; no audio or cloud model cost.
  Notifications are noninterrupting, won't queue over Codex/manual actions,
  and duplicate notifications are throttled.
- Brave downloads require an opt-in MV3 extension with only `downloads`,
  `storage` and localhost host permissions.
- Only a JSON event with `event: downloadComplete` and numeric `id` is
  sent. Download filename, source URL, webpage content and browsing history
  are never transmitted to the pet. Local HTTP receiver checks a 256-bit
  random pairing token, allowed extension origin, event schema, and
  deduplicates repeated download IDs.
- Local receiver binds only `127.0.0.1:47183` and starts **only** when the
  user enables Brave download notifications.

## Install Brave extension on the user's PC

1. Extract the complete Windows QA zip; launch `CastlePet.exe`.
2. Open **Brave → brave://extensions** and turn on Developer Mode.
3. Select **Load unpacked / 압축해제된 확장 프로그램 로드**, then choose
   the extracted `brave-extension` directory.
4. In Aquila right-click → **더보기 → 외부 연동**, enable Brave download
   complete and click **연결 토큰 복사**.
5. Open the Castle Pet extension's options by clicking its icon, paste the
   copied 64-character token, check **다운로드 알림 켜기**, and save.
6. Download a small innocuous file in Brave; when fully complete, Aquila
   displays the short original line provided it is in base/idle mode.
7. Disable either the Aqua menu toggle or the extension toggle to stop
   events. Remove extension from Brave to revoke its browser permission.

No external website is polled. The extension never executes commands or
can trigger arbitrary pet actions. Do not publish the token or paste it into
an unrelated website.

## Windows checks

- Plug AC power while pet is visible; test unplugging and locking/unlocking.
  Lock is naturally not visible on the locked screen.
- Confirm event toggles survive app restart, and that speech does not
  interrupt manual action or an active Codex event.
- Automated tests mock OS events and test local receiver requests, while
  the actual Brave browser installation and user's laptop power events
  require user-side verification.

## Codex browser/cloud distinction

The existing B-15.1 Codex switch installs a **local** user-level hook only.
Opening Codex through Brave or having the ChatGPT Windows app installed
does **not** mean that a local Codex hook sees cloud task lifecycle. A
separate Codex cloud-compatible integration is a future project and cannot
be declared connected based on test events.
