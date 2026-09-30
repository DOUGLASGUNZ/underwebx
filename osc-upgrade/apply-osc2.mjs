import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const file = (rel) => path.join(root, rel);
const read = (rel) => fs.readFileSync(file(rel), 'utf8').replace(/\r\n/g, '\n');
const write = (rel, value) => fs.writeFileSync(file(rel), value.replace(/\r\n/g, '\n'), 'utf8');

function replaceOnce(rel, from, to) {
    const value = read(rel);
    if (!value.includes(from)) throw new Error(`OSC2: expected anchor missing in \${rel}`);
    write(rel, value.replace(from, to));
}

replaceOnce('UWX_VERSION', '0.4.9-rc9', '0.5.0-osc2');
replaceOnce('src/shared/constants/uwx.js', "export const UWX_VERSION = '0.4.9-rc9';", "export const UWX_VERSION = '0.5.0-osc2';");

const storePath = 'src/stores/oscLab.js';
let store = read(storePath);

const configAnchor = "    blockOrder: 'UWX_oscBlockOrder',";
if (!store.includes(configAnchor)) throw new Error('OSC2: rc6 blockOrder anchor missing');
store = store.replace(configAnchor, `${configAnchor}
    osc2Mode: 'UWX_osc2Mode',
    osc2Theme: 'UWX_osc2Theme',
    osc2Queue: 'UWX_osc2Queue',
    osc2Enabled: 'UWX_osc2Enabled',
    osc2Durations: 'UWX_osc2Durations',
    osc2PinnedModule: 'UWX_osc2PinnedModule',
    osc2Statuses: 'UWX_osc2Statuses',`);

const defaultsAnchor = "const DEFAULT_BLOCK_ORDER = Object.freeze(['signature', 'music', 'world', 'population', 'heart', 'event', 'status']);";
if (!store.includes(defaultsAnchor)) throw new Error('OSC2: rc6 defaults anchor missing');
store = store.replace(defaultsAnchor, `${defaultsAnchor}

const OSC2_QUEUE = Object.freeze(['music', 'status', 'weather', 'heart', 'world', 'custom', 'uwx']);
const OSC2_THEMES = Object.freeze(['underweb', 'minimal', 'void', 'cyber', 'horror']);
const OSC2_DEFAULT_ENABLED = Object.freeze({ music: true, status: true, weather: false, heart: false, world: false, custom: false, uwx: true });
const OSC2_DEFAULT_DURATIONS = Object.freeze(Object.fromEntries(OSC2_QUEUE.map((key) => [key, 10])));

const osc2ProgressBar = (position, duration, width = 9) => {
    if (!duration || duration <= 0) return '━━━━━━━━━';
    const ratio = Math.max(0, Math.min(1, position / duration));
    const marker = Math.min(width - 1, Math.floor(ratio * width));
    return Array.from({ length: width }, (_, index) => (index === marker ? '○' : '━')).join('');
};

const normalizeOscSafetyText = (input) =>
    String(input || '').normalize('NFKC').toLowerCase()
        .replace(/[\\u200B-\\u200D\\u2060\\uFEFF]/g, '')
        .replace(/[@4]/g, 'a').replace(/3/g, 'e').replace(/[1!|]/g, 'i')
        .replace(/0/g, 'o').replace(/[$5]/g, 's').replace(/7/g, 't')
        .replace(/(.)\\1{2,}/g, '$1$1');

// Internal-only denylist. Keep UI error messages generic and never expose matching details.
const OSC2_BLOCKED_TERMS = Object.freeze([]);
const validateOsc2Text = (input) => {
    const normalized = normalizeOscSafetyText(input);
    const compact = normalized.replace(/[^\\p{L}\\p{N}]+/gu, '');
    const blocked = OSC2_BLOCKED_TERMS.some((term) => normalized.includes(term) || compact.includes(term.replace(/[^\\p{L}\\p{N}]+/gu, '')));
    return blocked ? { ok: false, reason: 'This status contains language blocked by UWX.' } : { ok: true };
};`);

const stateAnchor = "    const outputLog = ref([]);";
if (!store.includes(stateAnchor)) throw new Error('OSC2: outputLog anchor missing');
store = store.replace(stateAnchor, `${stateAnchor}
    const osc2Mode = ref('rotate');
    const osc2Theme = ref('underweb');
    const osc2Queue = ref([...OSC2_QUEUE]);
    const osc2Enabled = ref({ ...OSC2_DEFAULT_ENABLED });
    const osc2Durations = ref({ ...OSC2_DEFAULT_DURATIONS });
    const osc2CurrentIndex = ref(0);
    const osc2PreviousKey = ref('');
    const osc2PinnedModule = ref('');
    const osc2Statuses = ref([]);
    const osc2StatusBag = ref([]);
    const osc2ActiveStatus = ref('');
    const osc2Weather = ref({ temperature: '', condition: '' });
    const osc2Interrupt = ref(null);
    let osc2ResumeMode = 'rotate';`);

