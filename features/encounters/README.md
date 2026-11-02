# UWX RC36 — Social Passport: People You've Encountered

**Draft only.** This builds on RC33–RC35 inside the existing UWX/VRCX-derived client. It does not replace the known working release or alter underweb.cloud.

## User experience

Open **People & Activity** and choose **Browse encounters**. UWX reads its own PC-local VRChat game-log database on demand and lists people with recorded VRChat user IDs seen during the last 30 days. Current friends and the signed-in user are hidden by default (you may include friends). Search by name/ID, sort by last observed date or distinct days.

Choose a row to view that user's existing **Social Passport**. A nonfriend has a local-history summary, PC-only personal tags, your original VRCX SQLite memo, a Crew pin shortcut and the existing VRCX profile dialog button. Friend selections still open their Passport. No public profile, friendship, online-status or hidden-user data is automatically fetched in the background.

## Data provenance / privacy
- Source: existing local SQLite table `gamelog_join_leave`, which VRCX already writes for `OnPlayerJoined` and `OnPlayerLeft`.
- Query: bounded to 30 days and 200 grouped users, read on user opening/refresh, not continuously.
- Identity: VRChat `usr_<UUID>` IDs from actual game logs only; never match identities by display name alone.
- Display name: most recently saved name in the local log; name changes can occur.
- **Days**: distinct calendar days with join/leave events in this PC's records.
- **Last seen**: last recorded local join/leave event, not necessarily last time the person was online.
- **Time**: only accumulated `OnPlayerLeft` duration values; sessions with missing leave events may have no duration. Observed estimates are not complete lifetime relationships.
- No remote query, additional VRChat API polling, background people tracking, cloud sync, live group privileges, or notifications to listed people.
- All social notes and tags remain PC-local. Existing staff moderation data does NOT get copied into general social profiles.

## Integration
`features/encounters/apply-rc36.mjs` requires the known RC35 version and injects an encounter browser before the existing Social Passport component within **People & Activity**. Clicking a nonfriend uses a separate selected encounter record; selecting a regular friend clears the encounter selection. Original People cards and active friend selection stay intact.

The RC36 adapter adds on-demand `uwxEncounters.js` and `uwxEncountersService.js`, a Vue browser component and stylesheet, and a pure test suite.

## Release checks
- [ ] Existing RC1–RC35 patches and RC36 applicator succeed in GitHub Actions.
- [ ] Existing UWX regression suite + encounter tests pass; Windows installer builds successfully.
- [ ] On Windows, browse real history with multiple user IDs and confirm no friends/self by default; include friends toggles.
- [ ] Open nonfriend Passport, edit/read VRCX memo and local tags, then switch to a friend and back; verify no cross-user contamination.
- [ ] Test missing/empty game log, stale entries, previously deleted accounts, missing IDs, and names that have changed.
- [ ] Ensure data stays local and no API bursts appear while browsing.
- [ ] Confirm Friends, Groups, login, moderation permissions, appearance and other UWX functionality are unchanged.
- [ ] User explicitly approves any public release.

**Limitations:** 30-day recorded window, only up to 200 recent identities, at most 80 rendered results after filters. Doesn't claim to recover everyone ever met or show a live nonfriend location.
