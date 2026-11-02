import { ref } from 'vue';
import { defineStore } from 'pinia';
import configRepository from '../services/config';
import { normalizePassportTags, addPassportTag, removePassportTag } from '../shared/utils/uwxPassport';

const STORAGE_KEY = 'UWX_socialPassportTags_v1';

export const useUwxPassportTagsStore = defineStore('UwxPassportTags', () => {
    const entries = ref({});
    const loading = ref(false);
    const saving = ref(false);
    const error = ref('');
    let loaded = false;
    let pendingLoad = null;

    function load() {
        if (loaded) return pendingLoad || Promise.resolve();
        loaded = true;
        loading.value = true;
        pendingLoad = (async () => {
            try {
                const json = await configRepository.getString(STORAGE_KEY, '');
                entries.value = normalizePassportTags(json ? JSON.parse(json) : {});
            } catch {
                entries.value = {};
                error.value = 'Could not read saved passport tags from this PC.';
            } finally {
                loading.value = false;
                pendingLoad = null;
            }
        })();
        return pendingLoad;
    }

    async function persist(next) {
        if (saving.value) throw new Error('A tag change is already being saved.');
        saving.value = true;
        error.value = '';
        try {
            // Persist first; do not claim a tag was saved if the database rejects it.
            await configRepository.setString(STORAGE_KEY, JSON.stringify(next));
            entries.value = next;
        } catch (err) {
            error.value = 'Could not save tags to the local UWX database.';
            throw err;
        } finally {
            saving.value = false;
        }
    }

    async function add(userId, tag) {
        await load();
        await persist(addPassportTag(entries.value, userId, tag));
    }

    async function remove(userId, tag) {
        await load();
        await persist(removePassportTag(entries.value, userId, tag));
    }

    function forUser(userId) {
        return entries.value[userId] || [];
    }

    return { entries, loading, saving, error, load, add, remove, forUser };
});
