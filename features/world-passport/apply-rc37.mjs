// RC37: install World Passport into existing VRCX-derived UWX after RC36.
// Validate all anchors before modifying any extracted source.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(process.argv[2] || '.');
const source = path.resolve(process.argv[3] || 'features/world-passport');
const src = n => path.join(source,n);
const dest = n => path.join(root,n);
const read = n => fs.readFileSync(dest(n),'utf8').replace(/\r\n/g,'\n');
const write = (n,s) => fs.writeFileSync(dest(n),s.replace(/\r\n/g,'\n'),'utf8');
function replaceOnce(s,a,b,label) {
    const count=s.split(a).length-1;
    if(count!==1) throw new Error('RC37: '+label+' anchor mismatch: '+count);
    return s.replace(a,b);
}
if(read('UWX_VERSION').trim()!=='0.6.17-rc36') throw new Error('RC37 requires UWX through RC36');
const files=[
    ['uwxWorldPassport.js','src/shared/utils/uwxWorldPassport.js'],
    ['uwxWorldPassportService.js','src/services/uwxWorldPassport.js'],
    ['UwxWorldPassport.vue','src/views/UnderWeb/UwxWorldPassport.vue'],
    ['uwx-world-passport.css','src/styles/uwx-world-passport.css'],
    ['uwxWorldPassport.test.js','src/shared/utils/__tests__/uwxWorldPassport.test.js']
];
for(const [name,target] of files) {
    if(!fs.existsSync(src(name))) throw new Error('RC37 missing asset: '+name);
    if(fs.existsSync(dest(target))) throw new Error('RC37 refuses overwrite: '+target);
}
const appPath='src/App.vue';
const viewPath='src/views/UnderWeb/UnderWeb.vue';
const navPath='src/shared/constants/uwxNav.js';
const defaultsPath='src/components/nav-menu/navLayoutDefaults.js';
const navStorePath='src/components/nav-menu/composables/useNavLayout.js';
const versionPath='src/shared/constants/uwx.js';
const app=read(appPath),view=read(viewPath),nav=read(navPath),defaults=read(defaultsPath);
const navStore=read(navStorePath),version=read(versionPath),changelog=read('CHANGELOG_UWX.md');

const panelAnchor="    { id: 'groups', key: 'uwx-groups'";
const newPanel="    { id: 'worlds', key: 'uwx-worlds', route: 'uwx-worlds', path: 'uwx/worlds', label: 'World Passport', icon: 'ri-earth-line', access: 'all' },\n";
const nextNav=replaceOnce(nav,panelAnchor,newPanel+panelAnchor,'new route');
const favoriteAnchor="items: ['favorite-friends', 'favorite-worlds', 'favorite-avatars']";
const nextDefaults=replaceOnce(defaults,favoriteAnchor,
    "items: ['favorite-friends', 'favorite-worlds', 'uwx-worlds', 'favorite-avatars']",'default Favorites folder');

const migratedAnchor="                await configRepository.setString(NAV_CONFIG_KEY, JSON.stringify({ layout: layoutData, hiddenKeys: [] }));\n            }";
const navMigration=[
    "            // One-time insertion preserves custom sidebar order, folders and hidden keys.",
    "            // Subsequent user rearrangements/removal are respected: never force it again.",
    "            const passportNavKey = 'UWX_worldPassportNavIntroduced_v1';",
    "            if ((await configRepository.getString(passportNavKey, '0')) !== '1') {",
    "                const exists = Array.isArray(layoutData) && layoutData.some((entry) =>",
    "                    (entry.type === 'item' && entry.key === 'uwx-worlds') ||",
    "                    (entry.type === 'folder' && Array.isArray(entry.items) && entry.items.includes('uwx-worlds'))",
    "                );",
    "                if (Array.isArray(layoutData) && !exists) {",
    "                    layoutData = layoutData.map((entry) => ({ ...entry,",
    "                        ...(Array.isArray(entry.items) ? { items: [...entry.items] } : {}) }));",
    "                    const favorites = layoutData.find((entry) => entry.type === 'folder'",
    "                        && Array.isArray(entry.items) && entry.items.includes('favorite-worlds'));",
    "                    if (favorites) favorites.items.splice(favorites.items.indexOf('favorite-worlds') + 1, 0, 'uwx-worlds');",
    "                    else layoutData.push({ type: 'item', key: 'uwx-worlds' });",
    "                    await configRepository.setString(NAV_CONFIG_KEY, JSON.stringify({ layout: layoutData, hiddenKeys: hiddenKeysData }));",
    "                }",
    "                await configRepository.setString(passportNavKey, '1');",
    "            }"
].join('\n');
const nextNavStore=replaceOnce(navStore,migratedAnchor,migratedAnchor+'\n'+navMigration,'custom sidebar preserving insertion');
const nextApp=replaceOnce(app,"    import '@/styles/uwx-encounters.css';",
    "    import '@/styles/uwx-encounters.css';\n    import '@/styles/uwx-world-passport.css';",'stylesheet');
let nextView=replaceOnce(view,
    "    import UwxEncounterBrowser from './UwxEncounterBrowser.vue';",
    "    import UwxEncounterBrowser from './UwxEncounterBrowser.vue';\n    import UwxWorldPassport from './UwxWorldPassport.vue';",'Vue component import');
nextView=replaceOnce(nextView,"        <UwxEncounterBrowser",
    '        <UwxWorldPassport v-if="activePanel === \'worlds\'" />\n\n        <UwxEncounterBrowser','new World Passport panel');
const nextVersion=replaceOnce(version,"export const UWX_VERSION = '0.6.17-rc36';",
    "export const UWX_VERSION = '0.6.18-rc37';",'version constant');
const notes=[
    '# UnderWeb X changelog','','## 0.6.18-rc37 — World Passport','',
    '- Add a World Passport sidebar entry beside existing VRCX Favorites without resetting users custom sidebar layouts.',
    '- Browse PC-local VRCX world visits from the last 180 days and saved VRCX favorites (even those never visited on this PC).',
    '- Personal 0–5 star ratings, searchable private collections and existing VRCX world memos.',
    '- Open the original VRCX world details dialog; no duplicate VRChat favorites table.',
    '- No VRChat API polling, uploads, new backend services or schema migrations.',
    '- Avatar Locker excluded from roadmap by user request.',
    '- This is a development candidate, requiring Windows visual and persistence QA before release.','',''
].join('\n');
const nextChangelog=replaceOnce(changelog,'# UnderWeb X changelog\n\n',notes,'changelog');

// No modifications before every anchor was verified.
for(const [name,target] of files) {
    fs.mkdirSync(path.dirname(dest(target)),{recursive:true});
    fs.copyFileSync(src(name),dest(target));
}
write(appPath,nextApp);
write(viewPath,nextView);
write(navPath,nextNav);
write(defaultsPath,nextDefaults);
write(navStorePath,nextNavStore);
write(versionPath,nextVersion);
write('UWX_VERSION','0.6.18-rc37\n');
write('CHANGELOG_UWX.md',nextChangelog);
console.log('RC37 World Passport integrated with existing VRCX world favorites and memos.');
