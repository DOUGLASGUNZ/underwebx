<template>
    <section class="uwx-worlds" aria-label="World Passport">
        <header class="uwx-worlds-header">
            <div>
                <div class="uwx-worlds-kicker">UWX / EXPLORE</div>
                <h2>World Passport</h2>
                <p>Organize worlds you've explored or favorited. Your actual VRCX favorites and world notes stay intact.</p>
            </div>
            <Button size="sm" variant="outline" :disabled="loading" @click="refreshWorlds">
                <i class="ri-refresh-line" /> Refresh local worlds
            </Button>
        </header>
        <div class="uwx-worlds-stats">
            <div><span>WORLD RECORDS</span><strong>{{ worlds.length }}</strong><small>Last 180 days + VRCX favorites</small></div>
            <div><span>FAVORITED</span><strong>{{ worlds.filter(w => w.favorite).length }}</strong><small>Existing VRCX favorites</small></div>
            <div><span>RATED</span><strong>{{ worlds.filter(w => (records[w.id]?.rating || 0) > 0).length }}</strong><small>Your own personal ratings</small></div>
        </div>

        <div class="uwx-worlds-layout">
            <div class="uwx-worlds-library">
                <div class="uwx-worlds-filters">
                    <input v-model="search" type="search" placeholder="Search worlds or world IDs…" maxlength="100" aria-label="Search worlds" />
                    <div class="uwx-worlds-filterrow">
                        <select v-model="category" aria-label="Filter world collection">
                            <option value="all">All recorded</option>
                            <option value="favorites">VRCX favorites</option>
                            <option value="rated">My rated worlds</option>
                            <option v-for="name in collections" :key="name" :value="name">{{ name }}</option>
                        </select>
                        <select v-model="sort" aria-label="Sort World Passport">
                            <option value="recent">Recently visited</option>
                            <option value="visits">Most visits</option>
                            <option value="rating">Top rated</option>
                        </select>
                    </div>
                </div>
                <p class="uwx-worlds-context">Showing {{ filtered.length }} locally recorded worlds. Data is never uploaded.</p>
                <div v-if="loading" class="uwx-worlds-empty" role="status">Reading your saved VRCX world history…</div>
                <div v-else-if="loadError" class="uwx-worlds-empty" role="alert">{{ loadError }}</div>
                <div v-else-if="!filtered.length" class="uwx-worlds-empty">No worlds match these filters. Try All recorded or another search.</div>
                <div v-else class="uwx-worlds-list">
                    <button v-for="world in filtered" :key="world.id" type="button"
                        :class="['uwx-worlds-item', { selected: selectedId === world.id }]"
                        :aria-pressed="selectedId === world.id" @click="selectWorld(world)">
                        <span class="uwx-worlds-item-icon"><i class="ri-earth-line" /></span>
                        <span class="uwx-worlds-item-body">
                            <strong>{{ world.name }}</strong>
                            <small>{{ world.visits }} recorded {{ world.visits === 1 ? 'visit' : 'visits' }}
                                <span v-if="world.favorite"> · ★ VRCX favorite</span>
                            </small>
                        </span>
                        <span v-if="records[world.id]?.rating" class="uwx-worlds-item-rating">{{ records[world.id].rating }}/5</span>
                    </button>
                </div>
            </div>

            <div class="uwx-worlds-detail">
                <div v-if="!selectedWorld" class="uwx-worlds-empty">Choose a world to open its Passport.</div>
                <template v-else>
                    <div class="uwx-worlds-detail-header">
                        <div>
                            <span class="uwx-worlds-kicker">PERSONAL WORLD RECORD</span>
                            <h3>{{ selectedWorld.name }}</h3>
                            <small>{{ selectedWorld.id }}</small>
                        </div>
                        <Button size="sm" variant="outline" @click="showWorldDialog(selectedWorld.id)">
                            <i class="ri-external-link-line" /> VRCX world details
                        </Button>
                    </div>
                    <div class="uwx-worlds-details">
                        <div><span>RECORDED VISITS</span><strong>{{ selectedWorld.visits }}</strong></div>
                        <div><span>LAST VISITED</span><strong>{{ selectedWorld.lastSeen ? dateLabel(selectedWorld.lastSeen) : 'Not recorded' }}</strong></div>
                        <div><span>VRCX FAVORITE</span><strong>{{ selectedWorld.favorite ? 'Yes' : 'No' }}</strong></div>
                    </div>

                    <div class="uwx-worlds-editbox">
                        <div class="uwx-worlds-section-title"><strong>My rating</strong><small>Only visible on this PC</small></div>
                        <div class="uwx-worlds-stars" aria-label="Personal world rating">
                            <button v-for="star in 5" :key="star" type="button" :aria-label="'Rate ' + star + ' out of 5 stars'"
                                :aria-pressed="(records[selectedWorld.id]?.rating || 0) === star"
                                :disabled="saving || !settingsLoaded"
                                @click="rateWorld(star)">
                                <i :class="star <= (records[selectedWorld.id]?.rating || 0) ? 'ri-star-fill' : 'ri-star-line'" />
                            </button>
                            <button type="button" class="uwx-worlds-clear" :disabled="saving || !settingsLoaded"
                                @click="rateWorld(0)">Clear rating</button>
                        </div>
                    </div>

                    <div class="uwx-worlds-editbox">
                        <div class="uwx-worlds-section-title"><strong>My collections</strong><small>Private labels, separate from VRCX favorites</small></div>
                        <div class="uwx-worlds-tags">
                            <span v-for="name in (records[selectedWorld.id]?.collections || [])" :key="name">
                                {{ name }}
                                <button type="button" :disabled="saving || !settingsLoaded"
                                    :aria-label="'Remove from ' + name" @click="removeCollection(name)">
                                    <i class="ri-close-line" />
                                </button>
                            </span>
                            <small v-if="!(records[selectedWorld.id]?.collections || []).length">No collections yet</small>
                        </div>
                        <form class="uwx-worlds-add" @submit.prevent="addCollection">
                            <input v-model="newCollection" type="text" maxlength="28" placeholder="e.g. Horror, Chill, Photo Worlds"
                                aria-label="New collection" :disabled="saving || !settingsLoaded" />
                            <Button size="sm" variant="outline" type="submit" :disabled="!newCollection.trim() || saving || !settingsLoaded">Add</Button>
                        </form>
                        <p v-if="settingsError" class="uwx-worlds-error" role="alert">{{ settingsError }}</p>
                    </div>

                    <div class="uwx-worlds-editbox">
                        <div class="uwx-worlds-section-title"><strong>World note</strong><small>Your existing VRCX memo</small></div>
                        <p class="uwx-worlds-help">Notes here are the same notes you use in VRCX. They aren't shared with the world's creator.</p>
                        <textarea v-model="memoDraft" rows="4" :disabled="memoLoading || memoSaving" aria-label="VRCX world memo"
                            placeholder="What made this world memorable? Who would enjoy it?" />
                        <div class="uwx-worlds-noteactions">
                            <small>{{ memoDraft === savedMemo ? 'No unsaved changes' : 'Unsaved changes' }}</small>
                            <Button size="sm" :disabled="memoDraft === savedMemo || memoLoading || memoSaving" @click="saveMemo">
                                {{ memoSaving ? 'Saving…' : 'Save note' }}
                            </Button>
                        </div>
                        <p v-if="memoError" class="uwx-worlds-error" role="alert">{{ memoError }}</p>
                    </div>
                </template>
            </div>
        </div>
        <p class="uwx-worlds-footnote">Visits come from the VRCX game log saved on this computer. Missing visits do not mean a world was never visited. Open VRCX world details to manage actual VRChat favorites and see additional information.</p>
    </section>
