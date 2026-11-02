// RC39: optional private OSC scene snapshots. This models cosmetics only.
// Never saves status texts, Pulsoid tokens, ZIP/weather location, auth or API data.
import { OSC_MODULES, DEFAULT_TEMPLATES, normalizeSettings } from './uwxOsc';

export const MAX_SCENES = 8;
const MAX_NAME = 30;
const MAX_TEMPLATE = 144;
const MAX_FRAME = 40;
const ID_PATTERN = /^osc-scene-[a-zA-Z0-9-]{1,52}$/;

function frameLine(raw) {
    return typeof raw === 'string' ? raw.replace(/[\r\n\u0000-\u001f]/g, ' ').trim().slice(0, MAX_FRAME) : '';
}
function nameOf(raw) {
    return typeof raw === 'string' ? raw.replace(/[\r\n\u0000-\u001f]/g, ' ').trim().slice(0, MAX_NAME) : '';
}

export function normalizeOscScene(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !ID_PATTERN.test(raw.id || '')) return null;
    const name = nameOf(raw.name);
    if (!name || !raw.modules || typeof raw.modules !== 'object' || Array.isArray(raw.modules)) return null;
    // A scene only covers presentation and module visibility, NOT sender master enable/credentials.
    const modules = {};
    for (const key of OSC_MODULES) {
        const m = raw.modules[key];
        if (!m || typeof m !== 'object') return null;
        modules[key] = {
            enabled: m.enabled === true,
            template: typeof m.template === 'string' && m.template.trim()
                ? m.template.slice(0, MAX_TEMPLATE)
                : DEFAULT_TEMPLATES[key]
        };
    }
    const validOrder = Array.isArray(raw.order)
        ? raw.order.filter((key, i, arr) => OSC_MODULES.includes(key) && arr.indexOf(key) === i)
        : [];
    return {
        id: raw.id,
        name,
        order: [...validOrder, ...OSC_MODULES.filter(key => !validOrder.includes(key))],
        frame: { header: frameLine(raw.frame?.header), footer: frameLine(raw.frame?.footer) },
        modules
    };
}

export function normalizeOscSceneLibrary(raw) {
    if (!Array.isArray(raw)) return [];
    const used = new Set();
    const scenes = [];
    for (const item of raw) {
        const scene = normalizeOscScene(item);
        if (!scene || used.has(scene.id)) continue;
        used.add(scene.id);
        scenes.push(scene);
        if (scenes.length >= MAX_SCENES) break;
    }
    return scenes;
}

export function captureOscScene(settings, name, id) {
    const normalized = normalizeSettings(settings);
    const raw = {
        id,
        name,
        order: [...normalized.order],
        frame: { ...normalized.frame },
        modules: Object.fromEntries(OSC_MODULES.map(key => [key, {
            enabled: normalized.modules[key].enabled,
            template: normalized.modules[key].template
        }]))
    };
    const scene = normalizeOscScene(raw);
    if (!scene) throw new Error('Enter a scene name.');
    return scene;
}

export function saveOscScene(library, scene) {
    const clean = normalizeOscScene(scene);
    if (!clean) throw new Error('Invalid scene.');
    const next = normalizeOscSceneLibrary(library);
    const existing = next.findIndex(s => s.id === clean.id || s.name.toLocaleLowerCase() === clean.name.toLocaleLowerCase());
    if (existing >= 0) next[existing] = clean;
    else {
        if (next.length >= MAX_SCENES) throw new Error('Save up to eight scenes.');
        next.push(clean);
    }
    return next;
}

export function deleteOscScene(library, id) {
    return normalizeOscSceneLibrary(library).filter(scene => scene.id !== id);
}

export function applyOscSceneToSettings(rawSettings, rawScene) {
    const scene = normalizeOscScene(rawScene);
    if (!scene) return null;
    const current = normalizeSettings(rawSettings);
    const modules = Object.fromEntries(OSC_MODULES.map(key => [key, {
        ...current.modules[key],
        enabled: scene.modules[key].enabled,
        template: scene.modules[key].template
    }]));
    // Preserve sender enabled state, statuses, token-dependent options and refresh timing.
    return normalizeSettings({ ...current, order: [...scene.order], frame: { ...scene.frame }, modules });
}

export function sceneMatchesSettings(rawScene, settings) {
    const scene = normalizeOscScene(rawScene);
    if (!scene) return false;
    const current = normalizeSettings(settings);
    return scene.order.every((k, i) => k === current.order[i]) &&
        scene.frame.header === current.frame.header &&
        scene.frame.footer === current.frame.footer &&
        OSC_MODULES.every(key =>
            scene.modules[key].enabled === current.modules[key].enabled &&
            scene.modules[key].template === current.modules[key].template
        );
}
