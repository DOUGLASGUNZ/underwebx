<template>
    <Card class="uwx-card uwx-card-wide uwx-passport">
        <CardHeader>
            <div class="uwx-passport-header">
                <div class="uwx-passport-heading">
                    <span class="uwx-passport-kicker">PEOPLE / SOCIAL PASSPORT</span>
                    <CardTitle>{{ displayName || userId }}</CardTitle>
                    <CardDescription>
                        One place for your existing VRChat profile, locally observed time together, private VRCX memo and personal tags.
                    </CardDescription>
                </div>
                <div class="uwx-passport-actions">
                    <span class="uwx-passport-source">Local-first · This PC</span>
                    <Button size="sm" variant="outline" @click="showUserDialog(userId)">
                        <i class="ri-external-link-line" /> VRChat profile
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent class="space-y-4">
            <div class="uwx-passport-identity">
                <div class="uwx-passport-avatar" aria-hidden="true">
                    <i class="ri-user-smile-line" />
                </div>
                <div class="uwx-passport-identity-text">
                    <strong>{{ displayName || userId }}</strong>
                    <span>{{ userId }}</span>
                    <div class="uwx-passport-badges">
                        <span>{{ state || 'Status unavailable' }}</span>
                        <span :class="{ linked }">{{ linked ? 'UnderWeb linked' : 'No UnderWeb link recorded' }}</span>
                        <span v-for="role in roles.slice(0, 6)" :key="role">{{ role }}</span>
                    </div>
                </div>
            </div>

            <div class="uwx-passport-summary">
                <section>
                    <span>SHARED TIME</span>
                    <strong>{{ observed ? observed.duration : (loadingHistory ? 'Reading…' : 'No observation') }}</strong>
                    <small>{{ observed ? 'Observed together over the last 30 days' : 'No local shared time recorded in the last 30 days' }}</small>
                </section>
                <section>
                    <span>DAYS TOGETHER</span>
                    <strong>{{ observed ? observed.days : '—' }}</strong>
                    <small>Distinct calendar dates in your PC's game logs</small>
                </section>
                <section>
                    <span>LAST OBSERVED</span>
                    <strong>{{ observed?.lastSeen ? displayDate(observed.lastSeen) : 'Not recorded' }}</strong>
                    <small>Local encounter history, not online presence</small>
                </section>
            </div>

            <div class="uwx-passport-grid">
                <section class="uwx-passport-panel">
                    <div class="uwx-passport-panel-title">
                        <strong>Private VRCX memo</strong>
                        <span>Existing SQLite notes</span>
                    </div>
                    <p class="uwx-passport-explainer">This edits the same private memo you can already see in VRCX. No second notes database.</p>
                    <textarea
                        v-model="memoDraft"
                        rows="3"
                        maxlength="1500"
                        :disabled="memoLoading || memoSaving"
                        placeholder="How you met, shared interests, reminders…"
                        aria-label="Private VRCX memo for selected user"
                    />
                    <div class="uwx-passport-panel-actions">
                        <span>{{ memoDraft.length }}/1500</span>
                        <Button size="sm" :disabled="memoLoading || memoSaving || !memoChanged" @click="saveMemo">
                            {{ memoSaving ? 'Saving…' : 'Save memo' }}
                        </Button>
                    </div>
                    <p v-if="memoError" role="alert" class="uwx-passport-error">{{ memoError }}</p>
                </section>

                <section class="uwx-passport-panel">
                    <div class="uwx-passport-panel-title">
                        <strong>My tags</strong>
                        <span>Private to this PC</span>
                    </div>
                    <p class="uwx-passport-explainer">Organize people by your own labels. Tags don't modify VRChat or UnderWeb profiles.</p>
                    <div class="uwx-passport-tags">
                        <span v-for="tag in tagList" :key="tag" class="uwx-passport-tag">
                            {{ tag }}
                            <button type="button" :title="'Remove tag ' + tag" :aria-label="'Remove tag ' + tag"
                                :disabled="tagStore.saving" @click="removeTag(tag)"><i class="ri-close-line" /></button>
                        </span>
                        <span v-if="!tagList.length" class="uwx-passport-empty">No personal tags yet</span>
                    </div>
                    <form class="uwx-passport-tag-entry" @submit.prevent="addTag">
                        <input v-model="newTag" type="text" maxlength="24" placeholder="e.g. Movie night"
                            aria-label="New private tag" :disabled="tagStore.saving || tagStore.loading" />
                        <Button type="submit" size="sm" variant="outline"
                            :disabled="!newTag.trim() || tagStore.saving || tagStore.loading || tagList.length >= 8">Add tag</Button>
                    </form>
                    <p v-if="tagError || tagStore.error" role="alert" class="uwx-passport-error">{{ tagError || tagStore.error }}</p>
                </section>
            </div>

            <div class="uwx-passport-bottom">
                <span><i class="ri-lock-line" /> No new API polling, remote uploads or account-wide history claims.</span>
                <Button size="sm" variant="ghost" @click="togglePin(userId)">
                    <i :class="pinned ? 'ri-pushpin-2-fill' : 'ri-pushpin-2-line'" />
                    {{ pinned ? 'Unpin from crew' : 'Pin to crew' }}
                </Button>
            </div>
        </CardContent>
    </Card>