</template>

<script setup>
    import { computed, onMounted, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import configRepository from '../../services/config';
    import { showWorldDialog } from '../../coordinators/worldCoordinator';
    import { addWorldCollection, filterWorldVisits, normalizePassportRecords, removeWorldCollection, updateWorldRating } from '../../shared/utils/uwxWorldPassport';
    import { readWorldPassportVisits, readExistingWorldMemo, saveExistingWorldMemo } from '../../services/uwxWorldPassport';

    const KEY = 'UWX_worldPassport_v1';
    const worlds = ref([]);
    const records = ref({});
    const loading = ref(false);
    const loadError = ref('');
    const settingsLoaded = ref(false);
    const saving = ref(false);
    const settingsError = ref('');
    const selectedId = ref('');
    const search = ref('');
    const sort = ref('recent');
    const category = ref('all');
    const newCollection = ref('');
    const memoDraft = ref('');
    const savedMemo = ref('');
    const memoLoading = ref(false);
    const memoSaving = ref(false);
    const memoError = ref('');
    let noteGeneration = 0;

    const collections = computed(() =>
        [...new Set(Object.values(records.value).flatMap(x => x.collections || []))].sort((a, b) => a.localeCompare(b))
    );
    const filtered = computed(() => filterWorldVisits(worlds.value, {
        search: search.value, sort: sort.value, category: category.value, records: records.value
    }));
    const selectedWorld = computed(() => worlds.value.find(w => w.id === selectedId.value) || null);

    async function loadSettings() {
        try {
            const json = await configRepository.getString(KEY, '{}');
            records.value = normalizePassportRecords(JSON.parse(json || '{}'));
            settingsLoaded.value = true;
        } catch {
            settingsLoaded.value = false; // Avoid overwriting unreadable existing preferences.
            settingsError.value = 'Could not load World Passport settings. Restart UWX before editing ratings.';
        }
    }
    async function saveRecords(next) {
        if (!settingsLoaded.value || saving.value) return;
        saving.value = true;
        settingsError.value = '';
        try {
            await configRepository.setString(KEY, JSON.stringify(next));
            records.value = next;
        } catch {
            settingsError.value = 'Could not save ratings/collections on this PC.';
        } finally { saving.value = false; }
    }
    async function rateWorld(rating) {
        try { await saveRecords(updateWorldRating(records.value, selectedId.value, rating)); }
        catch (error) { settingsError.value = error.message; }
    }
    async function addCollection() {
        try {
            const next = addWorldCollection(records.value, selectedId.value, newCollection.value);
            await saveRecords(next);
            if (!settingsError.value) newCollection.value = '';
        } catch (error) { settingsError.value = error.message; }
    }
    async function removeCollection(label) {
        try { await saveRecords(removeWorldCollection(records.value, selectedId.value, label)); }
        catch (error) { settingsError.value = error.message; }
    }

    async function refreshWorlds() {
        if (loading.value) return;
        loading.value = true;
        loadError.value = '';
        try {
            worlds.value = await readWorldPassportVisits();
            if (!worlds.value.some(w => w.id === selectedId.value)) {
                const first = worlds.value[0];
                if (first) await selectWorld(first);
                else selectedId.value = '';
            }
        } catch {
            loadError.value = 'Could not read the local world history database.';
        } finally {
            loading.value = false;
        }
    }

    async function selectWorld(world) {
        if (!world || world.id === selectedId.value) return;
        if (memoDraft.value !== savedMemo.value && selectedId.value) {
            const ok = await saveMemo();
            if (!ok) return; // Never silently lose an edited memo.
        }
        const generation = ++noteGeneration;
        selectedId.value = world.id;
        memoDraft.value = '';
        savedMemo.value = '';
        newCollection.value = '';
        settingsError.value = '';
        memoError.value = '';
        memoLoading.value = true;
        try {
            const memo = await readExistingWorldMemo(world.id);
            if (generation !== noteGeneration) return;
            savedMemo.value = memo;
            memoDraft.value = memo;
        } catch {
            if (generation === noteGeneration) memoError.value = 'Could not load this world’s existing VRCX memo.';
        } finally { if (generation === noteGeneration) memoLoading.value = false; }
    }

    async function saveMemo() {
        if (memoLoading.value || memoSaving.value || !selectedId.value) return false;
        memoSaving.value = true;
        memoError.value = '';
        const id = selectedId.value;
        const value = memoDraft.value;
        try {
            await saveExistingWorldMemo(id, value);
            if (id === selectedId.value) savedMemo.value = value;
            return true;
        } catch {
            memoError.value = 'Could not save the world memo. Your edits are still here.';
            return false;
        } finally { memoSaving.value = false; }
    }

    function dateLabel(value) {
        const date = new Date(value);
        return Number.isFinite(date.getTime()) ? date.toLocaleDateString() : 'Unknown';
    }

    onMounted(() => {
        void loadSettings();
        void refreshWorlds();
    });
</script>
