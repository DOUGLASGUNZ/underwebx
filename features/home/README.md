# UWX RC34 — Personalizable Home (existing client)

**Status:** Draft development candidate; no public release.

## User experience
The existing UnderWeb X **Overview / Command Center** gets a compact **Customize home** control above its existing four live overview tiles. Selecting it reveals an accessible edit panel. Each current tile remains connected to the exact same UWX data sources:
- Current World (as already shown by UWX)
- Instance (original in-instance/player/friends-present information)
- Network Online (staff and creators as provided by existing UnderWeb network state)
- Invites Sent (original UWX session group/instance invitation totals)

The user can:
1. Drag the three cards in the editor to reorder them, or use arrow controls for keyboard-friendly ordering.
2. Hide/show any tile via checkbox.
3. Restore the default layout.
4. Restart the client and keep their choice, stored locally.

If all four cards are hidden, the editor stays available and gives instructions on restoring them.

**Not implemented:** arbitrary widget plugin framework, charts as draggable widgets, VRCX Friends List embedded inside the Overview, cross-device layout sync, new backend dashboards or more polling.

## Technical integration
`features/home/apply-rc34.mjs` requires the output of RC33 `0.6.14-rc33` and targets exactly the existing `<div v-if="activePanel === 'command'" class="uwx-overview">...`. It scans and preserves all four existing Overview card bodies, adding only reactive show/order attributes to their opening tags, plus the editor and local-store imports. If the card count/headings differ or any script anchor is missing, **CI fails** rather than publishing a malformed app.

The state model is in `uwxHome.js`, with an enumerated allow-list; unknown/duplicate IDs are dropped. Data is saved through the existing `configRepository` plus a local startup cache. It doesn't contain or sync any session credentials.

No new VRChat, OSC, Supabase or other network calls.

## Verification
- [ ] Existing patch chain RC1–RC33 succeeds in CI
- [ ] RC34 installer finds all four original live cards; no conflicts
- [ ] Existing UWX regression tests and pure Home tests pass
- [ ] Full Windows installer creation succeeds
- [ ] On Windows: default Overview looks identical, editing saves and persists, card hiding works, drag/drop works, arrow controls work, reset works
- [ ] Existing Friends, Groups, VRChat login, UnderWeb account, OSC and update flow unchanged
- [ ] Confirm that User Access gating for command/overview still behaves exactly as before

Do not release publicly until actual Windows validation and user approval.
