<template>
    <Card class="uwx-card uwx-card-wide uwx-osc-scenes">
        <CardHeader>
            <div class="uwx-osc-scenes-header">
                <div>
                    <CardTitle>Scene Switcher</CardTitle>
                    <CardDescription>Save a complete chatbox look and swap it whenever you want—without changing your statuses or turning broadcasting on.</CardDescription>
                </div>
                <span class="uwx-osc-scenes-count">{{ scenes.length }} / 8 saved locally</span>
            </div>
        </CardHeader>
        <CardContent class="space-y-4">
            <div class="uwx-osc-scene-create">
                <label for="uwx-scene-name">Save the current modules, order, templates and frame as a scene</label>
                <form class="uwx-osc-scene-form" @submit.prevent="saveScene">
                    <Input id="uwx-scene-name" v-model="name" maxlength="30" :disabled="!loaded || saving"
                        placeholder="e.g. DJ Set, Low-Key, Movie Night" />
                    <Button type="submit" size="sm" variant="outline" :disabled="!loaded || saving || !name.trim()">
                        <i class="ri-save-3-line" />
                        {{ matching ? 'Replace scene' : 'Save scene' }}
                    </Button>
                </form>
                <p v-if="matching" class="uwx-osc-scene-hint">A scene named “{{ matching.name }}” already exists. Saving will replace its saved layout.</p>
            </div>
            <p v-if="!loaded && !loadError" role="status" class="uwx-osc-scene-hint">Reading your saved local scenes…</p>
            <p v-if="loadError || saveError" role="alert" class="uwx-osc-scene-error">{{ loadError || saveError }}</p>
            <p v-if="message" role="status" class="uwx-osc-scene-success">{{ message }}</p>
            <div v-if="loaded && !scenes.length" class="uwx-osc-scenes-empty">
                No scenes saved yet. Try VOID.OS, Cassette Club or Midnight FM above, adjust the modules, then save the result here.
            </div>
            <div v-else-if="loaded" class="uwx-osc-scenes-list">
                <div v-for="scene in scenes" :key="scene.id" class="uwx-osc-scene-item">
                    <div class="uwx-osc-scene-top">
                        <div class="uwx-osc-scene-info">
                            <strong>{{ scene.name }}</strong>
                            <span>{{ sceneMatchesSettings(scene, settings) ? 'Current layout' : 'Saved look' }}</span>
                        </div>
                        <div class="uwx-osc-scene-buttons">
                            <Button size="sm" variant="outline" :disabled="saving || sceneMatchesSettings(scene, settings)"
                                @click="useScene(scene)">Apply</Button>
                            <Button size="sm" variant="ghost" :disabled="saving"
                                :aria-label="deleteCandidate === scene.id ? 'Confirm deletion of ' + scene.name : 'Delete ' + scene.name"
                                @click="removeScene(scene)">
                                {{ deleteCandidate === scene.id ? 'Confirm delete' : 'Delete' }}
                            </Button>
                        </div>
                    </div>
                    <pre class="uwx-osc-scene-preview">{{ previewScene(scene) }}</pre>
                </div>
            </div>
            <p class="uwx-osc-scene-hint">Scenes are private to this PC. They store layout and on/off choices—not your status texts, weather ZIP, heart-rate credentials, or account data. Your OSC master switch stays as it is.</p>
        </CardContent>
    </Card>
</template>

<script setup>
    import { computed, onMounted, ref } from 'vue';
    import { storeToRefs } from 'pinia';
    import configRepository from '../../services/config';
    import { useOscLabStore } from '../../stores';
    import { fitChatbox, renderModuleLines } from '../../shared/utils/uwxOsc';
    import {
        applyOscSceneToSettings, captureOscScene, deleteOscScene,
        normalizeOscSceneLibrary, saveOscScene, sceneMatchesSettings
    } from '../../shared/utils/uwxOscScenes';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

    const KEY='UWX_oscScenes_v1';
    const osc=useOscLabStore();
    const { settings }=storeToRefs(osc);
    const scenes=ref([]);
    const name=ref('');
    const loaded=ref(false);
    const saving=ref(false);
    const loadError=ref('');
    const saveError=ref('');
    const message=ref('');
    const deleteCandidate=ref('');

    const matching=computed(()=>scenes.value.find(s=>s.name.toLocaleLowerCase()===name.value.trim().toLocaleLowerCase())||null);
    const SAMPLE=Object.freeze({
        media: { title:'Midnight Signal', artist:'Darko', status:'Playing', positionSeconds:75, durationSeconds:200, sampledAt:0 },
        weather: { icon:'☁', temp:'54°F', condition:'Cloudy' },
        status: 'Movie Night', heartRate:88, world:'UnderWeb Hub'
    });
    async function load() {
        try {
            const data=await configRepository.getString(KEY,'[]');
            if (data && data.length > 160000) throw new Error('oversized');
            const parsed=JSON.parse(data || '[]');
            if (!Array.isArray(parsed)) throw new Error('not an array');
            scenes.value=normalizeOscSceneLibrary(parsed);
            loaded.value=true;
        } catch {
            loadError.value='Could not read your saved scenes. No changes will be written until the storage is repaired.';
            loaded.value=false;
        }
    }
    async function persist(next) {
        if (!loaded.value || saving.value) return false;
        saving.value=true;
        saveError.value='';
        message.value='';
        try {
            await configRepository.setString(KEY, JSON.stringify(next));
            scenes.value=next;
            return true;
        } catch {
            saveError.value='Could not save the scene library locally. Your existing scenes were not replaced.';
            return false;
        } finally { saving.value=false; }
    }
    async function saveScene() {
        if (!loaded.value || saving.value) return;
        saveError.value='';
        const id=matching.value?.id || ('osc-scene-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8));
        try {
            const scene=captureOscScene(settings.value,name.value,id);
            const next=saveOscScene(scenes.value,scene);
            if(await persist(next)) {
                name.value='';
                deleteCandidate.value='';
                message.value='Scene saved on this PC.';
            }
        } catch(e) { saveError.value=e instanceof Error ? e.message : 'Invalid scene.'; }
    }
    function useScene(scene) {
        if (!loaded.value || saving.value) return;
        saveError.value='';
        const applied=osc.applyOscScene(scene);
        if (!applied) { saveError.value='The scene could not be applied.'; return; }
        message.value='Scene applied. OSC sending remains '+(settings.value.enabled ? 'on' : 'off')+'.';
        deleteCandidate.value='';
    }
    async function removeScene(scene) {
        if (saving.value) return;
        if(deleteCandidate.value!==scene.id) {
            deleteCandidate.value=scene.id;
            message.value='Click Confirm delete on “'+scene.name+'” to remove it.';
            return;
        }
        if(await persist(deleteOscScene(scenes.value,scene.id))) {
            deleteCandidate.value='';
            message.value='Scene deleted from this PC.';
        }
    }
    function previewScene(scene) {
        try {
            const staged=applyOscSceneToSettings(settings.value,scene);
            if(!staged) return 'Invalid saved layout';
            return fitChatbox(renderModuleLines(staged,SAMPLE,0)).text || '(No visible module selected)';
        } catch { return 'Preview unavailable'; }
    }
    onMounted(load);
</script>