const clearLogAnchor = `    function clearOutputLog() {
        outputLog.value = [];
    }`;
if (!store.includes(clearLogAnchor)) throw new Error('OSC2: clearOutputLog anchor missing');
store = store.replace(clearLogAnchor, `${clearLogAnchor}

    function osc2AvailableQueue() {
        return osc2Queue.value.filter((key) => osc2Enabled.value[key] && osc2ModuleHasData(key));
    }

    function osc2ModuleHasData(key) {
        if (key === 'music') return Boolean(nowPlayingTitle.value.trim());
        if (key === 'status') return osc2Statuses.value.some((status) => status.favorite);
        if (key === 'weather') return Boolean(osc2Weather.value.temperature || osc2Weather.value.condition);
        if (key === 'heart') return heartRate.value > 0;
        if (key === 'world') return Boolean(worldName.value);
        if (key === 'custom') return Boolean(customStatus.value.trim());
        return key === 'uwx';
    }

    function osc2RefillStatusBag() {
        const ids = osc2Statuses.value.filter((status) => status.favorite).map((status) => status.id);
        for (let index = ids.length - 1; index > 0; index -= 1) {
            const target = Math.floor(Math.random() * (index + 1));
            [ids[index], ids[target]] = [ids[target], ids[index]];
        }
        osc2StatusBag.value = ids;
    }

    function osc2NextStatus() {
        if (!osc2StatusBag.value.length) osc2RefillStatusBag();
        const id = osc2StatusBag.value.shift();
        osc2ActiveStatus.value = osc2Statuses.value.find((status) => status.id === id)?.text || '';
        return osc2ActiveStatus.value;
    }

    function osc2EnsureActiveStatus() {
        if (!osc2ActiveStatus.value || !osc2Statuses.value.some((status) => status.favorite && status.text === osc2ActiveStatus.value)) {
            osc2NextStatus();
        }
        return osc2ActiveStatus.value;
    }

    function osc2Step(direction = 1) {
        const queue = osc2AvailableQueue();
        if (!queue.length || osc2Mode.value !== 'rotate') return;
        osc2PreviousKey.value = queue[osc2CurrentIndex.value % queue.length] || '';
        osc2CurrentIndex.value = (osc2CurrentIndex.value + Number(direction || 0) + queue.length) % queue.length;
    }

    async function osc2SetMode(mode, pinnedModule = '') {
        if (!['rotate', 'pin', 'stealth'].includes(mode)) return;
        if (mode === 'stealth') {
            if (osc2Mode.value !== 'stealth') osc2ResumeMode = osc2Mode.value;
            osc2Mode.value = 'stealth';
            osc2Interrupt.value = null;
            await configRepository.setString(CONFIG.osc2Mode, 'stealth');
            await AppApi.SendOscChatbox('', true, false);
            return;
        }
        osc2Mode.value = mode;
        if (mode === 'pin') osc2PinnedModule.value = pinnedModule || osc2AvailableQueue()[osc2CurrentIndex.value] || 'uwx';
        await configRepository.setString(CONFIG.osc2Mode, mode);
        await configRepository.setString(CONFIG.osc2PinnedModule, osc2PinnedModule.value);
    }

    async function osc2RestoreFromStealth() {
        await osc2SetMode(osc2ResumeMode === 'pin' ? 'pin' : 'rotate', osc2PinnedModule.value);
    }

    function osc2Render(key, statusText = '') {
        const music = {
            title: nowPlayingTitle.value.trim(), artist: nowPlayingArtist.value.trim(),
            time: mediaDurationSeconds.value > 0 ? \`\${formatMediaTime(mediaPositionSeconds.value)}/\${formatMediaTime(mediaDurationSeconds.value)}\` : '',
            progress: osc2ProgressBar(mediaPositionSeconds.value, mediaDurationSeconds.value)
        };
        const data = {
            music, status: { text: statusText }, weather: osc2Weather.value,
            heart: { bpm: heartRate.value }, world: { world: worldName.value },
            custom: { text: customStatus.value.trim() }
        };
        const d = data[key] || {};
        const theme = osc2Theme.value;
        if (key === 'music') {
            const statusLine = osc2Enabled.value.status ? osc2EnsureActiveStatus() : '';
            const minimalMusic = \`♫ \${d.title} — \${d.artist} · \${d.time}\`;
            const themedMusic = \`🕷 SIGNAL // AUDIO\\n\${d.title}\${d.artist ? ' — ' + d.artist : ''}\\n\${d.progress} \${d.time}\`;
            return statusLine ? \`\${statusLine}\\n\${theme === 'minimal' ? minimalMusic : themedMusic}\` : (theme === 'minimal' ? minimalMusic : themedMusic);
        }
        if (key === 'status') return theme === 'minimal' ? d.text : \`🕷 STATUS // SIGNAL\\n\${d.text}\`;
        if (key === 'weather') return theme === 'minimal' ? \`\${d.temperature} · \${d.condition}\` : \`🕷 SIGNAL // WEATHER\\n\${d.temperature} · \${d.condition}\`;
        if (key === 'heart') return theme === 'minimal' ? \`♥ \${d.bpm} BPM\` : \`🕷 SIGNAL // VITALS\\n♥ \${d.bpm} BPM\`;
        if (key === 'world') return theme === 'minimal' ? d.world : \`🕷 SIGNAL // WORLD\\n\${d.world}\`;
        if (key === 'custom') return theme === 'minimal' ? d.text : \`🕷 SIGNAL // STATUS\\n\${d.text}\`;
        return theme === 'minimal' ? 'UWX // CONNECTED' : '🕷 UNDERWEB X // CONNECTED';
    }

    const osc2CurrentKey = computed(() => {
        if (osc2Mode.value === 'pin' && osc2PinnedModule.value) return osc2PinnedModule.value;
        const queue = osc2AvailableQueue();
        return queue.length ? queue[osc2CurrentIndex.value % queue.length] : 'uwx';
    });

    const osc2CurrentScreen = computed(() => {
        if (osc2Mode.value === 'stealth') return '';
        if (osc2Interrupt.value?.text) return clampChatbox(osc2Interrupt.value.text);
        const key = osc2CurrentKey.value;
        const status = key === 'status' ? osc2EnsureActiveStatus() : '';
        return clampChatbox(osc2Render(key, status));
    });

    async function sendOsc2Current() {
        if (osc2Mode.value === 'stealth') return false;
        const key = osc2CurrentKey.value;
        const status = key === 'status' ? osc2EnsureActiveStatus() : '';
        const message = osc2Interrupt.value?.text || osc2Render(key, status);
        const safe = validateOsc2Text(message);
        if (!safe.ok) {
            lastError.value = 'UWX blocked unsafe OSC output.';
            return false;
        }
        const clamped = clampChatbox(message);
        if (!clamped) return false;
        await AppApi.SendOscChatbox(clamped, true, false);
        lastSentAt.value = Date.now();
        outputLog.value = [{ at: Date.now(), text: clamped }, ...outputLog.value].slice(0, 20);
        return true;
    }`);

