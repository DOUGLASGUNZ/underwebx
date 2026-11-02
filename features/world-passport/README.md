# UWX RC37 — World Passport

**Development candidate only.** Extends the original VRCX-based UWX and depends on RC36. No public release, backend changes, or VRChat API polling.

## What this first version adds

A first-class **World Passport** section near the existing VRCX Favorites folder.

- Browse last 180 days of **locally recorded worlds** plus all locally saved VRCX favorite-world IDs (bounded to 200 displayed results).
- Search by recorded world name or ID. Sort by most recent, visits or your ratings.
- Show locally recorded visit count, last visit, whether it's an actual VRCX favorite.
- **Rate a world 0–5 stars**, saved in UWX's local config only.
- **Organize worlds in your own collections** (up to 6 labels per world), separate from VRChat/VRCX favorites.
- **Read and edit the existing VRCX world memo** in the existing `world_memos` SQLite table; no second notes system.
- Open the original VRCX world details dialog to manage actual favorites, worlds, platforms, etc.
- New navigation item is added **once** to previously customized sidebars, without resetting folder order, hidden keys or selected layout.

## Data source details and limitations

`gamelog_location` and `favorite_world` are existing VRCX local database tables; world names come from cached `cache_world` metadata or local game-log names. If a favorite has never been visited on this PC, it still appears without invented visit history. Results are **bounded to 200 recent or favorite records**, and may not contain every world in a large library. The visit count is from distinct recorded instance/location strings and may not equal actual lifetime visits.

Ratings and collections use `UWX_worldPassport_v1` in existing PC-local app settings. No migrations, new tables, service credentials or cloud endpoints are introduced. The world memo editor uses the existing `world_memos` table, with awaited SQL writes so it doesn't claim a save succeeded prematurely.

This is a **personal organization layer**, not a marketplace, alternative favorites sync or public world-review system.

## Verify on a real Windows PC before releasing

- [ ] Full patch chain RC1–RC36 applies and guarded RC37 installer succeeds
- [ ] Existing regression tests and `uwxWorldPassport.test.js` pass
- [ ] Windows installer builds and preview artifact uploads
- [ ] Old VRCX favorites and world detail dialogs work unchanged
- [ ] Rating and collection changes persist after restart; don't overwrite existing favorites
- [ ] Existing world memo appears in the editor; edits appear in original VRCX world dialog
- [ ] Switching worlds with unsaved edits saves first or retains edits on failure
- [ ] Custom sidebar folder order and hidden items stay unchanged
- [ ] Dark/light, compact/large text, empty history, favorite never visited, 200-record limits
- [ ] No extra VRChat HTTP requests while browsing, sorting and editing

## Planned after RC37

See [Master Roadmap](../MASTER_ROADMAP.md). Avatar Locker is explicitly **excluded** by user direction. Next candidate: QuickDeck, followed by Event Discovery 2.0.
