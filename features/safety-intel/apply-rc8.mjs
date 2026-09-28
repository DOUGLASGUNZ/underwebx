import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const storeSource = path.resolve(process.argv[3] || 'features/safety-intel/safetyIntel.js');
const cssSource = path.resolve(process.argv[4] || 'features/safety-intel/safety-intel.css');

const file = (rel) => path.join(root, rel);
const read = (rel) => fs.readFileSync(file(rel), 'utf8').replace(/\r\n/g, '\n');
const write = (rel, value) => fs.writeFileSync(file(rel), value.replace(/\r\n/g, '\n'), 'utf8');

function replaceOnce(rel, from, to) {
    const value = read(rel);
    if (!value.includes(from)) throw new Error(`RC8 Safety Intel: expected text not found in ${rel}: ${from.slice(0, 90)}`);
    write(rel, value.replace(from, to));
}

replaceOnce('UWX_VERSION', '0.4.7-rc7', '0.4.8-rc8');
replaceOnce(
    'src/shared/constants/uwx.js',
    "export const UWX_VERSION = '0.4.7-rc7';",
    "export const UWX_VERSION = '0.4.8-rc8';"
);

const changelog = read('CHANGELOG_UWX.md');
if (!changelog.includes('## 0.4.8-rc8')) {
    const section = `# UnderWeb X changelog

## 0.4.8-rc8 — Safety Intel foundation

- Added UWX Safety Intel as a first-class panel focused on shared community awareness.
- Added public read-only lookup of reviewed safety summaries by VRChat user ID.
- Added current-instance scanning that highlights reviewed high-risk/caution records.
- Added reviewed safety badges to friend/profile quick-view after a lookup or scan.
- Safety categories cover crashing, doxxing/privacy threats, harassment, scams/impersonation, malicious client behavior, ban evasion, and other reviewed behavior.
- No automatic bans, kicks, blocks, reports, or enforcement actions are performed by UWX.
- Added clear “no record is not a guarantee of safety” language and review metadata.

`;
    write('CHANGELOG_UWX.md', changelog.replace('# UnderWeb X changelog\n\n', section));
}

fs.copyFileSync(storeSource, file('src/stores/safetyIntel.js'));
fs.copyFileSync(cssSource, file('src/styles/uwx-safety-intel.css'));

let app = read('src/App.vue');
if (!app.includes("import '@/styles/uwx-safety-intel.css';")) {
    const anchor = "    import '@/styles/uwx-premium.css';";
    if (!app.includes(anchor)) throw new Error('RC8 Safety Intel: RC7 premium stylesheet import missing.');
    app = app.replace(anchor, `${anchor}\n    import '@/styles/uwx-safety-intel.css';`);
    write('src/App.vue', app);
}

const viewRel = 'src/views/UnderWeb/UnderWeb.vue';
let view = read(viewRel);

const storesImport = "    import { useFriendStore, useLocationStore, useOscLabStore, useUnderWebNetworkStore, useUnderWebStore } from '../../stores';";
if (!view.includes("useSafetyIntelStore")) {
    if (!view.includes(storesImport)) throw new Error('RC8 Safety Intel: store import anchor missing.');
    view = view.replace(
        storesImport,
        `${storesImport}\n    import { useSafetyIntelStore } from '../../stores/safetyIntel';`
    );
}

const oscInit = "    const oscLabStore = useOscLabStore();";
if (!view.includes("const safetyIntelStore = useSafetyIntelStore();")) {
    if (!view.includes(oscInit)) throw new Error('RC8 Safety Intel: OSC store init anchor missing.');
    view = view.replace(oscInit, `${oscInit}\n    const safetyIntelStore = useSafetyIntelStore();`);
}

const systemTab = "        { id: 'system', label: 'System', short: 'Safety + updates', icon: 'ri-settings-3-line' }";
if (!view.includes("{ id: 'safety', label: 'Safety Intel'")) {
    if (!view.includes(systemTab)) throw new Error('RC8 Safety Intel: panel tab anchor missing.');
    view = view.replace(
        systemTab,
        "        { id: 'safety', label: 'Safety Intel', short: 'Shared warnings', icon: 'ri-shield-check-line' },\n" + systemTab
    );
}

