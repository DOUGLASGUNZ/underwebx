# UWX RC38 — QuickDeck: native desktop companion

**Status:** Draft development candidate. Does NOT publish, merge or replace the working UWX release.

## What RC38 actually builds

The Windows build gets a compact **independent WinForms window**, launched by **Open QuickDeck** on the existing UWX Overview. This is not a fake floating panel in the main web page. You can move the window independently, keep it on top of other desktop windows with its pin switch, and use it when the main UWX window is minimized.

- Native window is created only on request (not auto-running on startup).
- Toggle **Pin on top**, persist the choice and last saved window position through existing local VRCX storage.
- **Close** hides only QuickDeck, never UWX, and reopening uses the same window.
- Uses a simple, low-overhead WinForms UI (no extra Chromium browser, second session, duplicate VRChat login, or polling loop).
- Main app pushes online friend count and the current world name from **already reactive local stores**.
- Six quick actions: People & Activity, World Passport, Invites, OSC Lab, Search, Overview. Each brings the *existing* UWX app forward and navigates to the corresponding route.
- Both native C# and Vue validate allowable routes; shortcuts cannot navigate to staff-only panels or arbitrary URLs.

## Source code

- `UwxQuickDeckForm.cs`: Windows form and allow-listed native buttons.
- `AppApiCef.UwxQuickDeck.cs`: two methods on the existing CefSharp `AppApi` native binding; no new IPC service required.
- `UwxQuickDeckBridge.vue`: root-mounted component that uses current Friend/Location stores and handles only known QuickDeck navigation events.
- `UwxQuickDeckLauncher.vue`: explicit opt-in button in existing UWX Overview.
- `uwxQuickDeck.js`: pure route/status helpers with unit tests.
- `apply-rc38.mjs`: fail-closed installation after successful RC37.
- Existing VRCX/Friends/Worlds/Invites/OSC and UnderWeb backend untouched.

## Limitations / safeguards

- **Windows CefSharp only in this first slice**. Linux/Electron users see an unavailable launcher and can continue using all normal VRCX features.
- This is a separate **desktop** window, not a SteamVR/HMD overlay, and does not have special exclusive-fullscreen-game privileges.
- First version has a summary and quick navigation only, not rich event listings, in-window friend interactions, OSC toggles or live DJ schedules.
- The native window uses an independent WinForms UI rather than inheriting all Vue color themes. More theme integration can come after Windows testing.
- No new API polling, background daemon, credential handling, cross-device sync, database migrations or auto-release.
- Native window can remain on screen after minimizing the main UWX window; it still depends on the parent process running and an active logged-in UWX session for actions.

## Release QA

- [ ] RC1–RC37 source patch chain passes, RC38 installer validates anchors.
- [ ] All existing Vitest regression tests + QuickDeck unit tests pass.
- [ ] Windows native C# compiler succeeds and installer artifact uploads.
- [ ] Manual PC: launch, pin/unpin, move/restart persistence, hide/reopen.
- [ ] Manual PC: six shortcuts navigate to correct existing pages; no unauthorized staff actions.
- [ ] Manual PC: online friend count updates as existing friend state changes, world status updates, logout clears summary.
- [ ] Manual PC: minimize UWX, leave QuickDeck on top, return to UWX through quick action.
- [ ] Manual PC: no extra WebApi/session and no external browser window.
- [ ] Manual PC: close UWX, confirm no detached orphan window/process.
- [ ] Confirm initial dark/light UX, DPI scaling, keyboard tab order and screen placement.

No public release until authorized and visually verified on Windows.