</template>

<script setup>
    import { computed, onMounted, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { showUserDialog } from '../../coordinators/userCoordinator';
    import { getUserMemo, saveUserMemo } from '../../coordinators/memoCoordinator';
    import { togetherSummary } from '../../shared/utils/uwxPassport';
    import { useUwxCrewStore } from '../../stores/uwxCrew';
    import { useUwxPassportTagsStore } from '../../stores/uwxPassportTags';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

    const props = defineProps({
        userId: { type: String, required: true },
        displayName: { type: String, default: '' },
        state: { type: String, default: '' },
        roles: { type: Array, default: () => [] },
        linked: { type: Boolean, default: false }
    });

    const crew = useUwxCrewStore();
    const { stats, prefs, loading: loadingHistory } = storeToRefs(crew);
    const observed = computed(() => togetherSummary(stats.value.find(row => row.userId === props.userId)));
    const pinned = computed(() => prefs.value.pinned.includes(props.userId));
    const { togglePin } = crew;
    const tagStore = useUwxPassportTagsStore();
    const tagList = computed(() => tagStore.forUser(props.userId));
    const newTag = ref('');
    const tagError = ref('');

    const memoDraft = ref('');
    const originalMemo = ref('');
    const memoLoading = ref(false);
    const memoSaving = ref(false);
    const memoError = ref('');
    const memoChanged = computed(() => memoDraft.value !== originalMemo.value);
    let memoLoadRequest = 0;

    watch(() => props.userId, async (id) => {
        const request = ++memoLoadRequest;
        memoLoading.value = true;
        memoDraft.value = '';
        originalMemo.value = '';
        memoError.value = '';
        newTag.value = '';
        tagError.value = '';
        try {
            const row = await getUserMemo(id);
            if (request !== memoLoadRequest) return;
            originalMemo.value = String(row?.memo || '');
            memoDraft.value = originalMemo.value;
        } catch {
            if (request === memoLoadRequest) memoError.value = 'Could not load the existing VRCX memo.';
        } finally {
            if (request === memoLoadRequest) memoLoading.value = false;
        }
    }, { immediate: true });

    async function saveMemo() {
        if (memoSaving.value || memoLoading.value || !memoChanged.value) return;
        const id = props.userId;
        const value = memoDraft.value.slice(0, 1500);
        memoSaving.value = true;
        memoError.value = '';
        try {
            await saveUserMemo(id, value);
            if (props.userId === id) originalMemo.value = value;
        } catch {
            if (props.userId === id) memoError.value = 'Could not save the private memo. Please retry.';
        } finally {
            memoSaving.value = false;
        }
    }
    async function addTag() {
        tagError.value = '';
        try {
            await tagStore.add(props.userId, newTag.value);
            newTag.value = '';
        } catch (err) {
            tagError.value = err instanceof Error ? err.message : 'Could not save tag.';
        }
    }
    async function removeTag(tag) {
        tagError.value = '';
        try { await tagStore.remove(props.userId, tag); }
        catch { tagError.value = 'Could not remove the tag.'; }
    }
    function displayDate(raw) {
        const date = new Date(raw);
        return Number.isFinite(date.getTime()) ? date.toLocaleDateString() : 'Unknown';
    }

    onMounted(() => {
        void tagStore.load();
        void crew.refresh();
    });
</script>
