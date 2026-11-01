import { reactive } from 'vue';
import { defineStore } from 'pinia';

import configRepository from '../services/config';
import { DEFAULT_LAYOUT, normalizeLayout, changeLayoutOption, withLocalImage, withoutLocalImage } from '../shared/utils/uwxLook';

const STORAGE_KEY = 'UWX_layoutStudio_v1';

function readCache() {
    try {
        return normalizeLayout(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
    } catch {
        return { ...DEFAULT_LAYOUT };
    }
}

export function applyLayout(layout) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.dataset.uwxDensity = layout.density;
    root.dataset.uwxCorners = layout.corners;
    root.dataset.uwxSurface = layout.surface;
    root.dataset.uwxMotion = layout.motion;
    root.dataset.uwxType = layout.type;
    root.dataset.uwxBackdrop = layout.backdrop;
    // Data URL was validated at the data-model boundary. No remote URLs.
    if (layout.backdrop === 'image' && layout.imageData) {
        root.style.setProperty('--uwx-backdrop-image', `url("${layout.imageData}")`);
    } else {
        root.style.removeProperty('--uwx-backdrop-image');
    }
}

export const useUwxLookStore = defineStore('UwxLayoutStudio', () => {
    const layout = reactive(readCache());
    let userEdited = false;

    function save(next) {
        userEdited = true;
        Object.assign(layout, normalizeLayout(next));
        applyLayout(layout);
        const payload = JSON.stringify(layout);
        try { localStorage.setItem(STORAGE_KEY, payload); } catch {}
        void configRepository.setString(STORAGE_KEY, payload).catch((err) => {
            console.warn('UWX layout preferences could not be saved to app settings.', err);
        });
    }

    async function init() {
        applyLayout(layout);
        try {
            const saved = JSON.parse((await configRepository.getString(STORAGE_KEY, '')) || 'null');
            if (!userEdited && saved) {
                Object.assign(layout, normalizeLayout(saved));
                applyLayout(layout);
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)); } catch {}
            }
        } catch {
            // Keep the last cached preferences.
        }
    }

    function setOption(key, value) { save(changeLayoutOption(layout, key, value)); }
    function setImage(data) { save(withLocalImage(layout, data)); }
    function clearImage() { save(withoutLocalImage(layout)); }
    function resetLayout() { save(DEFAULT_LAYOUT); }

    return { layout, init, setOption, setImage, clearImage, resetLayout };
});
