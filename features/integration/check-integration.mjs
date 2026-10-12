import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve(process.argv[2] || '.');
const read = (relative) => readFileSync(join(root, relative), 'utf8');
const ui = read('src/views/UnderWeb/UnderWeb.vue');
const groups = read('src/stores/underweb.js');
const music = read('src/stores/oscLab.js');
const native = read('Dotnet/AppApi/Common/AppApiCommon.cs');
const version = read('UWX_VERSION').trim();

function has(file, label, needle) {
    assert.ok(file.includes(needle), `Missing ${label}: ${needle}`);
}
assert.equal(version, '0.5.2-rc11', 'Combined build should remain a beta/RC test, never overwrite public release marker.');

for (const needle of [
    "activePanel === 'moderation'",
    "modTakeAction('remove')",
    "modTakeAction('ban')",
    "modTakeAction('unban')",
    "modPreparedGroupId.value === modGroupId.value",
    "groupRequest.kickGroupMember",
    "groupRequest.banGroupMember",
    "groupRequest.unbanGroupMember",
    "NO AUTO-ENFORCEMENT",
]) has(ui, 'Group Ops', needle);

for (const needle of [
    "source !== 'manual' && !isCurrentGroupAllowed.value",
    "currentParsedLocation.value?.isRealInstance",
    "const canRecruitHere = computed(() => isGroupInstance.value && isCurrentGroupAllowed.value)",
    "scanAndInvite({ source: 'manual', force: true })",
]) {
    const file = needle.includes("scanAndInvite({") ? ui : groups;
    has(file, 'Invite scope', needle);
}

for (const needle of [
    "osc2RestorePreferences",
    "osc2PersistPreferences",
    "osc2LastMusicFrame",
    "osc2VisibleModules",
    "setOsc2BroadcastLayout('combined')",
    "sendOsc2Current()",
    "osc2Mode.value !== 'stealth'",
]) has(ui, 'Music/status OSC client', needle);

for (const needle of [
    "GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing",
    "manager.GetCurrentSession()",
]) has(native, 'Windows media selection', needle);

for (const needle of [
    "mediaState.value === 'playing'",
    "osc2ComposeCurrent()",
    "renderCombinedOsc",
    "osc2Mode.value === 'combined'",
    "if (osc2Mode.value === 'stealth') return false;",
    "validateOsc2Text(message)",
]) has(music, 'Music/Stealth output boundary', needle);

console.log('Combined Group Ops + Music OSC static integration checks passed.');
