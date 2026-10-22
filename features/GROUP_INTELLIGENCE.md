# UWX Group Intelligence, Moderation Center & Moderation Network

This file has three parts. The feasibility section says what each requested capability can really be built on. The architecture section says how it fits UWX and UnderWeb. The changelog says what shipped in each release and what is still missing.

## 1. Feasibility: what VRChat exposes

**Ground rules.**
- UWX only talks to VRChat through the endpoints VRCX already uses (`src/api/group.js`, `src/api/user.js`).
- Requests go out with the person's **own** signed-in VRChat session, and VRChat enforces group permissions on its side.
- UWX never sends VRChat passwords, cookies or auth tokens to UnderWeb or anywhere else.
- What UnderWeb stores is only what staff clients read and choose to sync: counts and the group's own audit-log rows.

**Legend.**
- **A** comes directly from VRChat.
- **B** is derived from periodic snapshots.
- **C** comes from local UWX/VRCX data on that PC.
- **D** comes from UnderWeb's own moderation database.
- **E** is available only from participating groups.
- **F** is unavailable or unsupported.

### Group statistics

| Capability | Class | How / limits |
|---|---|---|
| Current member count | A | `GET groups/{id}` → `memberCount`. |
| Online member count | A | `GET groups/{id}` → `onlineMemberCount`. Shown as "Unavailable" when VRChat leaves it out. |
| Growth over 24 h / 7 d / 30 d / all recorded | B | Member-count snapshots saved every refresh (15-min buckets). Saved locally in SQLite, and to UnderWeb when the group is registered. Growth only exists from the first snapshot onward. |
| New members joining, members leaving | A + C/D | Audit log `group.member.join` / `group.member.leave`. Needs `group-audit-view`. VRChat only returns its recent history, so UWX archives it (locally and in UnderWeb). |
| Pending join requests | A | `GET groups/{id}/requests`. Needs a role that can manage requests; otherwise shown as "No permission". |
| Pending (outstanding) invitations | A | `GET groups/{id}/invites`. Needs `group-invites-manage`. |
| Accepted invitations | B/C (derived) | VRChat does **not** link a join to the invite that caused it. UWX matches `group.invite.create` → a `group.member.join` by the same person within 14 days, and labels it "matched", not "confirmed". |
| Rejected / expired invitations | F (partial A) | No reject/expiry event is exposed. `group.invite.cancel` (staff cancelled it) is counted. Expired and declined are **not tracked**. |
| Current bans | A | `GET groups/{id}/bans`, paged (100/page). Needs `group-bans-manage`. Counting stops at 1,000 and shows "1,000+". |
| New bans / lifted bans | A + C/D | Audit `group.user.ban` / `group.user.unban`. |
| Kicks & removals | A + C/D | Audit `group.member.remove` (from the group) and `group.instance.kick` / `group.instance.warn` (from group instances). |
| Staff & moderator actions | A + C/D | Audit actor per event. Self-service events (joins/leaves) are excluded. |
| Role changes | A + C/D | Audit `group.member.role.assign` / `unassign`, `group.role.*`. |
| Group instance activity | A | Audit `group.instance.create` / `close`, plus live `GET users/{me}/instances/groups/{id}` (instances *you* can see). |
| Member retention trends | B (estimate) | Joins vs. leaves/removals per period. Labelled **Estimate**. Real cohort retention would need a full member list scan, which is not done automatically. |
| Event attendance | C | Your own client's instance history (who was in an instance you were in). Not a group-wide figure; labelled "observed by this PC". |
| Membership milestone progress | A + B | Current count vs. goal (500). The "days to goal" figure is an **Estimate** from snapshot growth. |

### User lookup

