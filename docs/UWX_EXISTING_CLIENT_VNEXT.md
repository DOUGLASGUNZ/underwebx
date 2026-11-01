# UnderWeb X — Improve the existing client (not a rewrite)
Updated: 2026-11-01 | Status: development plan, not a release.

## Product decision
**UWX stays based on the existing VRCX-derived app.** Preserve its working friend list, presence, friend log, local game log, favorite tools, VRChat group API, and existing login behavior while reviewing that behavior against current VRChat rules. Add original UnderWeb tools in isolated modules. The standalone Tauri prototype in `UnderWebX2` is a separate experiment; **do not merge it into the current UWX codebase** or make it a dependency.

The experience should be useful to ordinary VRChat users, not just The UnderWeb staff. Keep OSC as a supported optional module, not the core of this iteration.

## What GitHub actually shows
- Latest published GitHub release checked: **v0.5.0**, published 2026-10-06.
- `.github/workflows/build.yml` assembles `UnderWebX-v0.2.0-source.zip`, then applies multiple patches through **0.6.13-rc32**, then runs tests/build. It is not a normal editable post-patch source tree.
- `features/core/rc31-sidebar.patch` reorganizes VRCX and UWX features into separate sidebar sections, including Social, Instances and UnderWeb staff areas.
- `features/core/rc32-polish.patch` fixes blank Group Intelligence/Moderation/Staff views and UI defaults.
- `features/GROUP_INTELLIGENCE.md` describes staff features, some tested locally, and backend migrations requiring deployment. Descriptions of code/features do **not** prove installation or a production backend deployment.
- Some GitHub Actions builds on `main` succeeded after v0.5.0, but automatic publication depends on release version, main-branch run, and release workflow. **Do not assume the current installed app contains RC32.**

## First target: stable source and QA
1. **Establish actual baseline**: identify the latest successfully built installer and its embedded `UWX_VERSION`, compare with the published release, and record which backend migrations are deployed. No public release yet.
2. **Reconstruct and inspect the final patched source** from the pinned archive + ordered RC patches. Keep source and credentials secure. Audit missing permissions, licensing, build/test steps, and custom API/service calls. If we create a CI artifact, ensure its contents cannot leak local credentials or secrets.
3. **Simplify the development workflow**: work toward a normal readable source tree or a deterministic patch generator, not a growing series of fragile one-off edits. Preserve the exact existing successful build as rollback.
4. **Test real workflows**: login, friends online/offline, live WebSocket updates, friend notes/history, group role permissions, moderator logs, search, local logs, and UnderWeb connections. Record **passed/failed/not tested** separately.
5. Fix broken functionality before adding large new modules.

## vNext feature priorities

### P0 — Friends & social (everyone)
- Keep stock VRCX friends list, favorites, active/online states, locations (within permitted visibility), friend log and game log intact.
- Add a **unified person drawer**: VRChat user info + own private friend notes/tags, shared-world history actually observed, UnderWeb verified account/creator info when present. Clearly label source/recency.
- Quick filters: online / favorites / recently met / UnderWeb creators or members, keeping visibility and privacy rules.
- Improve search and navigation across friend + encountered + verified UnderWeb identities without fabricating matches.
- Ensure safe migration/backup of existing VRCX/UWX local history and notes.

### P1 — Groups & staff
- Preserve group browsing, members/roles, event calendar, visible group instances, audit logs and authorized moderation actions.
- Consolidate Group Tools, Group Intelligence, Moderation Center, Staff Dashboard, and Approvals into a coherent experience; **do not duplicate the same table/data in five places**.
- First fix blank panels, incorrect permission gates, unnecessary API polling, and unavailable-vs-zero labeling.
- Audit RC27–RC32's existing flows before adding promised features a second time.
- Group sharing is opt-in per group with actual UnderWeb server authorization and explicit user confirmation for writes. No universal VRChat ban database, no automatic punishments.

### P2 — UnderWeb.cloud integration
- Reuse the existing UnderWeb Supabase project, passwordless sign-in, verified VRChat account association, Discord links, profiles, creator directory, event data, and RLS authorization.
- Display a connected UnderWeb identity **separately from** the VRChat session. A verified `usr_...` link alone is not permission to read private VRChat data.
- Native user flows: view/edit own profile where allowed; creators show their website-approved media; event RSVP/reminders, showcase and staff work depend on existing server authorization.
- Verify backend endpoints/migrations actually deployed before UI claims are live. No Supabase service-role keys or VRChat cookies/tokens in UnderWeb sync.
- Keep current website working; prefer incremental reuse of its existing API/RPC contracts.

### P3 — Polish/performance
- Improve loading speed, local database queries, network error and offline states, rate-limit handling/backoff, and startup behavior.
- Simplify cluttered navigation; test with a regular nonstaff member and an authorized staff user.
- Preserve original UnderWeb identity but prioritize readability and responsive workflows over visual novelty.
- OSC updates only after the above passes.

## Login/API policy gate — must not be skipped
- Upstream VRCX uses `https://api.vrchat.cloud/api/1`, the authenticated pipeline, local game logs and SQLite.
- Source now includes QR/device-code approval in upstream `master`, but this doesn't automatically mean it is included in UWX or permitted for arbitrary third-party redistribution.
- VRChat's 2026-10-06 Creator Guidelines restrict collecting/storing third-party credentials and session tokens. Source code feasibility is not authorization. Review official rules / seek clarification before changing or advertising any VRChat login mechanism.
- No code that extracts another installation's cookies or passwords; no extra server relay for VRChat auth.
- Test rate limiting and proper client identification. Document the specific integration's provenance and required authorization.

## Release acceptance checks
- [ ] Verified build provenance and a rollback installer.
- [ ] Friends, search, presence pipeline, notes/history, and current-group views behave as before.
- [ ] Group staff permissions checked with staff and nonstaff scenarios; errors and unavailable values are honest.
- [ ] Existing UnderWeb data uses server-side RLS and is not mixed with VRChat session credentials.
- [ ] API requests back off gracefully; no excessive refresh/chatbox spam.
- [ ] Clear changelog, installer tested on Windows, and version/release artifacts validated.
- [ ] User approves publishing. No production release or database changes just from a PR.

## Initial implementation sequencing
1. Baseline and source reproducibility
2. **Friends/People Hub** audit and small quality-of-life improvements
3. Group and staff feature stabilization
4. UnderWeb account/profile/event integration validation
5. Performance, layout and optional modules

**Repository:** `DOUGLASGUNZ/underwebx`. This plan lives on a feature/planning branch so it cannot change the public installer. Existing source archive and all patches remain unchanged.
