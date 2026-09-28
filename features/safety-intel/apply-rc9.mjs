import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const storeSource = path.resolve(process.argv[3] || 'features/safety-intel/safetyReporting.js');
const cardSource = path.resolve(process.argv[4] || 'features/safety-intel/reporting-card.vuefrag');
const cssSource = path.resolve(process.argv[5] || 'features/safety-intel/safety-intel.css');
const file = rel => path.join(root, rel);
const read = rel => fs.readFileSync(file(rel), 'utf8').replace(/\r\n/g, '\n');
const write = (rel, contents) => fs.writeFileSync(file(rel), contents.replace(/\r\n/g, '\n'), 'utf8');
function replaceOnce(rel, from, to) {
    const source = read(rel);
    if (!source.includes(from)) throw new Error(`RC9: missing anchor in ${rel}: ${from.slice(0, 80)}`);
    write(rel, source.replace(from, to));
}

replaceOnce('UWX_VERSION', '0.4.8-rc8', '0.4.9-rc9');
replaceOnce('src/shared/constants/uwx.js',
    "export const UWX_VERSION = '0.4.8-rc8';",
    "export const UWX_VERSION = '0.4.9-rc9';");
replaceOnce('CHANGELOG_UWX.md', '# UnderWeb X changelog\n\n',
    `# UnderWeb X changelog

## 0.4.9-rc9 — private Safety Intel reports

- Submit private reports in UWX to the same UnderWeb staff queue as the website.
- Report anonymously without another login or storing reporter account details.
- Prefill a visible player or selected friend; private evidence stays out of public summaries.

`);

fs.copyFileSync(storeSource, file('src/stores/safetyReporting.js'));
fs.copyFileSync(cssSource, file('src/styles/uwx-safety-intel.css'));

const rel = 'src/views/UnderWeb/UnderWeb.vue';
let view = read(rel);
const card = fs.readFileSync(cardSource, 'utf8').replace(/\r\n/g, '\n');
const systemAnchor = '            <Card v-show="activePanel === \'system\'" class="uwx-card">';
if (!view.includes(systemAnchor)) throw new Error('RC9: system panel anchor missing.');
view = view.replace(systemAnchor, card + '\n' + systemAnchor);

const storeImport = "    import { useSafetyIntelStore } from '../../stores/safetyIntel';";
if (!view.includes(storeImport)) throw new Error('RC9: Safety Intel store import missing.');
view = view.replace(storeImport, storeImport + "\n    import { useSafetyReportingStore } from '../../stores/safetyReporting';");
const storeInit = '    const safetyIntelStore = useSafetyIntelStore();';
view = view.replace(storeInit, storeInit + '\n    const reportingStore = useSafetyReportingStore();');

const stateAnchor = "    const safetyLookupComplete = ref(false);";
const state = `${stateAnchor}
    const reportTarget = ref('');
    const reportDisplayName = ref('');
    const reportCategory = ref('');
    const reportSeverity = ref('caution');
    const reportIncidentAt = ref('');
    const reportWorld = ref('');
    const reportEvidence = ref('');
    const reportSummary = ref('');`;
if (!view.includes(stateAnchor)) throw new Error('RC9: state anchor missing.');
view = view.replace(stateAnchor, state);

const logicAnchor = '    const statusText = computed(() => {';
const logic = `    function prefillSafetyReport(userId, displayName = '') {
        reportTarget.value = userId;
        reportDisplayName.value = displayName;
        activePanel.value = 'safety';
    }

    function pickReportPlayer(id) {
        const player = currentInstancePlayers.value.find(item => item.userId === id);
        if (player) prefillSafetyReport(player.userId, player.displayName);
    }

    async function submitSafetyReport() {
        try {
            await reportingStore.submitReport({
                vrchatUserId: reportTarget.value,
                displayName: reportDisplayName.value,
                category: reportCategory.value,
                severity: reportSeverity.value,
                incidentAt: reportIncidentAt.value,
                incidentWorld: reportWorld.value,
                evidenceUrl: reportEvidence.value,
                summary: reportSummary.value
            });
            toast.success('Private report submitted for staff review.');
            reportSummary.value = '';
            reportEvidence.value = '';
            reportCategory.value = '';
        } catch (error) { toast.error(error?.message || 'Could not submit the report.'); }
    }

${logicAnchor}`;
if (!view.includes(logicAnchor)) throw new Error('RC9: logic anchor missing.');
view = view.replace(logicAnchor, logic);

const lookupAnchor = `                            <div v-else-if="safetyLookupComplete" class="uwx-safety-result empty mt-3">
                                <div>
                                    <i class="ri-shield-check-line" />
                                    <strong>No reviewed Safety Intel record found.</strong>
                                    <p class="uwx-help mt-2">This only means UWX has no active reviewed record for that user ID. It is not a guarantee of safety.</p>
                                </div>
                            </div>`;
if (!view.includes(lookupAnchor)) throw new Error('RC9: lookup anchor missing.');
view = view.replace(lookupAnchor, `${lookupAnchor}
                            <Button v-if="safetyLookupComplete" class="mt-3" variant="outline"
                                @click="prefillSafetyReport(safetyLookupUserId, safetyLookupIntel?.last_known_display_name || '')">
                                Report this user privately
                            </Button>`);

const friendAnchor = '                            <Button\n                                v-if="selectedNetworkMember?.underwebUserId"';
if (!view.includes(friendAnchor)) throw new Error('RC9: friend profile anchor missing.');
view = view.replace(friendAnchor, `                            <Button class="mt-3 w-full" variant="outline"
                                @click="prefillSafetyReport(selectedProfileFriend.id, selectedProfileFriend.displayName)">
                                Report this user privately
                            </Button>
${friendAnchor}`);

write(rel, view);
console.log('Applied UWX 0.4.9-rc9 private Safety Intel reporting.');
