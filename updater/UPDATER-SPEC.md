# UWX in-place updater — implementation plan

## Goal
Users install UWX once. Normal releases update the existing installation without manual uninstall/reinstall and without deleting local UWX configuration.

## Release channels
- stable — normal Weaver/public releases
- beta — early test releases
- dev — bleeding-edge internal builds

Persist selected channel locally.

## Update manifest
Publish a small signed/HTTPS-served JSON manifest per channel:

```json
{
  "channel": "beta",
  "version": "0.5.0",
  "publishedAt": "2026-09-28T00:00:00Z",
  "minimumUpdaterVersion": "1",
  "notes": ["OSC Lab 2.0"],
  "asset": {
    "url": "<release asset URL>",
    "sha256": "<sha256>"
  }
}
```

The app must treat manifest text as untrusted input. Only HTTPS assets from the configured release origin are accepted.

## Update flow
1. Check manifest for selected channel.
2. Compare semantic version with installed UWX version.
3. Download package to an application update staging directory.
4. Verify SHA-256 before execution/replacement.
5. Save a rollback copy/version marker.
6. Launch a tiny external updater process.
7. Main UWX exits.
8. Updater atomically replaces app files while preserving the user-data/config directory.
9. Updater starts UWX with `--post-update <oldVersion>`.
10. UWX marks startup healthy after initialization.
11. If health marker is not written / launch fails, updater restores prior package.

## Data boundary
Never store user settings inside replaceable application binaries/directories.

Preserve:
- OSC2 queue/settings
- saved statuses/favorites
- theme
- Pulsoid token/config
- UnderWeb/UWX preferences
- release channel
- local logs where appropriate

## UX
Settings > Updates:
- Installed version
- Channel selector
- Check for Updates
- automatic check toggle
- update status/progress

Available update card:
UWX <version> available
<release notes>
[UPDATE & RESTART]

## First milestone
Implement update-check + channel selection + manifest validation first.
Do not enable automatic binary replacement until packaging/install paths are confirmed for the current UWX Windows build.
