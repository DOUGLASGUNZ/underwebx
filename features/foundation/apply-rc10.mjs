import fs from 'node:fs';
import path from 'node:path';

// Run after apply-osc2.mjs and apply-osc2-ui.mjs.
// Idempotence is intentional: do not silently apply partial modifications.
const root = path.resolve(process.argv[2] || '.');
const target = path.join(root, 'src/views/UnderWeb/UnderWeb.vue');
const versionFile = path.join(root, 'UWX_VERSION');
const constantFile = path.join(root, 'src/shared/constants/uwx.js');
const changelogFile = path.join(root, 'CHANGELOG_UWX.md');
let view = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');

function replaceRequired(before, after) {
    if (!view.includes(before)) throw new Error('RC10: missing expected UI anchor: ' + before.slice(0, 90));
    view = view.replace(before, after);
}

const restoredState = [
    "    // UWX OSC preferences are local-only; never send ZIP or saved data to the UnderWeb server.",
    "    function osc2ReadLocal(key) {",
    "        try { return window.localStorage.getItem(key); } catch { return null; }",
    "    }",
    "    function osc2WriteLocal(key, value) {",
    "        try { window.localStorage.setItem(key, value); } catch { /* Storage may be disabled. */ }",
    "    }",
    "    function osc2RestorePreferences() {",
    "        const raw = osc2ReadLocal('UWX_osc2Statuses');",
    "        if (raw) {",
    "            try {",
    "                const parsed = JSON.parse(raw);",
    "                if (Array.isArray(parsed)) osc2Statuses.value = parsed",
    "                    .filter((item) => item && typeof item.text === 'string' && item.text.trim())",
    "                    .slice(0, 100)",
    "                    .map((item, index) => ({",
    "                        id: String(item.id || index),",
    "                        text: item.text.trim().slice(0, 144),",
    "                        favorite: item.favorite !== false,",
    "                        createdAt: Number(item.createdAt) || Date.now()",
    "                    }));",
    "            } catch { /* Ignore corrupt local data. */ }",
    "        }",
    "        const theme = osc2ReadLocal('UWX_osc2Theme');",
    "        if (['underweb', 'minimal', 'void', 'cyber', 'horror'].includes(theme)) osc2Theme.value = theme;",
    "        const enabled = osc2ReadLocal('UWX_osc2Enabled');",
    "        if (enabled) {",
    "            try {",
    "                const parsed = JSON.parse(enabled);",
    "                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {",
    "                    const valid = {};",
    "                    for (const key of ['music', 'status', 'weather', 'heart', 'world', 'custom', 'uwx']) {",
    "                        if (typeof parsed[key] === 'boolean') valid[key] = parsed[key];",
    "                    }",
    "                    osc2Enabled.value = { ...osc2Enabled.value, ...valid };",
    "                }",
    "            } catch { /* Ignore corrupt local data. */ }",
    "        }",
    "        // Stealth must survive a restart: never accidentally broadcast on relaunch.",
    "        if (osc2ReadLocal('UWX_osc2LastMode') === 'stealth') osc2Mode.value = 'stealth';",
    "    }",
    "    function osc2PersistPreferences() {",
    "        osc2WriteLocal('UWX_osc2Statuses', JSON.stringify(osc2Statuses.value.slice(0, 100)));",
    "        osc2WriteLocal('UWX_osc2Theme', osc2Theme.value);",
    "        osc2WriteLocal('UWX_osc2Enabled', JSON.stringify(osc2Enabled.value));",
    "        osc2WriteLocal('UWX_osc2LastMode', osc2Mode.value);",
    "    }",
    "    osc2RestorePreferences();"
].join('\n');

