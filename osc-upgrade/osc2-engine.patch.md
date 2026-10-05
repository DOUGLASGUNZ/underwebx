# OSC Lab 2.0 engine patch — implementation contract

This patch layer targets the current rc6/rc7 OSC Lab and replaces the old "all blocks in one message" composer with a one-screen-at-a-time rotation engine.

## Persistent config additions

```js
const OSC2_CONFIG = Object.freeze({
  mode: 'UWX_osc2Mode',                 // rotate | pin | stealth
  theme: 'UWX_osc2Theme',               // underweb | minimal | void | cyber | horror
  queue: 'UWX_osc2Queue',
  enabled: 'UWX_osc2EnabledModules',
  durations: 'UWX_osc2Durations',
  pinnedModule: 'UWX_osc2PinnedModule',
  statuses: 'UWX_osc2Statuses',
  weatherEnabled: 'UWX_osc2WeatherEnabled',
  trackInterrupt: 'UWX_osc2TrackInterrupt',
  heartInterrupt: 'UWX_osc2HeartInterrupt'
});

const DEFAULT_QUEUE = ['music', 'status', 'weather', 'heart', 'world', 'custom', 'uwx'];
const DEFAULT_ENABLED = {
  music: true, status: true, weather: false, heart: false,
  world: false, custom: false, uwx: true
};
```

## Runtime state

```js
const osc2Mode = ref('rotate');
const osc2Theme = ref('underweb');
const osc2Queue = ref([...DEFAULT_QUEUE]);
const osc2Enabled = ref({ ...DEFAULT_ENABLED });
const osc2Durations = ref(Object.fromEntries(DEFAULT_QUEUE.map(k => [k, 10])));
const osc2CurrentIndex = ref(0);
const osc2PreviousKey = ref('');
const osc2PinnedModule = ref('');
const osc2Statuses = ref([]); // { id, text, favorite, createdAt }
const osc2StatusBag = ref([]);
const osc2Interrupt = ref(null); // { type, text, until }
const osc2Weather = ref({ temperature: '', condition: '' }); // display-safe values ONLY
```

## Queue semantics

- Queue configuration never appears in VRChat.
- Exactly one rendered module is sent at a time.
- Disabled/unavailable modules are skipped.
- Rotate advances after the active module's configured duration.
- Pin holds one available module indefinitely.
- Stealth clears the chatbox immediately and suppresses rotation + interrupts.
- Leaving Stealth resumes at the prior queue position.

```js
function availableQueue() {
  return osc2Queue.value.filter(key => osc2Enabled.value[key] && moduleHasData(key));
}

function stepScreen(direction = 1) {
  const q = availableQueue();
  if (!q.length) return;
  const currentKey = q[osc2CurrentIndex.value % q.length];
  osc2PreviousKey.value = currentKey;
  osc2CurrentIndex.value = (osc2CurrentIndex.value + direction + q.length) % q.length;
}
```

## Status Pool

Favorite means eligible for output. Unfavorite means retained locally but removed from rotation.

Use a shuffle bag so all favorite statuses are exhausted before any repeat.

```js
function refillStatusBag() {
  const ids = osc2Statuses.value.filter(s => s.favorite).map(s => s.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  osc2StatusBag.value = ids;
}

function nextStatus() {
  if (!osc2StatusBag.value.length) refillStatusBag();
  const id = osc2StatusBag.value.shift();
  return osc2Statuses.value.find(s => s.id === id)?.text || '';
}
```

## Safety gate

Status filtering is mandatory and cannot be disabled. Do NOT expose the blocked-term dictionary or matching rule in error messages.

Validation occurs:
1. before a status is saved/imported;
2. again on the final rendered message immediately before SendOscChatbox.

Normalization must use NFKC, lowercase, remove zero-width/control chars, normalize common confusables/substitutions, collapse repeated characters, and create a compact comparison form with separators removed.

The implementation should keep the blocked dictionary in a dedicated internal module rather than UI code so future updates do not require touching the Status UI.

```js
function normalizeSafetyText(input) {
  return String(input || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/(.)\1{2,}/g, '$1$1');
}

function validateOscText(input) {
  const normalized = normalizeSafetyText(input);
  const compact = normalized.replace(/[^\p{L}\p{N}]+/gu, '');
  if (matchesBlockedTerm(normalized, compact)) {
    return { ok: false, reason: 'This status contains language blocked by UWX.' };
  }
  return { ok: true };
}
```

Never silently rewrite a rejected status.

## Theme renderer

Themes format data; they do not own source data.

```js
const THEMES = {
  underweb: {
    music: d => `🕷 SIGNAL // AUDIO\n${d.title} ${d.progress} ${d.time}`,
    status: d => `🕷 STATUS // SIGNAL\n${d.text}`,
    weather: d => `🕷 SIGNAL // WEATHER\n${d.icon} ${d.temperature} · ${d.condition}`,
    heart: d => `🕷 SIGNAL // VITALS\n♥ ${d.bpm} BPM`,
    world: d => `🕷 SIGNAL // WORLD\n${d.world}`,
    custom: d => `🕷 SIGNAL // STATUS\n${d.text}`,
    uwx: () => '🕷 UNDERWEB X // CONNECTED'
  },
  minimal: {
    music: d => `♫ ${d.title}\n${d.artist} · ${d.time}`,
    status: d => d.text,
    weather: d => `${d.icon} ${d.temperature} · ${d.condition}`,
    heart: d => `♥ ${d.bpm} BPM`,
    world: d => d.world,
    custom: d => d.text,
    uwx: () => 'UWX // CONNECTED'
  },
  void: {},
  cyber: {},
  horror: {}
};
```

Void/Cyber/Horror should receive distinct formatters in the implementation; no theme may add identifying location information.

## Music progress

Use the existing live Windows media timeline.

```js
function progressBar(position, duration, width = 9) {
  if (!duration || duration <= 0) return '━━━━━━━━━';
  const ratio = Math.max(0, Math.min(1, position / duration));
  const marker = Math.min(width - 1, Math.floor(ratio * width));
  return Array.from({ length: width }, (_, i) => i === marker ? '○' : '━').join('');
}
```

Track changes may raise a temporary interrupt. Interrupt expires and returns to the same queue position.

## Weather privacy boundary

The OSC renderer must never receive:
- city
- state
- ZIP/postcode
- coordinates
- timezone
- station/provider location label
- address

Only `temperature`, `condition`, and a condition-derived icon may cross into render state.

## Final send pipeline

```js
async function sendOsc2(message) {
  if (osc2Mode.value === 'stealth') return false;
  const safe = validateOscText(message);
  if (!safe.ok) {
    lastError.value = 'UWX blocked unsafe OSC output.';
    return false;
  }
  const clamped = clampChatbox(message);
  if (!clamped) return false;
  await AppApi.SendOscChatbox(clamped, true, false);
  outputLog.value = [{ at: Date.now(), text: clamped }, ...outputLog.value].slice(0, 20);
  return true;
}

async function enterStealth() {
  osc2Mode.value = 'stealth';
  osc2Interrupt.value = null;
  await AppApi.SendOscChatbox('', true, false);
}
```

## Current Screen UI contract

The OSC page should expose one compact control surface:

- Current rendered message
- Previous module
- Next module
- Countdown to next rotation
- Previous / Pause-or-Pin / Next / Hide controls
- Draggable/reorderable Screen Queue
- Status, Themes, Interrupts, Settings subpanels

The client may show the queue and internal module names. VRChat must never receive queue/debug/configuration text.