| Capability | Class | How / limits |
|---|---|---|
| Lookup by user ID / profile URL | A | `GET users/{usr_…}`. |
| Lookup by display name | A | `GET users?search=` (VRChat's own search; rate-limited, fuzzy). |
| Lookup from friends / known members | C | Local friend list and the local audit archive. |
| Display name, avatar image, bio, public profile | A | `GET users/{id}`. Only what VRChat returns to you. |
| Group membership in *our* group | A | `GET groups/{id}/members/{userId}` (404 = not a member). Needs member-view rights. |
| Membership in other groups | A (limited) | Only what VRChat shows you publicly about that user. UWX does not scrape other groups. |
| UnderWeb membership status, roles | D | Verified VRChat ↔ UnderWeb link (`network_connections`). |
| Known moderation history in our groups | A + D | Our audit archive + our case files. Always labelled **Known Recorded**. |
| Moderation history in other groups | E | Only cases that a participating group explicitly shares with us. |
| Universal bans/kicks across VRChat | **F** | Does not exist. Never shown or implied. |
| Private staff notes, case files, evidence, appeals | D | UnderWeb database, staff-only by RLS. |
| Last recorded UnderWeb interaction | C + D | Last audit event in our groups, and your client's own instance history. |

### Moderation actions

| Capability | Class | How / limits |
|---|---|---|
| Kick (remove from group), ban, unban | A | Existing Group Tools: `DELETE groups/{id}/members/{u}`, `POST /bans`, `DELETE /bans/{u}`. Confirmation plus a 10 s undo. |
| Instance kick / warn | F from UWX | VRChat only does these in-game (group instance moderation). Case files can **record** them, marked "done in VRChat". |
| Warnings | D | Recorded in case files. VRChat has no "warning" object outside the in-game instance warn. |

### Instances and notifications

| Capability | Class | How / limits |
|---|---|---|
| Active group instances, player count, capacity | A | `GET users/{me}/instances/groups/{id}` returns the group instances visible to you, with `n_users` / `capacity`. |
| Staff presence in an instance | C | Only for the instance your own client is in (local player list). |
| Flagged user enters monitored instance | C + D | Existing Lobby Guard / Safety labels, using your client's player list. |
| Multiple moderation actions close together | A + C | Burst detection on the audit archive (`unusualActivity`). |
| Instance becoming full | A | Polling of the group instances above. |
| Case updated / staff requests help | D | UnderWeb case data. |

### Recruiting (Road to 500)

| Capability | Class | How / limits |
|---|---|---|
| Current count, distance to 500 | A | — |
| Daily growth | B | From snapshots. |
| Recruiter leaderboard | D | Claims verified by a manager. **Never auto-attributed.** A matching `group.member.join` (and a matching `group.invite.create` by the recruiter, if they have invite rights) is shown as supporting evidence. |
| Recruit needs no UnderWeb account | D | Claims key on the recruit's `usr_` id. Only the recruiter needs an account. |

### Staff intelligence

| Capability | Class | How / limits |
|---|---|---|
| Staff currently on duty | D (partial) | `staff_availability` schedule plus case assignments. A real check-in/shift clock is a **next-phase** item. |
| Moderation actions per staff | A + C/D | Audit actor counts. Shown alongside cases handled and notes. Never shown as a ranking by ban count. |
| Response times | D | Time from case created → first staff entry. |
| Configurable access for Owner / Director / Admin / Moderator / Staff / Trial Staff | D | `uwx_group_role_access`: each UnderWeb role maps to an access level per group, and the group owner can change it. |

## 2. Architecture

```
VRChat API ──(your own session)──► UWX desktop
  │ getGroup / bans / invites / requests / auditLogs / group instances / users
  ▼
Local SQLite (this PC): uwx_group_audit (existing), uwx_group_snapshots (new)
  │ staff clients with access ≥ viewer push counts + audit rows
  ▼
UnderWeb Supabase (RLS): uwx_groups · uwx_group_role_access · uwx_group_access
  uwx_group_snapshots · uwx_group_events · uwx_group_sync_state
  uwx_cases · uwx_case_entries (append-only) · uwx_subject_notes · uwx_access_log (append-only)
  uwx_share_agreements · uwx_recruit_claims · storage bucket uwx-evidence (private)
```

**Access levels per registered group** (`uwx_group_level()`):

| Level | Name | Can |
|---|---|---|
| 1 | Viewer | See stats, activity and recruiting; push snapshots. |
| 2 | Moderator | Everything a viewer can, plus user intelligence, staff notes, and creating and working cases. |
| 3 | Manager | Everything a moderator can, plus assigning to others, recruit verification, network flag on cases, and reading the access log. |
| 4 | Owner | Everything, plus role → level mapping, goal and retention, network opt-in, sharing agreements, case purge, and retention runs. |

**Default mapping:**

| Role | Level |
|---|---|
| Owner, Director | 4 |
| Admin | 3 |
| Moderator, Staff, Security | 2 |
| Trial Staff | 1 |

**Network rules:**
- Sharing is opt-in on both sides, and per case (`share_with_network`).
- Each agreement is either *summary* (category, severity, status, dates, action types) or *detailed* (adds title and summary).
- Evidence is never shared.
- Every lookup is written to the access log.
- Revoking an agreement, or opting out, takes effect immediately.
- Nothing is ever acted on automatically.

## 3. Changelog

See the bottom of this file. The newest release is first.

### 0.6.8-rc27: Phases 1–3 working, with the Phase 4 and 5 foundations

**Files.**

UWX patch `features/core/rc27-group-intelligence.patch`:
- New:
  - `src/shared/utils/uwxIntel.js`
  - `src/services/uwxIntelArchive.js`
  - `src/stores/uwxIntel.js`
  - `src/stores/uwxModeration.js`
  - `src/views/UnderWeb/UwxGroupIntel.vue`
  - `UwxIntelChart.vue`
  - `UwxIntelFeed.vue`
  - `UwxIntelRecruiting.vue`
  - `UwxIntelAdmin.vue`
  - `UwxIntelSync.vue`
  - `UwxUserIntel.vue`
  - `UwxCases.vue`
  - `UwxModerationCenter.vue`
  - `uwxIntel.css`
  - 3 test files (24 tests)
- Changed:
  - `UnderWeb.vue`: two new tabs, Group Intel and Moderation.
  - Version files and changelog.

Database migration `supabase/migrations/20261022000000_uwx_group_intelligence.sql` (Underweb-Network repo):
- 12 tables, RLS policies, a private `uwx-evidence` bucket, and the role `trial_staff`.
- Tested on a local Postgres 16 with Supabase auth/storage stubs. The test run covered:
  - owner, moderator and outsider access
  - dedupe on repeated sync
  - append-only entries
  - notes that can only be hidden
  - self-review blocked
  - purge
  - evidence path checks
- The migration is idempotent.

**Working (connected and tested):**
- Group overview, including live counts with permission-aware "Unavailable" states.
- Snapshots (local plus shared), growth windows, activity windows compared with the previous period, and the activity feed.
- Charts with date and granularity filters.
- Live instances with a "full" alert, and alerts for ban/removal bursts.
- Rate-limit backoff and a configurable refresh interval.
- User lookup by name, id, link, friend or instance. Shows membership, linked UnderWeb account and Safety Intel label, Known Recorded counts (with a "history unavailable" state), a timeline, shared notes and private notes.
- Cases end to end:
  - statuses and assignment
  - recorded actions
  - evidence upload with signed viewing
  - appeals and decisions
  - real VRChat remove/ban/unban, after confirmation and a 10 s undo
  - append-only timeline and owner purge
- Road to 500: progress, milestones, an Estimate ETA, a leaderboard, claims, and manager verification with audit-log evidence.
- Per-group access mapping, network opt-in and per-group sharing levels, network lookups, and the access log.

**Needs one owner step:** paste the migration into the Supabase SQL editor, then register the group from Group Intel → Overview. Until then, everything except shared history, cases, notes, recruiting and the network runs from the local PC only, and the UI says so.

**Unsupported or limited (VRChat doesn't expose these):**
- A cross-VRChat ban/kick history.
- Declined or expired invitations.
- Which invite caused a join (matched, labelled Estimate).
- Instance kick/warn from the desktop (in-game only; can be recorded in a case).
- Staff presence outside your own instance.
- Event attendance beyond Event Mode on this PC.

**Next phase:**
- A Staff Dashboard: on-duty check-ins and shifts, cases handled, response times, pending approvals.
- Website pages for cases and recruiting.
- A website partner-group onboarding flow.
- Desktop alerts for flagged users joining (wire Lobby Guard to case subjects).
- Optional full member scan for cohort retention.


### 0.6.9-rc28 — Phase 5: staff intelligence, alerts and website sync
- **UWX**:
  - Staff tab: duty check-in and out, help requests with desktop alerts, a staff overview through `uwx_staff_stats`, and a "waiting on staff" summary.
  - Alerts when a flagged user joins your instance (`uwx_flagged_subjects`, matched against your own instance's player list), and alerts for escalated, critical or assigned cases.
  - Event Mode recaps are shared to `uwx_event_recaps`.
  - Owners can grant direct access per person.
  - Staff names now resolve through `uwx_names`.
- **Website (underweb.cloud)**:
  - Staff → Cases, Recruits, and Partner groups (leadership).
  - A Road to 500 card on My UnderWeb with "I brought someone in".
  - `/partners` application page.
- **Database:** `supabase/migrations/20261023000000_uwx_staff_ops.sql` adds shifts, help requests, event recaps, partner applications and their RPCs. It was tested locally, including partner isolation: UnderWeb roles get no access to partner groups.
- **Still limited:**
  - Event attendance only counts people seen by the PC running Event Mode.
  - "On duty" is self-reported by check-in; VRChat doesn't expose presence for other users' instances.
  - Flagged alerts only cover your own instance.


### 0.6.10-rc29: Discord moderation log
- **Edge function** `uwx-mod-discord` (Underweb-Network repo):
  - Posts to the private staff channel through the Supabase secret `UWX_MOD_DISCORD_WEBHOOK`.
  - Covers new VRChat moderation events from the shared archive and case events.
  - Each item posts exactly once: the posting position is claimed before anything is posted, so two staff syncing at once can't double-post.
  - Events older than 24 h are folded into a single "+N older entries" line instead of being posted one by one.
  - Owners can post a one-time history summary.
- **What triggers it:**
  - UWX after a sync that adds rows, and after case changes.
  - The Staff Dashboard poll, as a backstop.
  - Website case edits.
- **Never posted:** evidence, notes, free text, locations, instance links.
