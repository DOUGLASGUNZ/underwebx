<template>
    <Card class="uwx-card uwx-card-wide uwx-look-studio">
        <CardHeader>
            <div class="uwx-look-head">
                <div>
                    <div class="uwx-look-eyebrow">PERSONALIZE YOUR SPACE</div>
                    <CardTitle>Look Studio</CardTitle>
                    <CardDescription>Give UWX your own personality. Looks update instantly and stay on this PC.</CardDescription>
                </div>
                <Button variant="outline" size="sm" @click="resetLook">Reset look</Button>
            </div>
        </CardHeader>
        <CardContent>
            <div class="uwx-look-group-label">Choose a starting look</div>
            <div class="uwx-look-presets">
                <button
                    v-for="preset in LOOK_PRESETS"
                    :key="preset.id"
                    type="button"
                    class="uwx-look-preset"
                    :class="{ selected: look.preset === preset.id }"
                    :style="{ '--look-accent': preset.accent }"
                    :aria-pressed="look.preset === preset.id"
                    @click="selectPreset(preset.id)">
                    <span class="uwx-look-preview" aria-hidden="true">
                        <span class="uwx-look-preview-nav" />
                        <span class="uwx-look-preview-body">
                            <span /><span /><span />
                        </span>
                    </span>
                    <strong>{{ preset.label }}</strong>
                    <small>{{ preset.subtitle }}</small>
                    <span v-if="look.preset === preset.id" class="uwx-look-selected">Selected</span>
                </button>
            </div>

            <div class="uwx-look-grid">
                <fieldset class="uwx-look-option">
                    <legend>Spacing</legend>
                    <p>Choose how much information fits on screen.</p>
                    <div class="uwx-look-choices">
                        <button v-for="item in densityOptions" :key="item.id" type="button"
                            :class="{ selected: look.density === item.id }"
                            :aria-pressed="look.density === item.id"
                            @click="setOption('density', item.id)">{{ item.label }}</button>
                    </div>
                </fieldset>
                <fieldset class="uwx-look-option">
                    <legend>Corner style</legend>
                    <p>Give panels and buttons a softer or sharper shape.</p>
                    <div class="uwx-look-choices">
                        <button v-for="item in cornerOptions" :key="item.id" type="button"
                            :class="{ selected: look.corners === item.id }"
                            :aria-pressed="look.corners === item.id"
                            @click="setOption('corners', item.id)">{{ item.label }}</button>
                    </div>
                </fieldset>
                <fieldset class="uwx-look-option">
                    <legend>Surface finish</legend>
                    <p>Solid for speed, glass for extra atmosphere.</p>
                    <div class="uwx-look-choices">
                        <button v-for="item in surfaceOptions" :key="item.id" type="button"
                            :class="{ selected: look.surface === item.id }"
                            :aria-pressed="look.surface === item.id"
                            @click="setOption('surface', item.id)">{{ item.label }}</button>
                    </div>
                </fieldset>
                <fieldset class="uwx-look-option">
                    <legend>Motion</legend>
                    <p>Reduce extra transitions and decorative motion.</p>
                    <div class="uwx-look-choices">
                        <button v-for="item in motionOptions" :key="item.id" type="button"
                            :class="{ selected: look.motion === item.id }"
                            :aria-pressed="look.motion === item.id"
                            @click="setOption('motion', item.id)">{{ item.label }}</button>
                    </div>
                </fieldset>
            </div>
            <div class="uwx-look-footnote">
                Accent color and background tint are still controlled by Appearance above. Look presets set both, but never touch your VRChat login, friends, history, OSC settings, or UnderWeb account.
            </div>
        </CardContent>
    </Card>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

    import { LOOK_PRESETS } from '../../shared/utils/uwxLook';
    import { useUwxLookStore } from '../../stores/uwxLook';

    const store = useUwxLookStore();
    const { look } = storeToRefs(store);
    const { selectPreset, setOption, resetLook } = store;

    const densityOptions = [{ id: 'comfortable', label: 'Comfortable' }, { id: 'compact', label: 'Compact' }];
    const cornerOptions = [{ id: 'sharp', label: 'Sharp' }, { id: 'soft', label: 'Soft' }, { id: 'rounded', label: 'Rounded' }];
    const surfaceOptions = [{ id: 'solid', label: 'Solid' }, { id: 'glass', label: 'Glass' }];
    const motionOptions = [{ id: 'system', label: 'System' }, { id: 'reduce', label: 'Reduce' }];
</script>