replaceRequired("    const osc2StatusDraft = ref('');", "    const osc2StatusDraft = ref('');\n" + restoredState);
replaceRequired(
    "    function toggleOsc2Pin() { void osc2SetMode(osc2Mode.value === 'pin' ? 'rotate' : 'pin', osc2CurrentKey.value); }",
    "    function toggleOsc2Pin() { void osc2SetMode(osc2Mode.value === 'pin' ? 'rotate' : 'pin', osc2CurrentKey.value); osc2PersistPreferences(); }"
);
replaceRequired(
    "    function toggleOsc2Stealth() { void (osc2Mode.value === 'stealth' ? osc2RestoreFromStealth() : osc2SetMode('stealth')); }",
    "    function toggleOsc2Stealth() { void (osc2Mode.value === 'stealth' ? osc2RestoreFromStealth() : osc2SetMode('stealth')); osc2PersistPreferences(); }"
);
replaceRequired(
    "    function setOsc2ModuleEnabled(key, value) { osc2Enabled.value = { ...osc2Enabled.value, [key]: Boolean(value) }; }",
    "    function setOsc2ModuleEnabled(key, value) { osc2Enabled.value = { ...osc2Enabled.value, [key]: Boolean(value) }; osc2PersistPreferences(); }"
);
replaceRequired(
    "    function setOsc2Theme(theme) { if (osc2Themes.includes(theme)) osc2Theme.value = theme; }",
    "    function setOsc2Theme(theme) { if (osc2Themes.includes(theme)) { osc2Theme.value = theme; osc2PersistPreferences(); } }"
);
replaceRequired(
    "        const text = osc2StatusDraft.value.trim();",
    "        const text = osc2StatusDraft.value.trim().slice(0, 144);"
);
replaceRequired(
    "        osc2StatusDraft.value = '';\n    }",
    "        osc2StatusDraft.value = '';\n        osc2PersistPreferences();\n    }"
);
replaceRequired(
    "    function toggleOsc2StatusFavorite(id) { osc2Statuses.value = osc2Statuses.value.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item); }",
    "    function toggleOsc2StatusFavorite(id) { osc2Statuses.value = osc2Statuses.value.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item); osc2PersistPreferences(); }"
);
replaceRequired(
    "    function deleteOsc2Status(id) { osc2Statuses.value = osc2Statuses.value.filter((item) => item.id !== id); }",
    "    function deleteOsc2Status(id) { osc2Statuses.value = osc2Statuses.value.filter((item) => item.id !== id); osc2PersistPreferences(); }"
);
replaceRequired(
    "    function rotateOsc2Status() { if (osc2Enabled.value.status && osc2Statuses.value.some((item) => item.favorite)) osc2NextStatus(); }",
    "    function rotateOsc2Status() {\n        if (!osc2Enabled.value.status || !osc2Statuses.value.some((item) => item.favorite)) return;\n        osc2NextStatus();\n        if (osc2Mode.value !== 'stealth' && (osc2CurrentKey.value === 'music' || osc2CurrentKey.value === 'status')) void sendOsc2Current();\n    }"
);
replaceRequired(
    "    // Keep the local music/progress UI reactive, but do not transmit OSC every second.\n    // Queue transitions and explicit interrupts are responsible for chatbox sends.\n    osc2MusicRefreshTimer = window.setInterval(() => {\n        if (osc2Enabled.value.music && osc2Mode.value !== 'stealth') {\n            void osc2CurrentScreen.value;\n        }\n    }, 1000);",
    "    // Refresh remote music progress while the music screen is active, without 1-second OSC spam.\n    let osc2LastMusicFrame = '';\n    osc2MusicRefreshTimer = window.setInterval(() => {\n        if (osc2Mode.value === 'stealth' || osc2CurrentKey.value !== 'music' || !osc2Enabled.value.music) {\n            osc2LastMusicFrame = '';\n            return;\n        }\n        const next = osc2CurrentScreen.value;\n        if (next && next !== osc2LastMusicFrame) {\n            osc2LastMusicFrame = next;\n            void sendOsc2Current();\n        }\n    }, 5000);"
);
replaceRequired(
    "    onBeforeUnmount(() => { window.clearInterval(osc2StatusRotationTimer); window.clearInterval(osc2MusicRefreshTimer); window.clearInterval(osc2QueueRotationTimer); });",
    "    // Refresh locally configured weather at startup and every 30 minutes.\n    if (/^\\d{5}$/.test(osc2WeatherZip.value)) void refreshOsc2Weather();\n    const osc2WeatherRefreshTimer = window.setInterval(() => {\n        if (/^\\d{5}$/.test(osc2WeatherZip.value) && osc2Enabled.value.weather) void refreshOsc2Weather();\n    }, 30 * 60 * 1000);\n    onBeforeUnmount(() => { window.clearInterval(osc2StatusRotationTimer); window.clearInterval(osc2MusicRefreshTimer); window.clearInterval(osc2QueueRotationTimer); window.clearInterval(osc2WeatherRefreshTimer); });"
);

fs.writeFileSync(target, view, 'utf8');
const currentVersion = fs.readFileSync(versionFile, 'utf8').trim();
if (currentVersion !== '0.5.0-osc2') throw new Error('RC10: version mismatch: ' + currentVersion);
fs.writeFileSync(versionFile, '0.5.1-rc10\n', 'utf8');
const constants = fs.readFileSync(constantFile, 'utf8');
if (!constants.includes("export const UWX_VERSION = '0.5.0-osc2';")) throw new Error('RC10: version constant mismatch');
fs.writeFileSync(constantFile, constants.replace("export const UWX_VERSION = '0.5.0-osc2';", "export const UWX_VERSION = '0.5.1-rc10';"), 'utf8');
const changelog = fs.readFileSync(changelogFile, 'utf8');
if (!changelog.includes('# UnderWeb X changelog\n\n')) throw new Error('RC10: changelog anchor missing');
fs.writeFileSync(changelogFile, changelog.replace('# UnderWeb X changelog\n\n', '# UnderWeb X changelog\n\n## 0.5.1-rc10 — OSC reliability\n\n- Saved OSC2 statuses, favorites, module toggles, theme, and Stealth preference locally across restarts.\n- Weather refreshes from a saved ZIP on launch and periodically while its module is enabled. ZIP is never included in OSC output.\n- Music screen progress updates in VRChat at most once every five seconds when the rendered content changes.\n- Live status selections transmit while Status or Music is shown, instead of only changing the local preview.\n\n'), 'utf8');
console.log('UWX RC10 OSC reliability applied.');
