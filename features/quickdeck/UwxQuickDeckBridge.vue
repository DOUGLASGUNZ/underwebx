<template></template>
<script setup>
    // QuickDeck reuses the *already running* UWX stores. No extra VRChat session.
    import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
    import { useRouter } from 'vue-router';
    import { useFriendStore } from '../../stores/friend';
    import { useLocationStore } from '../../stores/location';
    import { watchState } from '../../services/watchState';
    import { countOnlineFriends, quickDeckWorldLabel, normalizeQuickDeckRoute } from '../../shared/utils/uwxQuickDeck';

    const friendStore = useFriendStore();
    const locationStore = useLocationStore();
    const router = useRouter();

    const onlineCount = computed(() => watchState.isLoggedIn ? countOnlineFriends(friendStore.friends) : 0);
    const currentWorld = computed(() => watchState.isLoggedIn
        ? quickDeckWorldLabel(locationStore.lastLocation) : '');

    function sendSnapshot() {
        if (LINUX || typeof AppApi === 'undefined' || typeof AppApi.UpdateUwxQuickDeckSummary !== 'function') return;
        try {
            // Native method only reads supplied values; no API calls.
            Promise.resolve(AppApi.UpdateUwxQuickDeckSummary(onlineCount.value, currentWorld.value)).catch(() => {});
        } catch { /* Native QuickDeck is optional and cannot interfere with login. */ }
    }
    const stop = watch([onlineCount, currentWorld], sendSnapshot, { immediate: true });
    function navigate(event) {
        if (!watchState.isLoggedIn) return;
        const route = normalizeQuickDeckRoute(event?.detail);
        if (route) void router.push({ name: route }).catch(() => {});
    }
    onMounted(() => window.addEventListener('uwx-quickdeck-navigate', navigate));
    onBeforeUnmount(() => {
        window.removeEventListener('uwx-quickdeck-navigate', navigate);
        stop();
    });
</script>