const systemMeta = "        system: { eyebrow: 'LOCAL CONTROL', title: 'System & Safety', description: 'Notifications, releases, local data boundaries, and the global disarm control.' }";
if (!view.includes("safety: { eyebrow: 'COMMUNITY AWARENESS'")) {
    if (!view.includes(systemMeta)) throw new Error('RC8 Safety Intel: panel meta anchor missing.');
    view = view.replace(
        systemMeta,
        "        safety: { eyebrow: 'COMMUNITY AWARENESS', title: 'Safety Intel', description: 'Reviewed shared warnings for crashing, doxxing threats, harassment, malicious behavior, and other community risks.' },\n" + systemMeta
    );
}

const profileRef = "    const profileUserId = ref('');";
if (!view.includes("const safetySearch = ref('');")) {
    if (!view.includes(profileRef)) throw new Error('RC8 Safety Intel: profile ref anchor missing.');
    view = view.replace(
        profileRef,
        `${profileRef}
    const safetySearch = ref('');
    const safetyLookupUserId = ref('');
    const safetyLookupComplete = ref(false);`
    );
}

const selectedRoles = `    const selectedProfileRoles = computed(() =>
        selectedProfileFriend.value ? rolesForUser(selectedProfileFriend.value.id).slice(0, 10) : []
    );`;
if (!view.includes("const selectedSafetyIntel = computed")) {
    if (!view.includes(selectedRoles)) throw new Error('RC8 Safety Intel: selected profile computed anchor missing.');
    const safetyLogic = `${selectedRoles}

    const currentInstancePlayers = computed(() =>
        Array.from(locationStore.lastLocation.playerList?.values?.() || [])
            .filter((player) => player?.userId && String(player.userId).startsWith('usr_'))
            .map((player) => ({
                userId: player.userId,
                displayName: player.displayName || player.userId
            }))
    );

    const flaggedCurrentPlayers = computed(() =>
        currentInstancePlayers.value
            .map((player) => ({
                ...player,
                intel: safetyIntelStore.getIntel(player.userId)
            }))
            .filter((player) => player.intel)
            .sort((a, b) => {
                const rank = { high: 3, caution: 2, info: 1 };
                return (rank[b.intel?.risk_level] || 0) - (rank[a.intel?.risk_level] || 0);
            })
    );

    const selectedSafetyIntel = computed(() =>
        selectedProfileFriend.value ? safetyIntelStore.getIntel(selectedProfileFriend.value.id) : null
    );

    const safetyLookupIntel = computed(() =>
        safetyLookupUserId.value ? safetyIntelStore.getIntel(safetyLookupUserId.value) : null
    );

    function safetyRiskLabel(level) {
        if (level === 'high') return 'High Risk';
        if (level === 'caution') return 'Caution';
        return 'Info';
    }

    function safetyCategoryLabel(category) {
        const labels = {
            crashing: 'Crasher',
            doxxing_privacy_threat: 'Doxxing / Privacy Threat',
            harassment: 'Harassment',
            scam_impersonation: 'Scam / Impersonation',
            malicious_client_behavior: 'Malicious Client Behavior',
            ban_evasion: 'Ban Evasion',
            other: 'Other'
        };
        return labels[category] || String(category || '').replaceAll('_', ' ');
    }

    function formatSafetyDate(value) {
        if (!value) return 'Unknown';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
    }

    async function scanSafetyCurrentInstance({ quiet = false } = {}) {
        try {
            await safetyIntelStore.batchLookup(currentInstancePlayers.value.map((player) => player.userId), { force: true });
            if (!quiet) {
                if (flaggedCurrentPlayers.value.length) {
                    toast.warning('Safety Intel found ' + flaggedCurrentPlayers.value.length + ' reviewed flag' + (flaggedCurrentPlayers.value.length === 1 ? '' : 's') + ' in this instance.');
                } else {
                    toast.success('No reviewed Safety Intel records found for the visible instance list.');
                }
            }
        } catch (error) {
            if (!quiet) toast.error(error?.message || 'Safety Intel scan failed.');
        }
    }

    async function runSafetyLookup() {
        const id = String(safetySearch.value || '').trim();
        safetyLookupComplete.value = false;
        safetyLookupUserId.value = '';
        try {
            await safetyIntelStore.lookupUser(id, { force: true });
            safetyLookupUserId.value = id;
            safetyLookupComplete.value = true;
        } catch (error) {
            toast.error(error?.message || 'Safety Intel lookup failed.');
        }
    }

    function selectFriendProfile(friend) {
        profileUserId.value = friend.id;
        void safetyIntelStore.lookupUser(friend.id).catch(() => {});
    }`;
    view = view.replace(selectedRoles, safetyLogic);
}