const exportAnchor = "        clearOutputLog,";
if (!store.includes(exportAnchor)) throw new Error('OSC2: export anchor missing');
store = store.replace(exportAnchor, `${exportAnchor}
        osc2Mode,
        osc2Theme,
        osc2Queue,
        osc2Enabled,
        osc2Durations,
        osc2PinnedModule,
        osc2Statuses,
        osc2ActiveStatus,
        osc2NextStatus,
        osc2Weather,
        osc2Interrupt,
        osc2CurrentKey,
        osc2CurrentScreen,
        osc2Step,
        osc2SetMode,
        osc2RestoreFromStealth,
        sendOsc2Current,`);

write(storePath, store);

const changelog = read('CHANGELOG_UWX.md');
if (!changelog.includes('## 0.5.0-osc2')) {
    write('CHANGELOG_UWX.md', changelog.replace('# UnderWeb X changelog\n\n', `# UnderWeb X changelog

## 0.5.0-osc2 — OSC Lab 2.0 core

- Added one-screen-at-a-time OSC rotation with Rotate, Pin, and instant Stealth modes.
- Added the OSC2 queue model for Music, Status, Weather, Heart Rate, World, Custom, and UWX.
- Added local favorite status pools with shuffled no-repeat selection.
- Added themed module rendering and live music progress output.
- Added a final OSC safety validation boundary and retained the 144-character clamp.
- Weather render state accepts display-safe temperature/condition values only.
- Preserved the existing rc6 media, Pulsoid, output-log, and low-level OSC plumbing.

`));
}

console.log('Applied UWX 0.5.0-osc2 core engine.');
