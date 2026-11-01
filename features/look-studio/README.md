# UWX RC33 — Layout & Appearance Studio (existing UWX app)

**Status:** Development candidate. No public release authorized.

## Why this exists

RC19 already shipped **seven color themes**, a custom accent picker, and background tints in the current UWX development pipeline. The original RC33 draft accidentally duplicated that capability with another set of color presets. This revision **removes all duplicated color/theme presets**.

The layout studio adds only customization that the existing Appearance panel doesn't provide. It lives directly below `UwxAppearanceCard` in the UWX Settings page, reusing the existing VRCX-based application.

## Added controls

- Comfortable or compact content spacing.
- Small, normal or large UI type scale.
- Sharp, soft or rounded corners.
- Solid or optional blurred-glass panels (can affect GPU usage).
- System motion preference or reduced motion.
- Content backdrops: none, a subtle accent-colored ambient glow, a grid pattern, or a local image.
- Private local PNG/JPEG/WebP background import, up to 1.5 MB; no remote image URLs, uploads, CSS injection, or SVG.
- Restore layout defaults in one click.
- Existing accent/tint, chatbox themes, sidebar editor, friends, groups, auth, OSC, and account data remain untouched.

**Not implemented here:** draggable home dashboard widgets, named profiles that save *entire* sidebar/widget configurations, wallpaper cropping/repositioning, or support for arbitrary fonts. Those are separate larger follow-on features; don't imply this patch already adds them.

## Technical design

`features/look-studio/apply-rc33.mjs` injects only:
- new `src/shared/utils/uwxLook.js` (validation, pure model);
- new `src/stores/uwxLook.js` (local cached settings + existing config DB);
- new `src/views/UnderWeb/UwxLookStudio.vue`;
- new `src/styles/uwx-look.css`;
- new `src/shared/utils/__tests__/uwxLook.test.js`;
- import and component anchors in existing `src/App.vue` and `src/views/UnderWeb/UnderWeb.vue`;
- development version `0.6.14-rc33` and changelog.

It runs **after** the verified RC32 patch in the existing workflow and errors if existing import/component/version anchors aren't exactly as expected.

The new store sets enumerated `data-uwx-*` attributes on `document.documentElement`; the CSS supplies actual styling. **No extra theme engine or color settings are created.** Backgrounds are inline local data images only. The app never sends them to underweb.cloud, VRChat, or Discord. Image data is saved locally (browser cache + existing UWX config), not to a remote service; browser quota failures can still prevent persistence.

## Test and release gates

CI should:
1. Reconstruct the current VRCX-derived UWX base and all RC patches through 0.6.13-rc32.
2. Apply RC33 without anchor conflicts.
3. Run existing UWX regression suite + new layout validation tests.
4. Package the Windows installer artifact without making a public release.

On Windows, independently check:
- Actual appearance and background rendering in both dark and light modes, including readability.
- Existing color picker and color presets still work.
- Changes persist after restarting the app; user-imported image persists and clears.
- Friends presence, history, group views, login, and general navigation unchanged.
- Compact/large text doesn't clip high-density views.
- No unexpected performance impact from glass or background images.
- Old builds unaffected; rollback to known good release.

No production site, Supabase, live VRChat account, or published release has been changed.
