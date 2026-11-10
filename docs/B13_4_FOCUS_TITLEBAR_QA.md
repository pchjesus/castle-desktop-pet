# B-13.4 — Windows focus/blur phantom title-bar regression

The user observed that the approved B character initially rendered with a
transparent, frameless window, but after clicking the pet and clicking outside
the window, a grey titlebar and an opaque non-client strip appeared.

This is a known Electron/Windows class of regression:
- https://github.com/electron/electron/issues/39959
- https://github.com/electron/electron/issues/46882
- https://github.com/electron/electron/issues/47440

The project currently uses Electron 35.7.5. A global Electron downgrade or
major upgrade is **not** performed in this fix, as this risks changing the
already-approved renderer, IPC and Windows packaged runtime.

## Fix
`electron/focus-chrome-repair.mjs` debounces focus/blur transitions and on
Windows briefly changes the **native** window height by exactly one pixel,
then immediately restores the original bounds and `resizable:false`.
At the bottom of the working area it uses -1px instead of +1px.
The workaround never hides the pet, replaces the BrowserWindow, changes the
approved sprites, changes opacity, focuses the window again or modifies
click-through settings. It preserves saved pet geometry.

## Real Windows verification
The normal QA run checks native HWND styles and clear-region composition.
The new `--qa-focus-report` run specifically focuses the pet, clicks its
visible sprite pixel, focuses a second desktop window, and samples the **screen
compositor** against the background. It repeats the interaction twice and
rejects any visible grey native title strip, moved/resized pet geometry,
re-enabled resizing or stolen focus. Screenshots and JSON are uploaded with
the Windows QA artifact.

Native blur and Win32 composition behavior can differ by physical device,
DPI/scaling, Windows 10/11 build and graphics driver. The reported user's
Windows result remains the final acceptance criterion.

## Personal PC acceptance
1. Exit every existing CastlePet process before launching the fresh QA build.
2. Click Aquila to trigger speech/action, then click the Codex editor or desktop
   **outside** the pet. Repeat 5–10 times, including click-through areas.
3. Check for unwanted opaque bands or title/caption strips, and confirm the
   pet still accepts clicks, right-click menu, dragging, base sitting, actions,
   speech and B-15 test events.
4. Check this at 120px and 360px pet sizes, and with the pet near each edge.
5. Send a screenshot, Windows version and steps only if the defect persists.
