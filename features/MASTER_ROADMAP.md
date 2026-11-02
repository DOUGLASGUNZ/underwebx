# UnderWeb X — Differentiation roadmap (November 2026)

**Product:** Keep upgrading the existing, VRCX-derived UWX desktop client. No rewrite, no duplicate theme/favorites/memo engines, no expensive Claude/API dependency, no unverified release.

**Explicit exclusion:** **Avatar Locker** — removed from the planned feature lineup at the user's request. Existing VRCX avatar features remain untouched, but UWX will not build an Avatar Locker product.

## What makes someone switch?

A compelling UWX needs an actual benefit for multiple audiences, not just additional settings or UnderWeb group tools. The daily experience needs to be discoverable and substantially better without losing VRCX fundamentals.

| Priority | Product | Audience | Reuse vs. actual addition | Status |
| --- | --- | --- | --- | --- |
| 1 | **World Passport** | World explorers, socializers | Existing VRCX visited-world log, favorites and memos. Add ratings, personal collections, easy discovery. | **RC37 draft implementation** |
| 2 | **QuickDeck** | Everyone | Reuse friends/presence, event actions, OSC controls. Add optional small always-on-top configurable window. | Candidate; validate Windows overlay and resource usage first |
| 3 | **Event Discovery 2.0** | Players, event hosts, DJs | Reuse Event Mode and UnderWeb event listings. Add opt-in multi-community calendars, host cards, reminders and reliable join-permission UX. | Candidate; review existing event integrations first |
| 4 | **Creator Network Workspace** | Creators, artists, DJs | Existing verified profiles, photo showcase, likes and application flows. Add collaboration/booking workflow and creator availability. | Candidate; connected account + permissions required |
| 5 | **Group Operations Polish** | Group owners and staff | Existing Group Intelligence, cases, staff handoffs and events. Add consolidated actionable view and better exports with permission boundaries. | Candidate; audit existing workflows before building |
| 6 | **Saved Workspaces** | Power users | Existing sidebar editor + RC33 layout controls + RC34 Home personalization. Add presets for Social / Creator / Group work, without forcing three applications. | Candidate; avoid duplicating the current dashboard system |
| 7 | **Night Archives** | Social and memory-focused users | Existing Game Log, event recaps, Recent Encounters and Session history. Add editable personal story markers and strictly opt-in sharing. | Candidate; no location/publicity without consent |

## Already implemented in development — do not rebuild

- RC19 original UWX accent presets/custom tint; RC33 Layout Studio extends layout, not palette.
- RC14 and later Event Mode, event attendance and recaps.
- RC20 Your Crew, local shared session time, and photo showcase.
- RC27+ Group Intelligence, moderation cases and staff tools.
- RC34 customizable existing four-card Home.
- RC35 Social Passport with existing VRCX memo + local tags.
- RC36 Recent Encounters based on the local PC game log.
- Standard VRCX friends, avatars, favorite worlds, charts, logs, world notes and customizable dashboards.

## Engineering and trust rules

1. A new module must say **what already exists**, **what genuinely changes**, **where its data comes from**, and **what remains unavailable**.
2. Use existing VRCX local SQLite/history and VRChat-permitted APIs; do not scrape hidden locations or claim all-time/universal activity.
3. No unattended mass invites, bans or auto-targeted enforcement; respect role permissions, rate limits, data minimization and explicit action confirmation.
4. Private notes, world ratings and personal collections live locally unless users separately consent to sharing.
5. Build isolated draft PRs on top of the most recent passing RC; automated tests plus real Windows QA before publishing.
6. Do not reset people's custom sidebar/theme or release automatically just to introduce a feature.

## Release gates for RC37 World Passport

- Verify all existing RC1–RC36 patches and RC37 installer apply.
- Run existing and new Vitest tests and package a Windows preview.
- Test existing VRCX Favorites, world dialog, world memo editing, first-run sidebar migration, custom nav preserved, empty logs, duplicate worlds, and world search.
- Confirm no new VRChat API polling and no live backend/database schema change.
- Keep the PR draft until approved for a release.
