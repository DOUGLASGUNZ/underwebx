# UnderWeb X — Combined RC10 Test Build

**Scope:** Group Moderation + Instance Inviter + Music OSC only. No cosmetic overhaul, no auto-updater changes.

**Source:** builds from pinned v0.2.0 source + existing RC1–RC9 patches + OSC2 + RC10 OSC reliability + Group Ops + Playing Media selection.
**Version inside test build:** `0.5.1-rc10` (does not change the public `features/release/RELEASE_VERSION` marker `0.5.0`).

## Windows artifact

Open the successful GitHub Actions run for the integration pull request, download the `UnderWebX-Windows` artifact, and extract it. The artifact should contain a setup EXE, a portable ZIP, and `SHA256SUMS.txt`. Validate SHA-256 before installing. PR artifacts are temporary; do not treat them as a permanent public release.

## QA in a controlled VRChat session

Do not try moderation on strangers. Use owned test accounts and a group where the tester has the correct VRChat permissions. Turn **off** automatic group recruiting/instance invites until the manual tests pass.

### Group Ops
1. Enter an approved Group instance. Confirm Group Ops shows the correct group ID.
2. Look up a test member by exact `usr_...` ID; test that a nonexistent user does not pass verification for member removal.
3. Without entering the confirmation ID, confirm Remove/Ban/Unban are disabled.
4. Enter the test account ID a second time. Confirm actions are enabled only if the current group matches the group verified by the lookup.
5. Change instance/group before confirming. Confirm actions are disabled.
6. With permission and explicit test-account consent, test a group member removal, group ban and unban separately. Verify results in VRChat.
7. Use an account lacking moderator rights; check that VRChat permission denials are displayed, with no misleading success.
8. Confirm that **Group Member Removal** is not labeled as an **Instance Kick**. Instance-only moderation is not yet implemented.

### Instance Inviter
1. In a normal Friends/Invite instance, disable automatic invites and manually invite one selected consenting test friend. Verify they receive an **instance** invitation.
2. Switch to another instance during an invite run; confirm the remaining queue stops.
3. Try the invite feature in an approved Group instance. Ensure audience selection, exclusions and cooldown work.
4. Try enabling automatic inviting in a nonapproved instance: UI must refuse to arm it.
5. For Group Recruiter, verify that only an explicitly approved group lobby can be used, already-member detection works, and `429` rate limits pause the queue.

### Music / OSC
1. Enable VRChat OSC on PC and UWX OSC Music. Verify exactly one chatbox screen is transmitted at a time.
2. Play Spotify desktop. Confirm song title/artist and accurate elapsed/duration. It may take a few seconds to update.
3. Skip tracks, pause, resume and stop; ensure stopped music doesn't keep broadcasting as though it were playing.
4. Open a different compatible Windows media player. Verify active playing source is chosen when Spotify is paused.
5. Let a song play for at least 30 seconds; confirm progress updates in VRChat every ~5 seconds when the content changes (not only in the UWX preview).
6. Save and favorite several statuses. Confirm only favorites rotate. Restart UWX and check favorites, theme, module toggles, and Stealth remain saved.
7. Activate Stealth and confirm OSC chatbox output immediately clears and stays silent after app restart. Restore explicitly.
8. Test VRChat desktop and VR mode; verify an OSC chatbox message displays to other people in an appropriately permitted instance (not just locally).

## Test-exit criteria

- Windows build workflow: successful.
- One valid manual instance invite delivered.
- Correct group membership permissions, typed confirmation and no accidental enforcement.
- Active music, song changes, and playback progress confirmed in VRChat by someone besides the tester.
- No automatic invitation or moderation outside explicitly authorized scopes.
- No regressions in old RC9 functionality.
- Only after all this should RC10 merge to main / become a public release.

**Known limitations:** Group Ops currently handles VRChat *group* member moderation, not in-world instance kick/warn tools. Playback depends on compatible Windows media sessions; not all players expose reliable timing. The existing OSC2 safety validator's internal blocklist needs completion before a broader public rollout.
