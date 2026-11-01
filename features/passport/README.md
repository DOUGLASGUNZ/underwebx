# UWX RC35 — Social Passport 2.0, first usable slice

**Status:** Draft source code + automated Windows checks. It is NOT a released feature and has not been visually verified on the user's PC.

## Where to find it
Open the existing **People & Activity** sidebar section and choose a friend from the existing list (which already populated `profileUserId` for its Network Profile preview). A new Social Passport card appears **above the existing People content**. The existing profile preview, invite selections, network roles, and VRCX user-dialog buttons remain unchanged.

## What actually works in this first slice
- **Current VRChat friend identity and status**: existing People `selectedProfileFriend` object; no new polling or extra API request.
- **UnderWeb role/link state**: props derived from the existing `selectedProfileRoles` and `selectedNetworkMember` values. The link is not a VRChat login token or guarantee of online visibility.
- **Observed together**: reuse `useUwxCrewStore().stats` from the PC-local `gamelog_join_leave` SQLite source. Show last observed visit, unique days, approximate time for the last **30 days**. Missing data says *not recorded*; it is NOT an all-time friend/encounter history.
- **Private VRCX memo**: read/write the existing VRCX SQLite user memo via `getUserMemo`/`saveUserMemo` in `memoCoordinator.js`. **No duplicate notes table or new backend.** Changes to this memo are reflected in the original VRCX UI.
- **Private personal tags**: store up to 8 small tags per VRChat user ID with UWX's existing local config provider. No cloud sync. Validate input and handle storage failure.
- **Crew shortcut**: reuse UWX's existing pinned/unpinned Crew state.
- **Open VRChat user**: reuse VRCX's `showUserDialog`.

## Explicit limitations
- Currently **friends selected in People & Activity only**; not yet a universal cross-app profile that opens from every lobby, group and search row.
- No direct creator photo gallery, showcase editor, or external UnderWeb profile fetch. The verified UnderWeb role/link data displayed comes only from UWX's existing loaded network state.
- No new moderation cases or any staff-only intel displayed here. Do not mix private staff evidence into social profiles.
- No all-time, comprehensive encounter log. Observations are bounded to the PC-local Crew 30-day history and can be missing/aged out.
- No new VRChat API calls, remote storage, token use, or backend migrations.
- No release until a Windows test shows safe memo persistence across restarts and switching between friends.

## Deployment mechanism
`features/passport/apply-rc35.mjs` runs immediately **after** the RC34 Home installer in the original UWX Windows build workflow. It validates the previous version and exact source/view anchors before copying a new Vue component, tag model/store/test, and CSS. This leaves the underlying VRCX source, prior patches and all release settings untouched.

## Test checklist
- [ ] Automated CI reconstructs original source/RC1–RC34, applies RC35 and passes all regressions and `uwxPassport.test.js`.
- [ ] Full Windows build/installer artifact succeeds without publishing.
- [ ] On PC: choose friend A, edit memo + tags, choose friend B, verify no data leak between them; restart and verify persistence.
- [ ] On PC: correct UnderWeb roles/link only when the existing network data is loaded and verified.
- [ ] On PC: 30-day encounter totals match underlying Crew data, including no-history state.
- [ ] On PC: original VRCX friend dialog/memos, Crew pin, People filters, invites, groups, existing visual settings remain working.
- [ ] On PC: test CSS with both dark/light mode, long display names, compact/large text, and reduced motion.

Nothing from this draft has been merged, deployed to underweb.cloud, or released.
