// UWX RC35 — enhance the existing People & Activity profile with Social Passport.
// Must run after RC34, reuse original friend/user/store bindings and VRCX's SQLite memo logic.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const source = path.resolve(process.argv[3] || 'features/passport');
const dest = (name) => path.join(root, name);
const from = (name) => path.join(source, name);
const read = (name) => fs.readFileSync(dest(name), 'utf8').replace(/\r\n/g, '\n');
const write = (name, data) => fs.writeFileSync(dest(name), data.replace(/\r\n/g, '\n'), 'utf8');
function replaceOnce(text, needle, replacement, description) {
    const count = text.split(needle).length - 1;
    if (count !== 1) throw new Error(`RC35: ${description}: expected 1 anchor, got ${count}`);
    return text.replace(needle, replacement);
}

if (read('UWX_VERSION').trim() !== '0.6.15-rc34') {
    throw new Error('RC35 requires the existing UWX app patched through 0.6.15-rc34.');
}
const appName = 'src/App.vue';
const viewName = 'src/views/UnderWeb/UnderWeb.vue';
const app = read(appName);
const view = read(viewName);
const vers = read('src/shared/constants/uwx.js');
const changelog = read('CHANGELOG_UWX.md');

const assets = [
    ['uwxPassport.js', 'src/shared/utils/uwxPassport.js'],
    ['uwxPassportTags.js', 'src/stores/uwxPassportTags.js'],
    ['UwxSocialPassport.vue', 'src/views/UnderWeb/UwxSocialPassport.vue'],
    ['uwx-passport.css', 'src/styles/uwx-passport.css'],
    ['uwxPassport.test.js', 'src/shared/utils/__tests__/uwxPassport.test.js']
];
for (const [name, target] of assets) {
    if (!fs.existsSync(from(name))) throw new Error('RC35: missing asset ' + name);
    if (fs.existsSync(dest(target))) throw new Error('RC35: already exists ' + target);
}

const cssAnchor = "    import '@/styles/uwx-home.css';";
const importAnchor = "    import UwxHomeEditor from './UwxHomeEditor.vue';";
const profileAnchor = '    const selectedProfileFriend = computed(() => allFriends.value.find((friend) => friend.id === profileUserId.value) || null);';
const peopleAnchor = '        <div class="uwx-grid">';
const profileComponent = `        <!-- Extends the EXISTING People/Activity friend preview, without replacing VRCX's profile dialog. -->
        <UwxSocialPassport
            v-if="activePanel === 'people' && selectedProfileFriend"
            :user-id="selectedProfileFriend.id"
            :display-name="selectedProfileFriend.displayName"
            :state="selectedProfileFriend.state"
            :roles="selectedProfileRoles"
            :linked="Boolean(selectedNetworkMember)"
        />

`;
const nextApp = replaceOnce(app, cssAnchor, cssAnchor + "\n    import '@/styles/uwx-passport.css';", 'CSS import');
let nextView = replaceOnce(view, importAnchor, importAnchor + "\n    import UwxSocialPassport from './UwxSocialPassport.vue';", 'component import');
nextView = replaceOnce(nextView, peopleAnchor, profileComponent + peopleAnchor, 'People view grid');
if (!nextView.includes(profileAnchor)) throw new Error('RC35: original People friend selection missing');
for (const needle of ['    const selectedNetworkMember = computed(', '    const selectedProfileRoles = computed(', 'profileUserId = friend.id']) {
    if (!nextView.includes(needle)) throw new Error('RC35: missing friend or UnderWeb mapping: ' + needle);
}
const nextVersion = replaceOnce(vers, "export const UWX_VERSION = '0.6.15-rc34';", "export const UWX_VERSION = '0.6.16-rc35';", 'version');
const notes = `# UnderWeb X changelog

## 0.6.16-rc35 — Social Passport (first slice)

- The existing People & Activity friend preview now opens an enriched Social Passport after choosing a friend.
- Reuses the existing VRCX user memo/SQLite data, the local 30-day Crew encounter calculation, existing friend status and verified UnderWeb role lookup.
- Adds optional local-only personal tags (8 per person, up to 24 characters), without creating a second notes database.
- Uses VRCX's existing user dialog and Crew pin/unpin action. No new VRChat API polling, location scraping, remote uploads or backend changes.
- Carefully labels observed PC history and unknown or unrecorded history; no claim of all-time encounters.
- Responsive controls, tag validation tests and a safe RC35 applicator. Real Windows QA required before distribution.

`;
const nextChangelog = replaceOnce(changelog, '# UnderWeb X changelog\n\n', notes, 'changelog');

// Validate all anchors before modifying or copying any files.
for (const [name, target] of assets) {
    fs.mkdirSync(path.dirname(dest(target)), { recursive: true });
    fs.copyFileSync(from(name), dest(target));
}
write(appName, nextApp);
write(viewName, nextView);
write('src/shared/constants/uwx.js', nextVersion);
write('UWX_VERSION', '0.6.16-rc35\n');
write('CHANGELOG_UWX.md', nextChangelog);
console.log('UWX RC35: Social Passport installed on existing People & Activity view.');
