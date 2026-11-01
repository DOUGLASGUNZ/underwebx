// UWX RC34 — install a customizable Home dashboard without rewriting existing cards.
// Must run after RC33 and verify all anchors before making any file change.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const source = path.resolve(process.argv[3] || 'features/home');
const target = (name) => path.join(root, name);
const asset = (name) => path.join(source, name);
const read = (p) => fs.readFileSync(target(p), 'utf8').replace(/\r\n/g, '\n');
const write = (p, text) => fs.writeFileSync(target(p), text.replace(/\r\n/g, '\n'), 'utf8');

const paths = [
    ['uwxHome.js', 'src/shared/utils/uwxHome.js'],
    ['uwxHomeStore.js', 'src/stores/uwxHome.js'],
    ['UwxHomeEditor.vue', 'src/views/UnderWeb/UwxHomeEditor.vue'],
    ['uwx-home.css', 'src/styles/uwx-home.css'],
    ['uwxHome.test.js', 'src/shared/utils/__tests__/uwxHome.test.js']
];

function replaceOnce(value, oldText, nextText, context) {
    const occurrences = value.split(oldText).length - 1;
    if (occurrences !== 1) throw new Error(`RC34: expected one ${context} anchor, got ${occurrences}`);
    return value.replace(oldText, nextText);
}

function findMatchingDiv(sourceText, at) {
    const re = /<\/?div\b[^>]*>/g;
    re.lastIndex = at;
    let depth = 0;
    for (let match; (match = re.exec(sourceText)); ) {
        if (match.index === at && !match[0].startsWith('<div')) {
            throw new Error('RC34: expected overview opening tag');
        }
        depth += match[0].startsWith('</') ? -1 : 1;
        if (depth === 0) return re.lastIndex;
        if (depth < 0) break;
    }
    throw new Error('RC34: could not find overview closing tag');
}

if (read('UWX_VERSION').trim() !== '0.6.14-rc33') throw new Error('RC34 requires validated UWX RC33.');
const appPath = 'src/App.vue';
const viewPath = 'src/views/UnderWeb/UnderWeb.vue';
const app = read(appPath);
const view = read(viewPath);
const version = read('src/shared/constants/uwx.js');
const changelog = read('CHANGELOG_UWX.md');

const oldImport = "    import UwxLookStudio from './UwxLookStudio.vue';";
const newImport = oldImport + "\n    import UwxHomeEditor from './UwxHomeEditor.vue';\n    import { useUwxHomeStore } from '../../stores/uwxHome';";
const oldState = "    const activePanel = ref(String(route.meta?.uwxPanel || 'command'));";
const newState = oldState + "\n    const uwxHome = useUwxHomeStore();\n    void uwxHome.init();";
const oldCss = "    import '@/styles/uwx-look.css';";
const newCss = oldCss + "\n    import '@/styles/uwx-home.css';";
const oldVersion = "export const UWX_VERSION = '0.6.14-rc33';";
const newVersion = "export const UWX_VERSION = '0.6.15-rc34';";
const header = '# UnderWeb X changelog\n\n';
const notes = `# UnderWeb X changelog

## 0.6.15-rc34 — Customizable Home Overview

- Personalize the existing Overview: show/hide and reorder live Current World, Network Online, and UWX Session cards.
- Drag-and-drop arrangement in the Home editor, with keyboard-usable move-up/down buttons and automatic local persistence.
- Preserved the exact existing card content and data bindings; no new VRChat API polling, fabricated online numbers, or backend changes.
- One-click reset; hiding every card leaves the editor and recovery action available.
- Existing client, login, Friends, Groups, OSC and RC33 layout appearance options remain untouched.

`;
for (const [src, dest] of paths) {
    if (!fs.existsSync(asset(src))) throw new Error('RC34 asset missing: ' + src);
    if (fs.existsSync(target(dest))) throw new Error('RC34 destination already exists: ' + dest);
}

const overviewStart = '<div v-if="activePanel === \'command\'" class="uwx-overview">';
if (view.split(overviewStart).length !== 2) throw new Error('RC34: existing Home overview anchor missing/duplicated');
const start = view.indexOf(overviewStart);
const end = findMatchingDiv(view, start);
let overview = view.slice(start, end);
const tileOpen = '<div class="uwx-overview-tile">';
const matches = [...overview.matchAll(/<div class="uwx-overview-tile">/g)];
if (matches.length !== 3) throw new Error(`RC34: expected exactly 3 existing Overview cards, got ${matches.length}`);
const ids = { WORLD: 'world', 'NETWORK ONLINE': 'network', 'UWX SESSION': 'session' };
const seen = new Set();
for (const m of [...matches].reverse()) {
    const segment = overview.slice(m.index + tileOpen.length, m.index + tileOpen.length + 270);
    const label = segment.match(/^\s*<span>\s*([^<]+?)\s*<\/span>/)?.[1];
    const id = ids[label];
    if (!id || seen.has(id)) throw new Error('RC34: unexpected Overview tile heading: ' + label);
    seen.add(id);
    const enhanced = `<div class="uwx-overview-tile" v-show="uwxHome.isVisible('${id}')" :style="{ order: uwxHome.rank('${id}') }">`;
    overview = overview.slice(0, m.index) + enhanced + overview.slice(m.index + tileOpen.length);
}
if (seen.size !== 3) throw new Error('RC34: not all expected Overview tiles present');
const editedOverview = '<UwxHomeEditor v-if="activePanel === \'command\'" />\n\n        ' + overview;

const nextView = replaceOnce(
    replaceOnce(view.slice(0, start) + editedOverview + view.slice(end), oldImport, newImport, 'component import'),
    oldState, newState, 'home state'
);
const nextApp = replaceOnce(app, oldCss, newCss, 'stylesheet import');
const nextVersion = replaceOnce(version, oldVersion, newVersion, 'version constant');
const nextChangelog = replaceOnce(changelog, header, notes, 'changelog header');

// All source assertions are complete; write the already-validated update.
for (const [src, dest] of paths) {
    fs.mkdirSync(path.dirname(target(dest)), { recursive: true });
    fs.copyFileSync(asset(src), target(dest));
}
write(appPath, nextApp);
write(viewPath, nextView);
write('src/shared/constants/uwx.js', nextVersion);
write('UWX_VERSION', '0.6.15-rc34\n');
write('CHANGELOG_UWX.md', nextChangelog);
console.log('UWX RC34: kept original three live Home cards and installed personalization controls.');
