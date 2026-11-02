import { reactive } from 'vue';
import { defineStore } from 'pinia';
import configRepository from '../services/config';
import { DEFAULT_HOME, normalizeHome, homeIsVisible, homeRank, setHomeVisible, moveHomeWidget, dragHomeBefore } from '../shared/utils/uwxHome';

const KEY = 'UWX_homeWidgets_v1';
function readCache() {
    try { return normalizeHome(JSON.parse(localStorage.getItem(KEY) || 'null')); }
    catch { return normalizeHome(DEFAULT_HOME); }
}
export const useUwxHomeStore = defineStore('UwxHomeWidgets', () => {
    const layout = reactive(readCache());
    let touched = false;
    function commit(next) {
        touched = true;
        Object.assign(layout, normalizeHome(next));
        const json = JSON.stringify(layout);
        try { localStorage.setItem(KEY, json); } catch {}
        void configRepository.setString(KEY, json).catch((err) => console.warn('UWX Home layout could not be saved.', err));
    }
    async function init() {
        try {
            const saved = JSON.parse((await configRepository.getString(KEY, '')) || 'null');
            if (!touched && saved) {
                Object.assign(layout, normalizeHome(saved));
                try { localStorage.setItem(KEY, JSON.stringify(layout)); } catch {}
            }
        } catch { /* Retain local cache or defaults */ }
    }
    function isVisible(id) { return homeIsVisible(layout, id); }
    function rank(id) { return homeRank(layout, id); }
    function setVisible(id, visible) { commit(setHomeVisible(layout, id, visible)); }
    function move(id, by) { commit(moveHomeWidget(layout, id, by)); }
    function dragBefore(source, destination) { commit(dragHomeBefore(layout, source, destination)); }
    function restore() { commit(DEFAULT_HOME); }
    return { layout, init, isVisible, rank, setVisible, move, dragBefore, restore };
});