const profileClick = '@click="profileUserId = friend.id"';
if (view.includes(profileClick)) {
    view = view.replace(profileClick, '@click="selectFriendProfile(friend)"');
}

const friendRoles = `                                        <div class="flex flex-wrap gap-1 mt-1">
                                            <span v-for="role in rolesForUser(friend.id).slice(0, 3)" :key="role" class="uwx-mini-role">{{ role }}</span>
                                        </div>`;
if (!view.includes('uwx-friend-safety') && view.includes(friendRoles)) {
    view = view.replace(
        friendRoles,
        `${friendRoles}
                                        <div
                                            v-if="safetyIntelStore.getIntel(friend.id)"
                                            class="uwx-friend-safety"
                                            :class="safetyIntelStore.getIntel(friend.id).risk_level">
                                            <i class="ri-shield-flash-line" />
                                            {{ safetyRiskLabel(safetyIntelStore.getIntel(friend.id).risk_level) }}
                                            · {{ safetyIntelStore.getIntel(friend.id).verified_report_count }} verified
                                        </div>`
    );
}

const profileStatus = `                            <div class="uwx-profile-status mt-5">
                                <div><span>VRChat</span><strong>{{ selectedProfileFriend.state }}</strong></div>
                                <div><span>UnderWeb</span><strong>{{ selectedNetworkMember ? 'linked' : 'not linked' }}</strong></div>
                            </div>`;
if (!view.includes('SELECTED SAFETY INTEL') && view.includes(profileStatus)) {
    view = view.replace(
        profileStatus,
        `${profileStatus}
                            <div v-if="selectedSafetyIntel" class="uwx-safety-result mt-4" :class="'risk-' + selectedSafetyIntel.risk_level">
                                <div class="uwx-section-label">SELECTED SAFETY INTEL</div>
                                <div class="flex items-center justify-between gap-3 mt-2">
                                    <strong>{{ selectedSafetyIntel.last_known_display_name || selectedProfileFriend.displayName }}</strong>
                                    <span class="uwx-risk-badge" :class="selectedSafetyIntel.risk_level">
                                        <i class="ri-shield-flash-line" />
                                        {{ safetyRiskLabel(selectedSafetyIntel.risk_level) }}
                                    </span>
                                </div>
                                <div class="uwx-safety-flags">
                                    <span v-for="flag in selectedSafetyIntel.verified_flags" :key="flag" class="uwx-safety-flag">{{ safetyCategoryLabel(flag) }}</span>
                                </div>
                                <p class="uwx-safety-summary">{{ selectedSafetyIntel.public_summary || 'Reviewed community safety record.' }}</p>
                            </div>`
    );
}

