// Applies the Look Studio to the validated RC32 source tree.
// Fail closed when an expected anchor changes; never patch a half-known build.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const source = path.resolve(process.argv[3] || 'features/look-studio');

const output = (p) => path.join(root, p);
const input = (p) => path.join(source, p);
const read = (p) => fs.readFileSync(output(p), 'utf8').replace(/\r\n/g, '\n');
const write = (p, text) => fs.writeFileSync(output(p), text.replace(/\r\n/g, '\n'), 'utf8');

function replaceUnique(file, oldText, newText) {
    const body = read(file);
    const occurrences = body.split(oldText).length - 1;
    if (occurrences !== 1) {
        throw new Error(`Look Studio: expected one anchor in ${file}, found ${occurrences}: ${oldText.slice(0, 65)}`);
    }
    write(file, body.replace(oldText, newText));
}

if (read('UWX_VERSION').trim() !== '0.6.13-rc32') {
    throw new Error('Look Studio must be applied immediately after validated UWX 0.6.13-rc32.');
}

// Check all anchor points before touching any source file.
const app = read('src/App.vue');
const view = read('src/views/UnderWeb/UnderWeb.vue');
const checks = [
    [app, "    import { useUwxThemeStore } from './stores/uwxTheme';", 'App theme import'],
    [app, '    void useUwxThemeStore().init();', 'App theme initialization'],
    [app, "    import '@/styles/uwx-premium.css';", 'App stylesheet'],
    [view, '<UwxAppearanceCard v-show="activePanel === \'system\'" />', 'Appearance panel'],
    [view, "    import UwxAppearanceCard from './UwxAppearanceCard.vue';", 'Appearance import'],
    [read('src/shared/constants/uwx.js'), "export const UWX_VERSION = '0.6.13-rc32';", 'version constant']
];
for (const [body, needle, label] of checks) {
    if (body.split(needle).length !== 2) throw new Error('Look Studio anchor missing or duplicated: ' + label);
}

const assets = [
    ['uwxLook.js', 'src/shared/utils/uwxLook.js'],
    ['uwxLookStore.js', 'src/stores/uwxLook.js'],
    ['UwxLookStudio.vue', 'src/views/UnderWeb/UwxLookStudio.vue'],
    ['uwx-look.css', 'src/styles/uwx-look.css'],
    ['uwxLook.test.js', 'src/shared/utils/__tests__/uwxLook.test.js']
];
for (const [src, target] of assets) {
    if (!fs.existsSync(input(src))) throw new Error('Missing Look Studio source: ' + src);
    if (fs.existsSync(output(target))) throw new Error('Look Studio already installed: ' + target);
}

// All preconditions passed. Copy assets and edit bounded anchors.
for (const [src, target] of assets) {
    fs.mkdirSync(path.dirname(output(target)), { recursive: true });
    fs.copyFileSync(input(src), output(target));
}
replaceUnique(
    'src/App.vue',
    "    import { useUwxThemeStore } from './stores/uwxTheme';",
    "    import { useUwxThemeStore } from './stores/uwxTheme';\n    import { useUwxLookStore } from './stores/uwxLook';"
);
replaceUnique(
    'src/App.vue',
    '    void useUwxThemeStore().init();',
    '    void useUwxThemeStore().init();\n    void useUwxLookStore().init();'
);
replaceUnique(
    'src/App.vue',
    "    import '@/styles/uwx-premium.css';",
    "    import '@/styles/uwx-premium.css';\n    import '@/styles/uwx-look.css';"
);
replaceUnique(
    'src/views/UnderWeb/UnderWeb.vue',
    '<UwxAppearanceCard v-show="activePanel === \'system\'" />',
    '<UwxAppearanceCard v-show="activePanel === \'system\'" />\n            <UwxLookStudio v-show="activePanel === \'system\'" />'
);
replaceUnique(
    'src/views/UnderWeb/UnderWeb.vue',
    "    import UwxAppearanceCard from './UwxAppearanceCard.vue';",
    "    import UwxAppearanceCard from './UwxAppearanceCard.vue';\n    import UwxLookStudio from './UwxLookStudio.vue';"
);
replaceUnique('src/shared/constants/uwx.js', "export const UWX_VERSION = '0.6.13-rc32';", "export const UWX_VERSION = '0.6.14-rc33';");
write('UWX_VERSION', '0.6.14-rc33\n');
replaceUnique(
    'CHANGELOG_UWX.md',
    '# UnderWeb X changelog\n\n',
    `# UnderWeb X changelog

## 0.6.14-rc33 — Layout & Appearance Studio

- Preserved the existing VRCX-based client, login, friends, groups, social history, and UnderWeb modules.
- Extended the existing RC19 color themes rather than duplicating them: no new accent engine, color presets or palette.
- Added comfortable/compact spacing, adjustable text size, panel shapes, solid/glass surfaces and reduced motion.
- Added neutral ambient/grid backgrounds and an optional local PNG/JPEG/WebP image (max 1.5 MB) with a dark text-readability overlay.
- Layout changes are saved only on this PC, can be reset, and don't alter VRChat/OSC settings or network accounts.
- Included input validation tests. Windows interaction and performance testing required before release.

`
);
console.log('Look Studio installed on UWX 0.6.14-rc33');
