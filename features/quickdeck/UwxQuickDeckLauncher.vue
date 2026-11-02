<template>
    <div class="uwx-quickdeck-launcher">
        <div class="uwx-quickdeck-launcher-text">
            <span class="uwx-quickdeck-eyebrow">DESKTOP COMPANION</span>
            <strong>UWX QuickDeck</strong>
            <small>Keep your shortcuts and live session summary in a compact, independent Windows window.</small>
        </div>
        <div class="uwx-quickdeck-launcher-actions">
            <Button size="sm" variant="outline" :disabled="opening || !available" @click="openQuickDeck">
                <i class="ri-layout-grid-line" />
                {{ opening ? 'Opening…' : 'Open QuickDeck' }}
            </Button>
            <small v-if="!available">Native QuickDeck is available on the UWX Windows desktop build.</small>
            <small v-if="error" role="alert" class="uwx-quickdeck-error">{{ error }}</small>
        </div>
    </div>
</template>
<script setup>
    import { ref } from 'vue';
    import { Button } from '@/components/ui/button';
    const available = !LINUX && typeof AppApi !== 'undefined' && typeof AppApi.ShowUwxQuickDeck === 'function';
    const opening = ref(false);
    const error = ref('');
    async function openQuickDeck() {
        if (!available || opening.value) return;
        error.value='';
        opening.value=true;
        try { await Promise.resolve(AppApi.ShowUwxQuickDeck()); }
        catch { error.value='The native QuickDeck window could not be opened. Check the Windows app build.'; }
        finally { opening.value=false; }
    }
</script>
