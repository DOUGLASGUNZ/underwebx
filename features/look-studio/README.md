# Look Studio — UWX 0.6.14-rc33 (development only)

An additive visual upgrade for the **existing UWX/VRCX-derived app**. No dependency on the discarded standalone prototype. Does not change login, VRChat API traffic, user history, group moderation, OSC output, or production site.

## What it adds
- Six coordinated **starting looks**: UnderWeb, The Void, Cyberline, Blood Moon, Minimal, Angel Engine.
- Comfortable / compact spacing.
- Sharp / soft / rounded corners.
- Solid / optional translucent glass panels.
- System motion or reduced motion, with OS reduced-motion preference respected.
- Instant live changes, local persistence and reset.
- Keeps the existing **Appearance** component's accent/tint controls; selecting a look uses the existing `useUwxThemeStore` to avoid two conflicting accent engines.

## How to reach it
The existing app sidebar has **UWX Settings** (System), which already holds `UwxAppearanceCard`. The new `UwxLookStudio` is inserted **directly beneath** that component. No new menu items or route changes.

## Integration and verification
Windows CI extracts the pinned v0.2.0 archive and applies the existing ordered patches through `0.6.13-rc32`. The guarded `apply-rc33.mjs` then copies the new original source files and inserts bounded imports and a component. The installer script **fails rather than guessing** if any existing anchor changes.

The existing UWX regression test command gains `uwxLook.test.js` for validation and preset round-trips; CI also builds the desktop installer for this branch as an artifact.

**No public release is authorized.** A passing CI build alone doesn't establish that the user has installed RC33. Test a private installer on Windows and check (1) existing VRChat login/presence, (2) navigation and layout, (3) group UI, (4) settings persistence after restart, (5) accent control still works, (6) reduced motion, (7) rollback to the known good release.

## Accessibility, privacy and scope
- No custom fonts, remote images, tracking, scripts from outside the bundle, or arbitrary CSS injection.
- New options are string-enumerated/validated. Look rendering only sets limited DOM data attributes; CSS handles presentation.
- Glass adds modest blur for aesthetic effect and should be kept opt-in for lower-end PCs.
- No avatar/world asset changes.
- Data storage is **this PC**, using a namespaced local cache and the existing app configuration repository.

## Rollback
Disable/uninstall the RC33 preview and use your existing UWX installation. Its data and authentication remain outside the Look Studio changes. For precise on-disk rollback and migration guarantees, validate installation/update behavior in a real Windows test first.
