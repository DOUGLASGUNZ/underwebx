<template>
    <section class="uwx-home-editor" :class="{ expanded: editing }" aria-label="UWX Home dashboard customization">
        <header class="uwx-home-header">
            <div>
                <strong>My Home</strong>
                <span>Arrange the existing live overview cards. No additional VRChat requests.</span>
            </div>
            <Button size="sm" variant="outline" :aria-expanded="editing" @click="editing = !editing">
                <i :class="editing ? 'ri-check-line' : 'ri-layout-grid-line'" />
                {{ editing ? 'Done' : 'Customize home' }}
            </Button>
        </header>
        <div v-if="editing" class="uwx-home-edit-panel">
            <p class="uwx-home-instruction">Drag items to reorder, or use the arrow buttons. Uncheck a card to hide it.</p>
            <div class="uwx-home-items">
                <div
                    v-for="(tile, index) in orderedTiles"
                    :key="tile.id"
                    class="uwx-home-item"
                    :class="{ dragging: draggingId === tile.id }"
                    draggable="true"
                    @dragstart="onDragStart($event, tile.id)"
                    @dragover.prevent
                    @drop.prevent="onDrop(tile.id)"
                    @dragend="onDragEnd">
                    <span class="uwx-home-grip" aria-hidden="true"><i class="ri-draggable" /></span>
                    <label>
                        <input type="checkbox" :checked="!layout.hidden.includes(tile.id)" @change="setVisible(tile.id, $event.target.checked)" />
                        <span>
                            <strong>{{ tile.label }}</strong>
                            <small>{{ tile.description }}</small>
                        </span>
                    </label>
                    <div class="uwx-home-arrows">
                        <button type="button" :disabled="index === 0" :aria-label="'Move ' + tile.label + ' up'" @click="move(tile.id, -1)">
                            <i class="ri-arrow-up-s-line" />
                        </button>
                        <button type="button" :disabled="index === orderedTiles.length - 1" :aria-label="'Move ' + tile.label + ' down'" @click="move(tile.id, 1)">
                            <i class="ri-arrow-down-s-line" />
                        </button>
                    </div>
                </div>
            </div>
            <div class="uwx-home-edit-footer">
                <span>Saved automatically on this PC.</span>
                <Button variant="outline" size="sm" @click="restore">Reset home</Button>
            </div>
        </div>
        <p v-if="!hasVisibleTiles" class="uwx-home-empty">
            You've hidden every overview card. Use <b>Customize home</b> to show one again, or choose Reset home.
        </p>
    </section>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { Button } from '@/components/ui/button';
    import { HOME_TILES } from '../../shared/utils/uwxHome';
    import { useUwxHomeStore } from '../../stores/uwxHome';

    const store = useUwxHomeStore();
    const { layout } = storeToRefs(store);
    const { setVisible, move, dragBefore, restore } = store;
    const editing = ref(false);
    const draggingId = ref('');
    const orderedTiles = computed(() => layout.value.order.map(id => HOME_TILES.find(t => t.id === id)).filter(Boolean));
    const hasVisibleTiles = computed(() => layout.value.order.some(id => !layout.value.hidden.includes(id)));
    function onDragStart(event, id) {
        draggingId.value = id;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', id);
        }
    }
    function onDrop(id) {
        if (draggingId.value) dragBefore(draggingId.value, id);
        draggingId.value = '';
    }
    function onDragEnd() { draggingId.value = ''; }
</script>
