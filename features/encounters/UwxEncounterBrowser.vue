<template>
    <Card class="uwx-card uwx-card-wide uwx-encounters">
        <CardHeader>
            <div class="uwx-encounters-heading">
                <div>
                    <span class="uwx-encounters-eyebrow">SOCIAL PASSPORT / LOCAL HISTORY</span>
                    <CardTitle>People you've encountered</CardTitle>
                    <CardDescription>Find people from your PC's saved VRChat game logs—even if you never added them.</CardDescription>
                </div>
                <Button variant="outline" size="sm" :aria-expanded="expanded" @click="toggleExpanded">
                    <i :class="expanded ? 'ri-arrow-up-s-line' : 'ri-history-line'" />
                    {{ expanded ? 'Close history' : 'Browse encounters' }}
                </Button>
            </div>
        </CardHeader>
        <CardContent v-if="expanded">
            <div class="uwx-encounters-tools">
                <label class="uwx-encounters-search">
                    <i class="ri-search-line" aria-hidden="true" />
                    <input v-model="search" type="search" maxlength="100" placeholder="Find someone by name or VRChat ID"
                        aria-label="Search recent encounters" />
                </label>
                <label class="uwx-encounters-checkbox">
                    <input v-model="includeFriends" type="checkbox" />
                    Include friends
                </label>
                <label class="uwx-encounters-sort">
                    <span>Sort</span>
                    <select v-model="sort" aria-label="Sort recent encounters">
                        <option value="recent">Most recently seen</option>
                        <option value="days">Most days encountered</option>
                    </select>
                </label>
                <Button size="sm" variant="ghost" :disabled="loading" @click="load">
                    <i class="ri-refresh-line" :class="{ 'animate-spin': loading }" />
                    Refresh local history
                </Button>
            </div>
            <div class="uwx-encounters-meta">
                <span>Last 30 days · This PC only · {{ filtered.length }} shown</span>
                <span>No background requests to VRChat or UnderWeb.cloud</span>
            </div>
            <div v-if="loading" class="uwx-encounters-message" role="status">Reading saved encounters from your local game log…</div>
            <div v-else-if="error" class="uwx-encounters-message" role="alert">
                {{ error }}
                <Button size="sm" variant="outline" @click="load">Try again</Button>
            </div>
            <div v-else-if="!filtered.length" class="uwx-encounters-message">
                {{ rows.length ? 'No people match these filters. Try including friends or another search.' : 'No encounters recorded on this PC in the last 30 days.' }}
            </div>
            <div v-else class="uwx-encounters-list">
                <button v-for="row in filtered" :key="row.userId" type="button"
                    class="uwx-encounters-row"
                    :class="{ selected: selectedId === row.userId }"
                    :aria-label="'Open Social Passport for ' + row.displayName"
                    :aria-pressed="selectedId === row.userId"
                    @click="$emit('select', row)">
                    <span class="uwx-encounters-avatar" aria-hidden="true"><i class="ri-user-line" /></span>
                    <span class="uwx-encounters-person">
                        <strong>{{ row.displayName }}</strong>
                        <small>{{ friendStore.friends.has(row.userId) ? 'Friend' : 'Encountered, not a current friend' }}</small>
                    </span>
                    <span class="uwx-encounters-activity">
                        <strong>{{ row.days }} {{ row.days === 1 ? 'day' : 'days' }}</strong>
                        <small>Last seen {{ dateLabel(row.lastSeen) }}</small>
                    </span>
                    <i class="ri-arrow-right-s-line uwx-encounters-arrow" aria-hidden="true" />
                </button>
            </div>
            <p class="uwx-encounters-footnote">Only people with a recorded VRChat user ID appear. These are observations captured by your PC, not a complete account history. Opening a Passport does not send them a notification.</p>
        </CardContent>
    </Card>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { useFriendStore } from '../../stores/friend';
    import { useUserStore } from '../../stores/user';
    import { visibleEncounters } from '../../shared/utils/uwxEncounters';
    import { readLocalEncounters } from '../../services/uwxEncounters';

    defineProps({
        selectedId: { type: String, default: '' }
    });
    defineEmits(['select']);

    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const expanded = ref(false);
    const rows = ref([]);
    const loading = ref(false);
    const error = ref('');
    const search = ref('');
    const sort = ref('recent');
    const includeFriends = ref(false);
    let loadSequence = 0;

    const filtered = computed(() => visibleEncounters(rows.value, {
        friendIds: new Set(friendStore.friends.keys()),
        selfId: userStore.currentUser?.id || '',
        search: search.value,
        includeFriends: includeFriends.value,
        sort: sort.value
    }));

    async function load() {
        if (loading.value) return;
        const seq = ++loadSequence;
        loading.value = true;
        error.value = '';
        try {
            const result = await readLocalEncounters();
            if (seq === loadSequence) rows.value = result;
        } catch {
            if (seq === loadSequence) {
                rows.value = [];
                error.value = 'UWX could not read the local VRChat history. Check your game log database.';
            }
        } finally {
            if (seq === loadSequence) loading.value = false;
        }
    }

    function toggleExpanded() {
        expanded.value = !expanded.value;
        if (expanded.value && !rows.value.length && !loading.value && !error.value) void load();
    }

    function dateLabel(value) {
        const date = new Date(value);
        return Number.isFinite(date.getTime()) ? date.toLocaleDateString() : 'unknown';
    }
</script>
