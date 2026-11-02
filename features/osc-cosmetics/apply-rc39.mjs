// UWX RC39 — OSC Cosmetic Pack 1, built on the existing OSC Lab 3 sender and RC19 themes.
// No new OSC scheduler, backend, or app shell. Fail before writing if patch anchors change.
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'.');
const source=path.resolve(process.argv[3]||'features/osc-cosmetics');
const dest=name=>path.join(root,name);
const src=name=>path.join(source,name);
const read=name=>fs.readFileSync(dest(name),'utf8').replace(/\r\n/g,'\n');
const write=(name,s)=>fs.writeFileSync(dest(name),s.replace(/\r\n/g,'\n'),'utf8');
function once(s,anchor,replace,where){
    const count=s.split(anchor).length-1;
    if(count!==1)throw new Error('RC39: '+where+' anchor missing/ambiguous (count='+count+')');
    return s.replace(anchor,replace);
}
if(read('UWX_VERSION').trim()!=='0.6.19-rc38') throw new Error('RC39 requires UWX through RC38');
const files=[
    ['uwxOscScenes.js','src/shared/utils/uwxOscScenes.js'],
    ['uwxOscScenes.test.js','src/shared/utils/__tests__/uwxOscScenes.test.js'],
    ['UwxOscSceneSwitcher.vue','src/views/UnderWeb/UwxOscSceneSwitcher.vue'],
    ['uwx-osc-cosmetics.css','src/styles/uwx-osc-cosmetics.css']
];
for(const [name,target] of files){
    if(!fs.existsSync(src(name))) throw new Error('RC39 missing '+name);
    if(fs.existsSync(dest(target))) throw new Error('RC39 refuses overwrite '+target);
}
const oscPath='src/shared/utils/uwxOsc.js';
const storePath='src/stores/oscLab.js';
const viewPath='src/views/UnderWeb/UwxOscLab.vue';
const appPath='src/App.vue';
const versionPath='src/shared/constants/uwx.js';
const osc=read(oscPath),store=read(storePath),view=read(viewPath),app=read(appPath);
const version=read(versionPath),changelog=read('CHANGELOG_UWX.md');

// Cosmetics use EXACTLY the five existing OSC modules and existing 144/9 fitChatbox.
const newPresets=[
    '    {',
    "        id: 'void-os', name: 'VOID.OS',",
    "        frame: { header: '┌ VOID.OS / TERMINAL ┐', footer: '└ SIGNAL READY ┘' },",
    "        templates: { music: '> AUDIO: {title} {bar}', weather: '> WX: {temp} {condition}', status: '> STATUS: {status}', heart: '> PULSE: {bpm} BPM', world: '> WORLD: {world}' }",
    '    },',
    '    {',
    "        id: 'cassette-club', name: 'Cassette Club',",
    "        frame: { header: '╭─ TAPE 07 / SIDE A ─╮', footer: '╰─ NOW PLAYING ─╯' },",
    "        templates: { music: '▶ {title} {bar}', weather: '♪ WEATHER: {temp}', status: '♪ {status}', heart: '♥ {bpm} BPM', world: '⌖ {world}' }",
    '    },',
    '    {',
    "        id: 'midnight-fm', name: 'Midnight FM',",
    "        frame: { header: '◉ MIDNIGHT FM / ON AIR', footer: '── SIGNAL GOOD ──' },",
    "        templates: { music: '♫ {artist} — {title}', weather: 'WX: {temp}', status: 'ON AIR: {status}', heart: 'PULSE: {bpm} BPM', world: 'FROM: {world}' }",
    '    },',
    ''
].join('\n');
const presetAnchor="    {\n        id: 'underweb',";
const nextOsc=once(osc,presetAnchor,newPresets+presetAnchor,'existing UnderWeb preset');

let nextStore=once(store,
    "import configRepository from '../services/config';",
    "import configRepository from '../services/config';\nimport { applyOscSceneToSettings } from '../shared/utils/uwxOscScenes';",
    'OscLab scene model import');
