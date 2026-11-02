// UWX RC38: native QuickDeck, installed after RC37 in original UWX Windows build.
// Verify every source anchor before copying files. Never launch a second API/login client.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(process.argv[2] || '.');
const source = path.resolve(process.argv[3] || 'features/quickdeck');
const dest = name => path.join(root, name);
const src = name => path.join(source, name);
const read = name => fs.readFileSync(dest(name),'utf8').replace(/\r\n/g,'\n');
const write = (name,s) => fs.writeFileSync(dest(name),s.replace(/\r\n/g,'\n'),'utf8');
function once(s,a,b,where) {
    const count=s.split(a).length-1;
    if(count!==1) throw new Error('RC38: expected one '+where+' anchor; found '+count);
    return s.replace(a,b);
}
if(read('UWX_VERSION').trim()!=='0.6.18-rc37') throw new Error('RC38 requires UWX RC37.');
const paths=[
    ['UwxQuickDeckForm.cs','Dotnet/Cef/UwxQuickDeckForm.cs'],
    ['AppApiCef.UwxQuickDeck.cs','Dotnet/AppApi/Cef/AppApiCef.UwxQuickDeck.cs'],
    ['uwxQuickDeck.js','src/shared/utils/uwxQuickDeck.js'],
    ['uwxQuickDeck.test.js','src/shared/utils/__tests__/uwxQuickDeck.test.js'],
    ['UwxQuickDeckBridge.vue','src/views/UnderWeb/UwxQuickDeckBridge.vue'],
    ['UwxQuickDeckLauncher.vue','src/views/UnderWeb/UwxQuickDeckLauncher.vue'],
    ['uwx-quickdeck.css','src/styles/uwx-quickdeck.css']
];
for(const [sourceName,target] of paths) {
    if(!fs.existsSync(src(sourceName))) throw new Error('RC38 missing '+sourceName);
    if(fs.existsSync(dest(target))) throw new Error('RC38 refuses overwrite of '+target);
}
const appFile='src/App.vue',viewFile='src/views/UnderWeb/UnderWeb.vue';
const versionFile='src/shared/constants/uwx.js';
const app=read(appFile),view=read(viewFile),version=read(versionFile),changelog=read('CHANGELOG_UWX.md');
let nextApp=once(app,
    '            <RouterView></RouterView>',
    '            <RouterView></RouterView>\n            <UwxQuickDeckBridge />',
    'main RouterView');
nextApp=once(nextApp,
    "    import '@/styles/uwx-world-passport.css';",
    "    import '@/styles/uwx-world-passport.css';\n    import '@/styles/uwx-quickdeck.css';",
    'stylesheet');
nextApp=once(nextApp,
    "    import VRCXUpdateDialog from './components/dialogs/VRCXUpdateDialog.vue';",
    "    import VRCXUpdateDialog from './components/dialogs/VRCXUpdateDialog.vue';\n    import UwxQuickDeckBridge from './views/UnderWeb/UwxQuickDeckBridge.vue';",
    'main component import');
let nextView=once(view,
    "    import UwxWorldPassport from './UwxWorldPassport.vue';",
    "    import UwxWorldPassport from './UwxWorldPassport.vue';\n    import UwxQuickDeckLauncher from './UwxQuickDeckLauncher.vue';",
    'UnderWeb launcher import');
nextView=once(nextView,
    '        <UwxHomeEditor v-if="activePanel === \'command\'" />',
    '        <UwxQuickDeckLauncher v-if="activePanel === \'command\'" />\n        <UwxHomeEditor v-if="activePanel === \'command\'" />',
    'Overview insertion');
const nextVersion=once(version,
    "export const UWX_VERSION = '0.6.18-rc37';",
    "export const UWX_VERSION = '0.6.19-rc38';",
    'version');
const notes=[
    '# UnderWeb X changelog',
    '',
    '## 0.6.19-rc38 — QuickDeck (Windows native companion)',
    '',
    '- Open a separate, compact Windows QuickDeck directly from UWX Overview. It stays open when the main window is minimized.',
    '- Optional pinned always-on-top mode, saved window position, native close-to-hide behavior and six real navigation shortcuts.',
    '- Online friend count and local current world summary are pushed from the ALREADY RUNNING UWX stores; no separate browser, login or API polling.',
    '- Buttons open existing UWX/VRCX sections through strict route allowlists in both C# and Vue; staff routes are excluded.',
    '- Windows-only first slice. Linux/Electron displays an unavailable message instead of pretending the native window works.',
    '- No new dependencies, credentials, backend migrations or public releases; real Windows interaction test required.',
    '',
    ''
].join('\n');
const nextChangelog=once(changelog,'# UnderWeb X changelog\n\n',notes,'changelog');

// Commit only after all anchor checks succeeded.
for(const [sourceName,target] of paths) {
    fs.mkdirSync(path.dirname(dest(target)),{recursive:true});
    fs.copyFileSync(src(sourceName),dest(target));
}
write(appFile,nextApp);
write(viewFile,nextView);
write(versionFile,nextVersion);
write('UWX_VERSION','0.6.19-rc38\n');
write('CHANGELOG_UWX.md',nextChangelog);
console.log('UWX RC38: native QuickDeck and one-session Vue bridge installed.');
