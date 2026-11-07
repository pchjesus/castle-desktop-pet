# Castle Desktop Pet — input geometry correction (2026-11-07)

## User-observed failures
- Native-looking `Castle Desktop Pet` title strip appears after clicking the actual sprite and stays visible.
- Right-click does not open size or manual pose preview menu.
- Empty transparent pixels still block desktop icons behind the window.

## Root cause and technical remedy
Old CSS marked the entire application rectangle `-webkit-app-region:drag`. Electron docs confirm draggable regions eat mouse events and may be treated as native non-client Windows caption areas. Remove every drag region and use explicit pointer capture + cursor movement via the Electron main process for dragging on **opaque sprite pixels only**.

Build a per-frame alpha hit mask from the *already-approved B-type derivative PNG*; do not modify canonical art. CSS `object-fit: contain` mapping uses exact image dimensions and display rectangle; threshold is 24/255 to ignore faint halos. When the pointer crosses into transparent canvas, main calls `BrowserWindow.setIgnoreMouseEvents(true,{forward:true})`; Windows still forwards mousemove so entering an opaque pixel switches back to interactive mode. Drag lock prevents click-through while user is moving the pet.

Native menu is invoked from the renderer's alpha-gated `contextmenu` event through the context-isolated preload; don't use WebContents context-menu event on the native drag strip. Manual pose and 120-360px size commands remain unchanged.

## QA and limitations
- Node unit tests cover pixel hit/miss, letterboxed image area, low-alpha edges and lack of native drag CSS.
- Windows Electron smoke checks that opening the menu from an opaque pixel reaches the preload, and click-through decisions cross IPC.
- Only user Windows 11 real pointer testing can establish that **clicking a desktop icon underneath a transparent corner truly reaches it**, dragging holds reliably, and no native titlebar strip occurs on focus.
- Electron does not directly support changing the OS native window shape to an arbitrary alpha contour. This technique preserves a rectangular visual window with pixel-aware *input routing*. It should feel contour-shaped to the user without manipulating Windows native region geometry.
- On mask extraction failure, keep the window interactive rather than making the pet permanently unreachable. Log failure for QA.
