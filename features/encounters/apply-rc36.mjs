// UWX RC36: add on-demand recent encounters to the existing People + Social Passport views.
// Fail closed if previous source anchors change; never modify source on a validation error.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const source = path.resolve(process.argv[3] || 'features/encounters');
const dest = (name) => path.join(root, name);
const src = (name) => path.join(source, name);
const read = (name) => fs.readFileSync(dest(name), 'utf8').replace(/\r\n/g, '\n');
const write = (name, data) => fs.writeFileSync(dest(name), data.replace(/\r\n/g, '\n'), 'utf8');
function replaceOnce(text, needle, replacement, why) {
    const count = text.split(needle).length - 1;
    if (count !== 1) throw new Error('RC36: invalid ' + why + ' anchor (found ' + count + ')');
    return text.replace(needle, replacement);
}

if (read('UWX_VERSION').trim() !== '0.6.16-rc35') throw new Error('RC36 requires original UWX patched through RC35.');
const appPath = 'src/App.vue';
const viewPath = 'src/views/UnderWeb/UnderWeb.vue';
const app = read(appPath);
const view = read(viewPath);
const version = read('src/shared/constants/uwx.js');
const changelog = read('CHANGELOG_UWX.md');
const assets = [
    ['uwxEncounters.js', 'src/shared/utils/uwxEncounters.js'],
    ['uwxEncountersService.js', 'src/services/uwxEncounters.js'],
    ['uwxEncounters.test.js', 'src/shared/utils/__tests__/uwxEncounters.test.js'],
    ['UwxEncounterBrowser.vue', 'src/views/UnderWeb/UwxEncounterBrowser.vue'],
    ['uwx-encounters.css', 'src/styles/uwx-encounters.css']
];
for (const [name, target] of assets) {
    if (!fs.existsSync(src(name))) throw new Error('RC36 missing asset: ' + name);
    if (fs.existsSync(dest(target))) throw new Error('RC36 would overwrite existing file: ' + target);
}

const oldPassport = [
    '        <UwxSocialPassport',
    '            v-if="activePanel === \'people\' && selectedProfileFriend"',
    '            :user-id="selectedProfileFriend.id"',
    '            :display-name="selectedProfileFriend.displayName"',
    '            :state="selectedProfileFriend.state"',
    '            :roles="selectedProfileRoles"',
    '            :linked="Boolean(selectedNetworkMember)"',
    '        />'
].join('\n');
const newPassport = [
    '        <UwxEncounterBrowser',
    '            v-if="activePanel === \'people\'"',
    '            :selected-id="encounteredUser?.userId || \'\'"',
    '            @select="openEncounterPassport"',
    '        />',
    '        <UwxSocialPassport',
    '            v-if="activePanel === \'people\' && passportPerson"',
    '            :user-id="passportPerson.id"',
    '            :display-name="passportPerson.displayName"',
    '            :state="passportPerson.state"',
    '            :roles="passportPerson.roles"',
    '            :linked="passportPerson.linked"',
    '            :encounter="passportPerson.encounter"',
    '        />'
].join('\n');

const passportState = [
    '    // Passport selection reuses UWX friend selection and local game-log encounters.',
    '    // The user ID is the only join key; unknown display names never become identity matches.',
    '    const encounteredUser = ref(null);',
    '    const passportPerson = computed(() => {',
    '        const row = encounteredUser.value;',
    '        const friend = row ? allFriends.value.find(f => f.id === row.userId) : selectedProfileFriend.value;',
    '        const id = row?.userId || friend?.id;',
    '        if (!id) return null;',
    '        return {',
    '            id,',
    '            displayName: friend?.displayName || row?.displayName || id,',
    '            state: friend?.state || (row ? \'Not friends\' : \'Status unavailable\'),',
    '            roles: rolesForUser(id).slice(0, 6),',
    '            linked: Boolean(networkStore.memberByVrchatId.get(id)),',
    '            encounter: row',
    '        };',
    '    });',
    '    watch(profileUserId, id => { if (id) encounteredUser.value = null; });',
    '    function openEncounterPassport(row) {',
    '        if (!validPassportUserId(row?.userId)) return;',
    '        profileUserId.value = \'\';',
    '        encounteredUser.value = row;',
    '    }',
    ''
].join('\n');

let nextView = replaceOnce(
    view,
    oldPassport,
    newPassport,
    'existing Social Passport'
);
nextView = replaceOnce(
    nextView,
    "    import UwxSocialPassport from './UwxSocialPassport.vue';",
    "    import UwxSocialPassport from './UwxSocialPassport.vue';\n    import UwxEncounterBrowser from './UwxEncounterBrowser.vue';\n    import { validPassportUserId } from '../../shared/utils/uwxPassport';",
    'component and user ID validator imports'
);
nextView = replaceOnce(
    nextView,
    '    const selectedProfileFriend = computed(() => allFriends.value.find((friend) => friend.id === profileUserId.value) || null);',
    '    const selectedProfileFriend = computed(() => allFriends.value.find((friend) => friend.id === profileUserId.value) || null);\n' + passportState,
    'friend profile state'
);
const nextApp = replaceOnce(app, "    import '@/styles/uwx-passport.css';", "    import '@/styles/uwx-passport.css';\n    import '@/styles/uwx-encounters.css';", 'CSS');
const nextVersion = replaceOnce(version, "export const UWX_VERSION = '0.6.16-rc35';", "export const UWX_VERSION = '0.6.17-rc36';", 'version');
const notes = [
    '# UnderWeb X changelog',
    '',
    '## 0.6.17-rc36 — Social Passport: Recent Encounters',
    '',
    '- People & Activity can now browse nonfriend VRChat players observed in the PC-local game log over the last 30 days.',
    '- Search by recorded display name or VRChat ID, sort by last seen or distinct observed days, optionally include friends.',
    '- Clicking an encounter opens the EXISTING Social Passport with their recorded identity, local history, private VRCX memo, tags and Crew pin.',
    '- The existing friend selector, role mappings, group permissions, and VRChat user profile dialog remain available.',
    '- All data reads are on-demand local SQLite; no polling, scraping, notifications to encountered players or automatic online status lookup.',
    '- Only user IDs observed in local logs are used; missing history is explicitly labeled and unrecorded users never receive fabricated statistics.',
    '- RC36 is a development build pending Windows GUI checks and regression tests.',
    '',
    ''
].join('\n');
const nextChangelog = replaceOnce(changelog, '# UnderWeb X changelog\n\n', notes, 'changelog');

// No changes or asset writes above: only commit after every anchor is validated.
for (const [name, target] of assets) {
    fs.mkdirSync(path.dirname(dest(target)), { recursive: true });
    fs.copyFileSync(src(name), dest(target));
}
write(appPath, nextApp);
write(viewPath, nextView);
write('src/shared/constants/uwx.js', nextVersion);
write('UWX_VERSION', '0.6.17-rc36\n');
write('CHANGELOG_UWX.md', nextChangelog);
console.log('UWX RC36: Recent Encounters attached to existing Social Passport without extra network calls.');
