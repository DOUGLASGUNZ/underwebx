# UWX RC39 — OSC Cosmetic Pack 1 + Scene Switcher

**Draft / unpublished.** This extends the actual OSC Lab in the existing VRCX-derived UWX. Requires RC38 and includes every preceding RC patch through RC38. No new OSC sender, login session, backend or published release.

## What has been added

**Three genuinely different looks**, alongside the existing six:
- **VOID.OS** — compact command-line / cyber terminal
- **Cassette Club** — tape player with optional track progress bar
- **Midnight FM** — late-night radio / DJ broadcast

They use all six modules that OSC Lab already supports: `music`, `video` (Now Showing), `weather`, `status`, `heart`, `world`. Users still control what modules are enabled and what actual data exists. Changing a theme is cosmetic only. Frame decoration is automatically dropped first when needed to obey VRChat's 144-character / 9-line limit, using the original `fitChatbox()` engine.

**Scene Switcher** (new card between Themes and Modules):
- Save your current templates, enabled modules, order, and header/footer into a privately stored scene.
- Preview a saved scene against fictional example data.
- Apply any saved scene with a single click.
- Safely replace a scene with the same name, or delete with a two-click confirmation.
- Maximum of eight saved scenes in the existing PC-local `configs` table via `configRepository`.
- Works entirely offline. No scene library uploads or cross-device sync.

## Privacy / behavior boundaries

- A saved scene contains ONLY the visual templates and module enable flags plus the order/frame. **It never contains status texts, precise ZIP/weather location, account tokens, Pulsoid credentials or history**.
- Applying a scene preserves the existing OSC master on/off value, favorite statuses, heart/weather provider options, and progress-refresh timing.
- The existing OSC Lab rate-limited sender is reused; no second send loop, API polling or auto-broadcast trigger.
- This is Unicode/text presentation, **not** an in-game colored rectangle, custom font or graphic. VRChat fonts may render some symbols differently.
- No new outbound requests or external dependencies, no backend changes, no staff role exposure.

## Engineering

- `uwxOscScenes.js`: pure snapshot validation/normalization, up to eight scenes, safe capture/apply/compare.
- `UwxOscSceneSwitcher.vue`: editable private scene management UI, preview using the original renderer, save-before-success behavior and recovery state if config loading fails.
- `apply-rc39.mjs`: guarded installer inserts themes in existing `CHATBOX_THEMES`, one atomic scene application method in `useOscLabStore`, Vue card and CSS, preserving all original modules and settings.
- `uwxOscScenes.test.js`: tests all three cosmetic previews stay within existing character/line limits, sensitive fields don't persist, sender isn't turned on and scene libraries are bounded.

## Release checklist

- [ ] Full source RC1–RC38 patch chain and guarded RC39 installer succeed.
- [ ] Existing OSC/VRCX/UWX unit tests plus `uwxOscScenes.test.js` pass; Windows package uploads.
- [ ] On a real PC, try each of the three new presets in the in-app live preview and in VRChat with optional modules on and off.
- [ ] Create, rename/replace, apply and delete scenes; restart and verify local persistence.
- [ ] Master OSC sender stays off when applying a scene while off; no rapid OSC bursts while switching scenes.
- [ ] Existing six preset themes, custom looks, statuses, weather config, Pulsoid settings and VRCX features remain intact.
- [ ] Test 144-char/9-line clipping with very long metadata, Unicode symbols and frame removal.
- [ ] Test the theme under dark/light, compact layout and keyboard focus.
- [ ] No release until user approves.

**Not built in this slice:** a drag-and-drop Composer or scene share/import codes. Those can follow if the Windows behavior is validated.
