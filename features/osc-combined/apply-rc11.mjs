import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const source = (name) => path.join(root, name);
function edit(name, edits) {
    let content = fs.readFileSync(source(name), 'utf8').replace(/\r\n/g, '\n');
    for (const [from, to] of edits) {
        if (!content.includes(from)) throw new Error('Combined OSC: anchor not found in ' + name + ': ' + from.slice(0, 85));
        content = content.replace(from, to);
    }
    fs.writeFileSync(source(name), content, 'utf8');
}

const composer = fs.readFileSync(new URL('./oscComposer.mjs', import.meta.url), 'utf8');
fs.copyFileSync(new URL('./oscComposer.mjs', import.meta.url), source('src/shared/oscComposer.mjs'));

edit('src/stores/oscLab.js', [
    [
        "import { defineStore } from 'pinia';",
        "import { defineStore } from 'pinia';\nimport { renderCombinedOsc } from '../shared/oscComposer.mjs';"
    ],
    [
        "const OSC2_DEFAULT_ENABLED = Object.freeze({ music: true, status: true, weather: false, heart: false, world: false, custom: false, uwx: true });",
        "const OSC2_DEFAULT_ENABLED = Object.freeze({ music: true, status: true, weather: true, heart: false, world: false, custom: false, uwx: false });"
    ],
    ["    const osc2Mode = ref('rotate');", "    const osc2Mode = ref('combined');"],
    ["    let osc2ResumeMode = 'rotate';", "    let osc2ResumeMode = 'combined';"],
    [
        "if (!['rotate', 'pin', 'stealth'].includes(mode)) return;",
        "if (!['combined', 'rotate', 'pin', 'stealth'].includes(mode)) return;"
    ],
    [
        "await osc2SetMode(osc2ResumeMode === 'pin' ? 'pin' : 'rotate', osc2PinnedModule.value);",
        "await osc2SetMode(['combined', 'rotate', 'pin'].includes(osc2ResumeMode) ? osc2ResumeMode : 'combined', osc2PinnedModule.value);"
    ],
    [
        "    const osc2CurrentKey = computed(() => {",
        [
            "    function osc2ComposeCurrent() {",
            "        const playing = Boolean(nowPlayingTitle.value.trim() && (!autoMedia.value || mediaState.value === 'playing'));",
            "        const time = playing && mediaDurationSeconds.value > 0",
            "            ? formatMediaTime(mediaPositionSeconds.value) + '/' + formatMediaTime(mediaDurationSeconds.value)",
            "            : '';",
            "        return renderCombinedOsc({",
            "            status: osc2EnsureActiveStatus(),",
            "            title: nowPlayingTitle.value, artist: nowPlayingArtist.value,",
            "            time, isPlaying: playing,",
            "            temperature: osc2Weather.value.temperature,",
            "            condition: osc2Weather.value.condition,",
            "            enabled: osc2Enabled.value",
            "        });",
            "    }",
            "",
            "    const osc2CurrentKey = computed(() => {"
        ].join('\n')
    ],
    [
        "    const osc2CurrentKey = computed(() => {\n        if (osc2Mode.value === 'pin'",
        "    const osc2CurrentKey = computed(() => {\n        if (osc2Mode.value === 'combined') return 'combined';\n        if (osc2Mode.value === 'pin'"
    ],
    [
        "        if (osc2Interrupt.value?.text) return clampChatbox(osc2Interrupt.value.text);",
        "        if (osc2Mode.value === 'combined') return osc2ComposeCurrent();\n        if (osc2Interrupt.value?.text) return clampChatbox(osc2Interrupt.value.text);"
    ],
    [
        "        const message = osc2Interrupt.value?.text || osc2Render(key, status);",
        "        const message = osc2Mode.value === 'combined' ? osc2ComposeCurrent() : (osc2Interrupt.value?.text || osc2Render(key, status));"
    ],
    [
        "        const clamped = clampChatbox(message);",
        "        const clamped = osc2Mode.value === 'combined' ? message : clampChatbox(message);"
    ]
]);