const firstSystemCard = `            <Card v-show="activePanel === 'system'" class="uwx-card">`;
if (!view.includes('UWX SAFETY INTEL') && view.includes(firstSystemCard)) {
    const safetyCard = `            <Card v-show="activePanel === 'safety'" class="uwx-card uwx-card-wide">
                <CardHeader>
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <div class="uwx-section-label">UWX SAFETY INTEL</div>
                            <CardTitle>Community Safety Network</CardTitle>
                            <CardDescription>
                                Shared, staff-reviewed awareness signals for observable harmful behavior. UWX informs you; it does not punish people for you.
                            </CardDescription>
                        </div>
                        <Badge variant="outline">REVIEWED FLAGS ONLY</Badge>
                    </div>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="uwx-safety-hero">
                        <div>
                            <h3>Awareness, not enforcement.</h3>
                            <p>
                                UWX never automatically bans, blocks, kicks, reports, or removes anyone. Safety Intel only surfaces reviewed information so you can make your own call.
                            </p>
                        </div>
                        <div class="uwx-safety-no-enforce"><i class="ri-shield-check-line" />NO AUTO-ENFORCEMENT</div>
                    </div>

                    <div class="uwx-safety-layout">
                        <section class="uwx-safety-panel">
                            <div class="uwx-safety-panel-head">
                                <div>
                                    <strong>Current Instance</strong>
                                    <span>Check visible player IDs against reviewed Safety Intel.</span>
                                </div>
                                <Button size="sm" variant="outline" :disabled="safetyIntelStore.isLoading" @click="scanSafetyCurrentInstance()">
                                    <i :class="safetyIntelStore.isLoading ? 'ri-loader-4-line animate-spin' : 'ri-radar-line'" />
                                    Scan instance
                                </Button>
                            </div>

                            <div v-if="flaggedCurrentPlayers.length" class="uwx-safety-list">
                                <div
                                    v-for="player in flaggedCurrentPlayers"
                                    :key="player.userId"
                                    class="uwx-safety-row"
                                    :class="'risk-' + player.intel.risk_level">
                                    <div class="uwx-safety-row-name">
                                        <strong>{{ player.displayName }}</strong>
                                        <span>{{ player.userId }}</span>
                                        <div class="uwx-safety-flags">
                                            <span v-for="flag in player.intel.verified_flags" :key="flag" class="uwx-safety-flag">{{ safetyCategoryLabel(flag) }}</span>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <span class="uwx-risk-badge" :class="player.intel.risk_level">
                                            <i class="ri-shield-flash-line" />
                                            {{ safetyRiskLabel(player.intel.risk_level) }}
                                        </span>
                                        <div class="uwx-help mt-2">{{ player.intel.verified_report_count }} verified report{{ player.intel.verified_report_count === 1 ? '' : 's' }}</div>
                                    </div>
                                </div>
                            </div>

                            <div v-else class="uwx-safety-result empty">
                                <div>
                                    <i class="ri-shield-user-line" />
                                    <strong>No reviewed flags loaded for this instance.</strong>
                                    <p class="uwx-help mt-2">Run a scan to check the visible player list. No record is not a guarantee that someone is safe.</p>
                                </div>
                            </div>
                        </section>

                        <section class="uwx-safety-panel">
                            <div class="uwx-safety-panel-head">
                                <div>
                                    <strong>VRChat User Lookup</strong>
                                    <span>Paste a VRChat user ID beginning with usr_.</span>
                                </div>
                            </div>
                            <div class="uwx-safety-search">
                                <Input v-model="safetySearch" placeholder="usr_..." @keyup.enter="runSafetyLookup" />
                                <Button :disabled="safetyIntelStore.isLoading || !safetySearch.trim()" @click="runSafetyLookup">
                                    <i :class="safetyIntelStore.isLoading ? 'ri-loader-4-line animate-spin' : 'ri-search-line'" />
                                    Check
                                </Button>
                            </div>

                            <div v-if="safetyLookupComplete && safetyLookupIntel" class="uwx-safety-result mt-3" :class="'risk-' + safetyLookupIntel.risk_level">
                                <div class="flex items-start justify-between gap-3">
                                    <div class="uwx-safety-row-name">
                                        <strong>{{ safetyLookupIntel.last_known_display_name || safetyLookupUserId }}</strong>
                                        <span>{{ safetyLookupIntel.vrchat_user_id }}</span>
                                    </div>
                                    <span class="uwx-risk-badge" :class="safetyLookupIntel.risk_level">
                                        <i class="ri-shield-flash-line" />
                                        {{ safetyRiskLabel(safetyLookupIntel.risk_level) }}
                                    </span>
                                </div>
                                <div class="uwx-safety-flags">
                                    <span v-for="flag in safetyLookupIntel.verified_flags" :key="flag" class="uwx-safety-flag">{{ safetyCategoryLabel(flag) }}</span>
                                </div>
                                <p class="uwx-safety-summary">{{ safetyLookupIntel.public_summary || 'Reviewed community safety record.' }}</p>
                                <div class="uwx-safety-meta">
                                    <div><span>Verified reports</span><strong>{{ safetyLookupIntel.verified_report_count }}</strong></div>
                                    <div><span>Last reviewed</span><strong>{{ formatSafetyDate(safetyLookupIntel.last_reviewed_at) }}</strong></div>
                                    <div><span>Latest verified</span><strong>{{ formatSafetyDate(safetyLookupIntel.latest_verified_at) }}</strong></div>
                                </div>
                            </div>

                            <div v-else-if="safetyLookupComplete" class="uwx-safety-result empty mt-3">
                                <div>
                                    <i class="ri-shield-check-line" />
                                    <strong>No reviewed Safety Intel record found.</strong>
                                    <p class="uwx-help mt-2">This only means UWX has no active reviewed record for that user ID. It is not a guarantee of safety.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div class="uwx-help">
                        Safety Intel shows standardized reviewed categories only. Private evidence and reporter details are not exposed in normal UWX results.
                    </div>
                </CardContent>
            </Card>

`;
    view = view.replace(firstSystemCard, safetyCard + firstSystemCard);
}

write(viewRel, view);

console.log('Applied UWX 0.4.8-rc8 Safety Intel.');