const action=[
    '    /** Scene changes are atomic: never enable broadcasting and never change private statuses. */',
    '    function applyOscScene(scene) {',
    '        const next=applyOscSceneToSettings(settings,scene);',
    '        if(!next)return false;',
    '        const prior={',
    '            music:settings.modules.music.enabled,',
    '            weather:settings.modules.weather.enabled,',
    '            heart:settings.modules.heart.enabled',
    '        };',
    '        Object.assign(settings,next);',
    '        persistSoon();',
    '        if(prior.music!==settings.modules.music.enabled && settings.modules.music.enabled) void refreshMedia();',
    '        if(prior.weather!==settings.modules.weather.enabled && settings.modules.weather.enabled) void refreshWeather();',
    '        if(prior.heart!==settings.modules.heart.enabled) {',
    '            if(settings.modules.heart.enabled && pulsoidToken.value) connectPulsoid();',
    '            else disconnectPulsoid();',
    '        }',
    '        return true;',
    '    }',
    ''
].join('\n');
nextStore=once(nextStore,
    '    function moveModule(key, direction) {',
    action+'    function moveModule(key, direction) {',
    'scene action method');
nextStore=once(nextStore,
    '        applyChatboxTheme,\n        saveChatboxTheme,',
    '        applyChatboxTheme,\n        applyOscScene,\n        saveChatboxTheme,',
    'scene method exported by Pinia');

let nextView=once(view,
    "    import { fitChatbox, renderModuleLines } from '../../shared/utils/uwxOsc';",
    "    import { fitChatbox, renderModuleLines } from '../../shared/utils/uwxOsc';\n    import UwxOscSceneSwitcher from './UwxOscSceneSwitcher.vue';",
    'scene component import');
nextView=once(nextView,
    '        <Card class="uwx-card uwx-card-wide">\n            <CardHeader>\n                <CardTitle>Modules</CardTitle>',
    '        <UwxOscSceneSwitcher />\n\n        <Card class="uwx-card uwx-card-wide">\n            <CardHeader>\n                <CardTitle>Modules</CardTitle>',
    'scene component before module controls');
const nextApp=once(app,
    "    import '@/styles/uwx-quickdeck.css';",
    "    import '@/styles/uwx-quickdeck.css';\n    import '@/styles/uwx-osc-cosmetics.css';",
    'scene stylesheet');
const nextVersion=once(version,"export const UWX_VERSION = '0.6.19-rc38';",
    "export const UWX_VERSION = '0.6.20-rc39';",'version');
const notes=[
    '# UnderWeb X changelog','','## 0.6.20-rc39 — OSC Cosmetic Pack 1 and Scene Switcher','',
    '- Added three distinct OSC Lab chatbox themes: VOID.OS, Cassette Club and Midnight FM. Existing six themes remain.',
    '- These themes use existing music/weather/status/heart/world tokens, frame control, live preview and strict 144-character / 9-line fit logic.',
    '- New local Scene Switcher: save up to eight appearance/module layouts, preview, apply or delete.',
    '- Scenes change enabled module choices, order, template and header/footer, but never enable the OSC master sender, share statuses, or save sensitive provider tokens or ZIPs.',
    '- Reuses OSC Lab existing one-engine send rate limiting and persistent VRCX config; no new background schedulers or VRChat API calls.',
    '- This is an unpublished Windows candidate requiring visual/chatbox checks, not a finished share-code marketplace or graphical rich-text renderer.','',''
].join('\n');
const nextChangelog=once(changelog,'# UnderWeb X changelog\n\n',notes,'changelog');
for(const [sourceName,target] of files) {
    fs.mkdirSync(path.dirname(dest(target)),{recursive:true});
    fs.copyFileSync(src(sourceName),dest(target));
}
write(oscPath,nextOsc);write(storePath,nextStore);write(viewPath,nextView);write(appPath,nextApp);
write(versionPath,nextVersion);write('UWX_VERSION','0.6.20-rc39\n');write('CHANGELOG_UWX.md',nextChangelog);
console.log('RC39: OSC Pack 1 + local Scene Switcher integrated with existing OSC Lab.');