edit('src/views/UnderWeb/UnderWeb.vue', [
    [
        "    osc2RestorePreferences();",
        [
            "    osc2RestorePreferences();",
            "    // One-time upgrade: turn on all three requested components together.",
            "    // Respect user toggles on every subsequent launch.",
            "    if (osc2ReadLocal('UWX_oscCombinedMigration') !== '1') {",
            "        osc2Enabled.value = { ...osc2Enabled.value, status: true, music: true, weather: true, uwx: false };",
            "        osc2WriteLocal('UWX_oscCombinedMigration', '1');",
            "        osc2PersistPreferences();",
            "    }"
        ].join('\n')
    ],
    [
        '                                <Badge :variant="osc2Mode === \'stealth\' ? \'outline\' : \'default\'">{{ osc2Mode === \'pin\' ? \'PINNED\' : osc2Mode.toUpperCase() }}</Badge>',
        '                                <Badge :variant="osc2Mode === \'stealth\' ? \'outline\' : \'default\'">{{ osc2Mode === \'combined\' ? \'ALL LIVE\' : (osc2Mode === \'pin\' ? \'PINNED\' : osc2Mode.toUpperCase()) }}</Badge>'
    ],
    [
        '<div class="uwx-osc2-meta"><span>PREV: {{ osc2PreviousLabel }}</span><span>NEXT: {{ osc2NextLabel }}</span></div>',
        '<div class="uwx-osc2-meta"><span>{{ osc2Mode === \'combined\' ? \'STATUS + MUSIC + WEATHER • ONE CHATBOX\' : (\'PREV: \' + osc2PreviousLabel) }}</span><span v-if="osc2Mode !== \'combined\'">NEXT: {{ osc2NextLabel }}</span></div>'
    ],
    [
        '                                <Button size="sm" variant="outline" :disabled="osc2Mode === \'stealth\'" @click="osc2Step(-1)">◀</Button>',
        '                                <Button size="sm" :variant="osc2Mode === \'combined\' ? \'default\' : \'outline\'" :disabled="osc2Mode === \'stealth\'" @click="setOsc2BroadcastLayout(\'combined\')">ALL LIVE</Button>\n                                <Button v-if="osc2Mode !== \'combined\'" size="sm" variant="outline" :disabled="osc2Mode === \'stealth\'" @click="osc2Step(-1)">◀</Button>'
    ],
    [
        '                                <Button size="sm" :variant="osc2Mode === \'pin\' ? \'default\' : \'outline\'" :disabled="osc2Mode === \'stealth\'" @click="toggleOsc2Pin">{{ osc2Mode === \'pin\' ? \'UNPIN\' : \'PIN\' }}</Button>',
        '                                <Button v-if="osc2Mode !== \'combined\'" size="sm" :variant="osc2Mode === \'pin\' ? \'default\' : \'outline\'" :disabled="osc2Mode === \'stealth\'" @click="toggleOsc2Pin">{{ osc2Mode === \'pin\' ? \'UNPIN\' : \'PIN\' }}</Button>'
    ],
    [
        '                                <Button size="sm" variant="outline" :disabled="osc2Mode === \'stealth\'" @click="osc2Step(1)">▶</Button>',
        '                                <Button v-if="osc2Mode !== \'combined\'" size="sm" variant="outline" :disabled="osc2Mode === \'stealth\'" @click="osc2Step(1)">▶</Button>\n                                <Button v-if="osc2Mode === \'combined\'" size="sm" variant="outline" @click="setOsc2BroadcastLayout(\'rotate\')">ROTATE</Button>'
    ],
    [
        '<strong>Screen Queue</strong><span>UWX rotates one enabled screen at a time.</span>',
        '<strong>Live Modules</strong><span>Status, music and weather display together. ROTATE is optional.</span>'
    ],
    [
        '                                <div v-for="(key, index) in osc2Queue" :key="key" class="uwx-builder-item">',
        '                                <div v-for="(key, index) in osc2VisibleModules" :key="key" class="uwx-builder-item">'
    ],
    [
        '<strong>{{ osc2ModuleLabels[key] }}</strong><small>{{ osc2Durations[key] }}s</small>',
        '<strong>{{ osc2ModuleLabels[key] }}</strong><small v-if="osc2Mode === \'rotate\'">{{ osc2Durations[key] }}s</small>'
    ],
    [
        'Queue settings stay inside UWX. VRChat only receives the current rendered screen.',
        'All enabled modules appear in one message in ALL LIVE mode; ZIP never goes into VRChat OSC.'
    ],
    [
        '    const osc2ModuleLabels = {',
        "    const osc2VisibleModules = computed(() => osc2Mode.value === 'combined' ? ['status', 'music', 'weather'] : osc2Queue.value);\n    const osc2ModuleLabels = {"
    ],
    [
        "    function toggleOsc2Pin() {",
        "    function setOsc2BroadcastLayout(mode) { void osc2SetMode(mode).then(() => { osc2PersistPreferences(); void sendOsc2Current(); }); }\n    function toggleOsc2Pin() {"
    ],
    [
        "    function setOsc2ModuleEnabled(key, value) { osc2Enabled.value = { ...osc2Enabled.value, [key]: Boolean(value) }; osc2PersistPreferences(); }",
        "    function setOsc2ModuleEnabled(key, value) { osc2Enabled.value = { ...osc2Enabled.value, [key]: Boolean(value) }; osc2PersistPreferences(); void sendOsc2Current(); }"
    ],
    [
        "    function setOsc2Theme(theme) { if (osc2Themes.includes(theme)) { osc2Theme.value = theme; osc2PersistPreferences(); } }",
        "    function setOsc2Theme(theme) { if (osc2Themes.includes(theme)) { osc2Theme.value = theme; osc2PersistPreferences(); void sendOsc2Current(); } }"
    ],
    [
        "if (osc2Mode.value !== 'stealth' && (osc2CurrentKey.value === 'music' || osc2CurrentKey.value === 'status')) void sendOsc2Current();",
        "if (osc2Mode.value !== 'stealth' && (osc2Mode.value === 'combined' || osc2CurrentKey.value === 'music' || osc2CurrentKey.value === 'status')) void sendOsc2Current();"
    ],
    [
        "if (osc2Mode.value === 'stealth' || osc2CurrentKey.value !== 'music' || !osc2Enabled.value.music) {",
        "if (osc2Mode.value === 'stealth' || (osc2Mode.value !== 'combined' && osc2CurrentKey.value !== 'music')) {"
    ],
    [
        "        if (next && next !== osc2LastMusicFrame) {",
        "        if (next !== osc2LastMusicFrame) {"
    ],
    [
        "        if (osc2Queue.value.filter((key) => osc2Enabled.value[key]).length < 0) return;",
        "        if (osc2Queue.value.filter((key) => osc2Enabled.value[key]).length < 0) return;"
    ]
].filter(([from]) => !from.includes('length < 0')));

edit('UWX_VERSION', [['0.5.1-rc10', '0.5.2-rc11']]);
edit('src/shared/constants/uwx.js', [["export const UWX_VERSION = '0.5.1-rc10';", "export const UWX_VERSION = '0.5.2-rc11';"]]);
edit('CHANGELOG_UWX.md', [[
    '# UnderWeb X changelog\n\n',
    [
        '# UnderWeb X changelog',
        '',
        '## 0.5.2-rc11 — Music + Weather + Status live together',
        '',
        '- Default OSC layout is ALL LIVE: status, now playing and weather in one continuous VRChat chatbox message.',
        '- Updated music playback timeline remains live while status rotates; weather updates without replacing the other two lines.',
        '- All three lines are retained under the 144 UTF-16-character limit with safe truncation of long names.',
        '- Weather, Music and Status are auto-enabled once for the existing settings migration and remain individually toggleable.',
        '- Legacy ROTATE mode is still available, with Stealth continuing to clear outgoing chatbox messages.',
        '',
        ''
    ].join('\n')
]]);
console.log('Applied 0.5.2-rc11 simultaneous OSC mode.');
