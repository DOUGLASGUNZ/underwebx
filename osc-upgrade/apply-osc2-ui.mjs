import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const p = (rel) => path.join(root, rel);
const read = (rel) => fs.readFileSync(p(rel), 'utf8').replace(/\r\n/g, '\n');
const write = (rel, value) => fs.writeFileSync(p(rel), value.replace(/\r\n/g, '\n'), 'utf8');

const rel = 'src/views/UnderWeb/UnderWeb.vue';
let s = read(rel);

const vueImportMatch = s.match(/import\s*\{([^}]*)\}\s*from\s*['"]vue['"];?/);
if (!vueImportMatch) throw new Error('OSC2 UI: Vue import anchor missing');
if (!vueImportMatch[1].split(',').map((name) => name.trim()).includes('onBeforeUnmount')) {
    const imports = vueImportMatch[1].split(',').map((name) => name.trim()).filter(Boolean);
    imports.push('onBeforeUnmount');
    s = s.replace(vueImportMatch[0], `import { ${imports.join(', ')} } from 'vue';`);
}

const livePreview = `                        <section class="uwx-premium-panel uwx-preview-panel">
                            <div class="uwx-panel-title"><div><i class="ri-eye-line" /><div><strong>Live Preview</strong><span>This is what will be sent to VRChat.</span></div></div><strong class="uwx-char-count">{{ oscPreviewLength }}/144</strong></div>
                            <div class="uwx-live-preview"><p>{{ oscChatboxPreview || 'Nothing enabled yet.' }}</p></div>
                            <div class="uwx-char-meter"><span :style="{ width: \`\${oscPreviewPercent}%\` }" /></div>
                            <small class="uwx-help">Lower-priority blocks drop first when the chatbox budget gets tight.</small>
                        </section>`;

const currentScreen = `                        <section class="uwx-premium-panel uwx-preview-panel uwx-osc2-current">
                            <div class="uwx-panel-title">
                                <div><i class="ri-broadcast-fill" /><div><strong>Current Screen</strong><span>Exactly what UWX is broadcasting to VRChat.</span></div></div>
                                <Badge :variant="osc2Mode === 'stealth' ? 'outline' : 'default'">{{ osc2Mode === 'pin' ? 'PINNED' : osc2Mode.toUpperCase() }}</Badge>
                            </div>
                            <div class="uwx-live-preview uwx-osc2-screen"><p>{{ osc2Mode === 'stealth' ? 'UWX output hidden' : (osc2CurrentScreen || 'Waiting for an enabled screen...') }}</p></div>
                            <div class="uwx-osc2-meta"><span>PREV: {{ osc2PreviousLabel }}</span><span>NEXT: {{ osc2NextLabel }}</span></div>
                            <div class="uwx-osc2-controls">
                                <Button size="sm" variant="outline" :disabled="osc2Mode === 'stealth'" @click="osc2Step(-1)">◀</Button>
                                <Button size="sm" :variant="osc2Mode === 'pin' ? 'default' : 'outline'" :disabled="osc2Mode === 'stealth'" @click="toggleOsc2Pin">{{ osc2Mode === 'pin' ? 'UNPIN' : 'PIN' }}</Button>
                                <Button size="sm" variant="outline" :disabled="osc2Mode === 'stealth'" @click="osc2Step(1)">▶</Button>
                                <Button size="sm" :variant="osc2Mode === 'stealth' ? 'default' : 'destructive'" @click="toggleOsc2Stealth">{{ osc2Mode === 'stealth' ? 'RESTORE' : 'HIDE' }}</Button>
                            </div>
                        </section>`;
if (!s.includes(livePreview)) throw new Error('OSC2 UI: rc6 Live Preview anchor missing');
s = s.replace(livePreview, currentScreen);

const builderStart = `                        <section class="uwx-premium-panel uwx-builder-panel">
                            <div class="uwx-panel-title"><div><i class="ri-stack-line" /><div><strong>Live Status Builder</strong><span>Top items have higher priority when space is limited.</span></div></div><Badge variant="outline">SMART FIT</Badge></div>
                            <div class="uwx-builder-list">`;
if (!s.includes(builderStart)) throw new Error('OSC2 UI: builder anchor missing');
s = s.replace(builderStart, `                        <section class="uwx-premium-panel uwx-builder-panel">
                            <div class="uwx-panel-title"><div><i class="ri-stack-line" /><div><strong>Screen Queue</strong><span>UWX rotates one enabled screen at a time.</span></div></div><Badge variant="outline">OSC 2.0</Badge></div>
                            <div class="uwx-builder-list uwx-osc2-queue">
                                <div v-for="(key, index) in osc2Queue" :key="key" class="uwx-builder-item">
                                    <span class="uwx-builder-handle">≡</span>
                                    <div class="uwx-builder-main"><i :class="osc2ModuleIcons[key]" /><strong>{{ osc2ModuleLabels[key] }}</strong><small>{{ osc2Durations[key] }}s</small></div>
                                    <Switch :model-value="osc2Enabled[key]" @update:modelValue="setOsc2ModuleEnabled(key, $event)" />
                                </div>
                            </div>
                            <div class="uwx-builder-controls mt-3">
                                <div class="uwx-osc2-themes"><Button v-for="theme in osc2Themes" :key="theme" size="sm" :variant="osc2Theme === theme ? 'default' : 'outline'" @click="setOsc2Theme(theme)">{{ theme.toUpperCase() }}</Button></div>
                                <p class="uwx-help mt-2">Queue settings stay inside UWX. VRChat only receives the current rendered screen.</p>
                            </div>
                        </section>

                        <section class="uwx-premium-panel uwx-osc2-status">
                            <div class="uwx-panel-title"><div><i class="ri-chat-3-line" /><div><strong>Status Pool</strong><span>Starred statuses rotate without repeating until the pool is exhausted.</span></div></div></div>
                            <div class="flex gap-2"><Input v-model="osc2StatusDraft" placeholder="Add a saved status..." /><Button size="sm" @click="addOsc2Status">Add</Button></div>
                            <div class="uwx-osc2-status-list mt-3"><div v-for="item in osc2Statuses" :key="item.id"><button type="button" @click="toggleOsc2StatusFavorite(item.id)">{{ item.favorite ? '★' : '☆' }}</button><span>{{ item.text }}</span><button type="button" @click="deleteOsc2Status(item.id)">×</button></div></div>
                        </section>

                        <section class="uwx-premium-panel uwx-osc2-interrupts">
                            <div class="uwx-panel-title"><div><i class="ri-flashlight-line" /><div><strong>Smart Interrupts</strong><span>Briefly take over, then return to your queue.</span></div></div></div>
                            <label class="uwx-toggle-row compact"><div><strong>New Track</strong><span>Show a new song immediately</span></div><Switch :model-value="osc2TrackInterrupt" @update:modelValue="osc2TrackInterrupt = $event" /></label>
                            <label class="uwx-toggle-row compact"><div><strong>Heart Rate Spike</strong><span>Show a meaningful BPM spike</span></div><Switch :model-value="osc2HeartInterrupt" @update:modelValue="osc2HeartInterrupt = $event" /></label>
                            <p class="uwx-help mt-2">Weather output is restricted to temperature and conditions. UWX never puts your weather location into OSC.</p>
                        </section>

                        <section v-if="false" class="uwx-premium-panel uwx-builder-panel">
                            <div class="uwx-builder-list">`);

const destructureAnchor = `        outputLog: oscOutputLog,`;
if (!s.includes(destructureAnchor)) throw new Error('OSC2 UI: store destructure anchor missing');
s = s.replace(destructureAnchor, `${destructureAnchor}
        osc2Mode,
        osc2Theme,
        osc2Queue,
        osc2Enabled,
        osc2Durations,
        osc2Statuses,
        osc2ActiveStatus,
        osc2CurrentKey,
        osc2CurrentScreen,`);

const actionAnchor = `        clearOutputLog: clearOscOutputLog,`;
if (!s.includes(actionAnchor)) throw new Error('OSC2 UI: action destructure anchor missing');
s = s.replace(actionAnchor, `${actionAnchor}
        osc2Step,
        osc2SetMode,
        osc2RestoreFromStealth,
        osc2NextStatus,
        sendOsc2Current,`);

const helperAnchor = `    const oscPresetCards = [`;
if (!s.includes(helperAnchor)) throw new Error('OSC2 UI: helper anchor missing');
s = s.replace(helperAnchor, `    const osc2Themes = ['underweb', 'minimal', 'void', 'cyber', 'horror'];
    const osc2ModuleLabels = { music: 'Music', status: 'Status', weather: 'Weather', heart: 'Heart Rate', world: 'World', custom: 'Custom', uwx: 'UWX' };
    const osc2ModuleIcons = { music: 'ri-music-2-fill', status: 'ri-chat-3-line', weather: 'ri-cloudy-line', heart: 'ri-heart-pulse-fill', world: 'ri-global-line', custom: 'ri-text', uwx: 'ri-spider-line' };
    const osc2StatusDraft = ref('');
    const osc2TrackInterrupt = ref(true);
    const osc2HeartInterrupt = ref(true);
    let osc2StatusRotationTimer = null;
    let osc2MusicRefreshTimer = null;
    const osc2PreviousLabel = computed(() => '—');
    const osc2NextLabel = computed(() => {
        const queue = osc2Queue.value.filter((key) => osc2Enabled.value[key]);
        if (!queue.length) return '—';
        const index = Math.max(0, queue.indexOf(osc2CurrentKey.value));
        return osc2ModuleLabels[queue[(index + 1) % queue.length]] || '—';
    });
    function toggleOsc2Pin() { void osc2SetMode(osc2Mode.value === 'pin' ? 'rotate' : 'pin', osc2CurrentKey.value); }
    function toggleOsc2Stealth() { void (osc2Mode.value === 'stealth' ? osc2RestoreFromStealth() : osc2SetMode('stealth')); }
    function setOsc2ModuleEnabled(key, value) { osc2Enabled.value = { ...osc2Enabled.value, [key]: Boolean(value) }; }
    function setOsc2Theme(theme) { if (osc2Themes.includes(theme)) osc2Theme.value = theme; }
    function addOsc2Status() {
        const text = osc2StatusDraft.value.trim();
        if (!text) return;
        osc2Statuses.value = [...osc2Statuses.value, { id: \`\${Date.now()}-\${Math.random().toString(36).slice(2, 7)}\`, text, favorite: true, createdAt: Date.now() }];
        osc2StatusDraft.value = '';
    }
    function toggleOsc2StatusFavorite(id) { osc2Statuses.value = osc2Statuses.value.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item); }
    function deleteOsc2Status(id) { osc2Statuses.value = osc2Statuses.value.filter((item) => item.id !== id); }
    function rotateOsc2Status() { if (osc2Enabled.value.status && osc2Statuses.value.some((item) => item.favorite)) osc2NextStatus(); }
    osc2StatusRotationTimer = window.setInterval(rotateOsc2Status, 10000);
    osc2MusicRefreshTimer = window.setInterval(() => { if (osc2Enabled.value.music && osc2Mode.value !== 'stealth') void sendOsc2Current(); }, 1000);
    onBeforeUnmount(() => { window.clearInterval(osc2StatusRotationTimer); window.clearInterval(osc2MusicRefreshTimer); });

${helperAnchor}`);

const styleAnchor = `    .uwx-osc-premium { border-color:`;
if (!s.includes(styleAnchor)) throw new Error('OSC2 UI: style anchor missing');
s = s.replace(styleAnchor, `    .uwx-osc2-current { grid-column: 1 / -1; }
    .uwx-osc2-screen { min-height: 76px; white-space: pre-line; }
    .uwx-osc2-meta { display:flex; justify-content:space-between; gap:12px; margin-top:8px; color:var(--muted-foreground); font-size:9px; }
    .uwx-osc2-controls { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; margin-top:10px; }
    .uwx-osc2-queue .uwx-builder-main small { margin-left:auto; color:var(--muted-foreground); font-size:9px; }
    .uwx-osc2-themes { display:flex; flex-wrap:wrap; gap:5px; }
    .uwx-osc2-status-list { display:grid; gap:5px; max-height:180px; overflow:auto; }
    .uwx-osc2-status-list > div { display:grid; grid-template-columns:26px minmax(0,1fr) 26px; gap:6px; align-items:center; padding:7px; border:1px solid rgb(255 255 255 / 7%); border-radius:8px; }
    .uwx-osc2-status-list button { background:none; border:0; color:inherit; cursor:pointer; }
    .uwx-osc-premium { border-color:`);

write(rel, s);
console.log('Applied OSC Lab 2.0 UI layer.');
