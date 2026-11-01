import { reactive } from 'vue';
import { defineStore } from 'pinia';

import configRepository from '../services/config';
import { DEFAULT_LOOK, LOOK_PRESETS, lookFromPreset, normalizeLook, withLookOption } from '../shared/utils/uwxLook';
import { useUwxThemeStore } from './uwxTheme';

const STORAGE_KEY = 'UWX_lookStudio_v1';

function cachedLook() {
    try {
        return normalizeLook(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
    } catch {
        return { ...DEFAULT_LOOK };
    }
}

function applyLook(look) {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.dataset.uwxDensity = look.density;
    html.dataset.uwxCorners = look.corners;
    html.dataset.uwxSurface = look.surface;
    html.dataset.uwxMotion = look.motion;
}

export const useUwxLookStore = defineStore('UwxLookStudio', () => {
    const look = reactive(cachedLook());
    let changedSinceLoad = false;

    function save(next) {
        changedSinceLoad = true;
        Object.assign(look, normalizeLook(next));
        applyLook(look);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(look));
        } catch {
            // Continue using the live value if storage is disabled.
        }
        void configRepository.setString(STORAGE_KEY, JSON.stringify(look)).catch(() => {});
    }

    async function init() {
        applyLook(look); // Paint cached values immediately.
        try {
            const saved = JSON.parse((await configRepository.getString(STORAGE_KEY, '')) || 'null');
            // Never let an async read undo a change the user just made.
            if (!changedSinceLoad && saved) {
                Object.assign(look, normalizeLook(saved));
                applyLook(look);
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(look)); } catch {}
            }
        } catch {
            // The cache/default remains the source when DB is unavailable.
        }
    }

    function selectPreset(id) {
        const preset = LOOK_PRESETS.find((p) => p.id === id);
        if (!preset) return;
        save(lookFromPreset(id));
        const theme = useUwxThemeStore();
        theme.setEnabled(true);
        theme.setPreset(preset.color);
        theme.setTint(preset.tint);
    }

    function setOption(key, value) {
        try {
            save(withLookOption(look, key, value));
        } catch {
            // UI limits selection; reject unknown values.
        }
    }

    function resetLook() {
        selectPreset(DEFAULT_LOOK.preset);
    }

    return { look, init, selectPreset, setOption, resetLook };
});
