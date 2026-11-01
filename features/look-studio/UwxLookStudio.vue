<template>
    <Card class="uwx-card uwx-card-wide uwx-layout-studio">
        <CardHeader>
            <div class="uwx-layout-head">
                <div>
                    <div class="uwx-layout-eyebrow">MAKE UWX YOURS</div>
                    <CardTitle>Layout &amp; Appearance Studio</CardTitle>
                    <CardDescription>Customize how UWX feels. Your existing accent colors and chatbox themes stay exactly where they are.</CardDescription>
                </div>
                <Button variant="outline" size="sm" @click="resetLayout">Restore layout defaults</Button>
            </div>
        </CardHeader>
        <CardContent>
            <div class="uwx-layout-topline">
                <strong>Interface settings</strong>
                <span>Changes apply immediately · saved on this PC</span>
            </div>

            <div class="uwx-layout-grid">
                <fieldset v-for="setting in settings" :key="setting.key" class="uwx-layout-option">
                    <legend>{{ setting.title }}</legend>
                    <p>{{ setting.description }}</p>
                    <div class="uwx-layout-choices">
                        <button v-for="choice in setting.options" :key="choice.id" type="button"
                            :class="{ selected: layout[setting.key] === choice.id }"
                            :aria-pressed="layout[setting.key] === choice.id"
                            @click="setOption(setting.key, choice.id)">
                            {{ choice.label }}
                        </button>
                    </div>
                </fieldset>
            </div>

            <div class="uwx-layout-section">
                <div class="uwx-layout-topline">
                    <strong>Personal background</strong>
                    <span>Local only · no remote tracking or uploads</span>
                </div>
                <div class="uwx-layout-choices">
                    <button v-for="background in backgrounds" :key="background.id" type="button"
                        :class="{ selected: layout.backdrop === background.id }"
                        :aria-pressed="layout.backdrop === background.id"
                        :disabled="background.id === 'image' && !layout.imageData"
                        @click="setOption('backdrop', background.id)">
                        {{ background.label }}
                    </button>
                </div>
                <div class="uwx-layout-wallpaper-controls">
                    <input ref="imageInput" type="file" accept="image/png,image/jpeg,image/webp" class="uwx-layout-file"
                        aria-label="Choose a local desktop background image" @change="onSelectImage" />
                    <Button size="sm" variant="outline" :disabled="readingImage" @click="openImagePicker">
                        {{ readingImage ? 'Reading image...' : (layout.imageData ? 'Replace local image' : 'Choose local image') }}
                    </Button>
                    <Button v-if="layout.imageData" size="sm" variant="outline" @click="clearImage">Remove image</Button>
                    <span>PNG, JPEG or WebP · max 1.5 MB</span>
                </div>
                <p v-if="imageError" class="uwx-layout-error" role="alert">{{ imageError }}</p>
                <p class="uwx-layout-helper">The background sits behind the main content, with a dark readability overlay. It stays on your PC and isn't sent to UnderWeb.cloud, VRChat or Discord.</p>
            </div>

            <div class="uwx-layout-preview" aria-hidden="true">
                <div class="uwx-layout-preview-sidebar">
                    <span>UWX</span><i /><i /><i />
                </div>
                <div class="uwx-layout-preview-content">
                    <strong>YOUR WORKSPACE</strong>
                    <div class="uwx-layout-preview-tiles"><span /><span /><span /></div>
                    <div class="uwx-layout-preview-lines"><i /><i /><i /></div>
                </div>
            </div>

            <div class="uwx-layout-footnote">
                <strong>Things you already have:</strong> UnderWeb Green, Blood Moon, Violet, Ice, Gold, Rose, Mono and custom accents remain in <b>Appearance</b>. You can still rearrange sidebar entries using UWX's existing sidebar editor. This studio deliberately doesn't replace those features.
            </div>
        </CardContent>
    </Card>
</template>

<script setup>
    import { ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { MAX_IMAGE_BYTES } from '../../shared/utils/uwxLook';
    import { useUwxLookStore } from '../../stores/uwxLook';

    const store = useUwxLookStore();
    const { layout } = storeToRefs(store);
    const { setOption, setImage, clearImage: clearLocalImage, resetLayout } = store;
    const imageInput = ref(null);
    const readingImage = ref(false);
    const imageError = ref('');

    const settings = [
        { key: 'density', title: 'Information density', description: 'Choose how much fits on screen.', options: [{ id: 'comfortable', label: 'Comfortable' }, { id: 'compact', label: 'Compact' }] },
        { key: 'type', title: 'Text size', description: 'Adjust overall interface scale.', options: [{ id: 'small', label: 'Small' }, { id: 'default', label: 'Normal' }, { id: 'large', label: 'Large' }] },
        { key: 'corners', title: 'Panel shape', description: 'Subtle, sharp, or rounded edges.', options: [{ id: 'sharp', label: 'Sharp' }, { id: 'soft', label: 'Soft' }, { id: 'rounded', label: 'Rounded' }] },
        { key: 'surface', title: 'Panel finish', description: 'Glass may use more GPU resources.', options: [{ id: 'solid', label: 'Solid' }, { id: 'glass', label: 'Glass' }] },
        { key: 'motion', title: 'Motion', description: 'Control decorative transitions.', options: [{ id: 'system', label: 'Use system preference' }, { id: 'reduce', label: 'Reduce' }] }
    ];
    const backgrounds = [
        { id: 'none', label: 'No background' },
        { id: 'ambient', label: 'Ambient glow' },
        { id: 'grid', label: 'Subtle grid' },
        { id: 'image', label: 'My image' }
    ];

    function openImagePicker() {
        imageError.value = '';
        imageInput.value?.click();
    }

    function clearImage() {
        imageError.value = '';
        clearLocalImage();
    }

    async function onSelectImage(event) {
        const input = /** @type {HTMLInputElement} */ (event.target);
        const file = input.files?.[0];
        input.value = ''; // Allow re-selecting the same filename.
        if (!file) return;
        imageError.value = '';
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > MAX_IMAGE_BYTES || !file.size) {
            imageError.value = 'Choose a PNG, JPEG or WebP image smaller than 1.5 MB.';
            return;
        }
        readingImage.value = true;
        try {
            const data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Could not open image.'));
                reader.readAsDataURL(file);
            });
            setImage(data);
        } catch (error) {
            imageError.value = error instanceof Error ? error.message : 'Could not save this image.';
        } finally {
            readingImage.value = false;
        }
    }
</script>
