import { describe, expect, it } from 'vitest';
import {
    normalizeOscScene, normalizeOscSceneLibrary, captureOscScene, saveOscScene,
    deleteOscScene, applyOscSceneToSettings, sceneMatchesSettings
} from '../uwxOscScenes';
import { CHATBOX_THEMES, CHATBOX_MAX_CHARS, CHATBOX_MAX_LINES, fitChatbox, normalizeSettings, renderModuleLines } from '../uwxOsc';

const data = {
    media: { title: 'Midnight Signal', artist: 'Darko', status: 'Playing', positionSeconds: 76, durationSeconds: 201, sampledAt: 0 },
    weather: { icon: '🌙', temp: '50°F', condition: 'Clear' },
    status: 'Movie Night', heartRate: 84, world: 'UnderWeb Hub'
};
const SETTINGS = normalizeSettings({
    enabled: true, statuses: [{ id: 'secret-status', text: 'Private note' }],
    modules: { weather: { zip: '49201', enabled: true }, music: { enabled: true }, status: { enabled: true } }
});

describe('OSC Cosmetic Pack 1 and Scene Switcher', () => {
    it('adds three unique cosmetic themes to the existing six presets', () => {
        for (const id of ['void-os', 'cassette-club', 'midnight-fm']) {
            const theme = CHATBOX_THEMES.find(t => t.id === id);
            expect(theme).toBeTruthy();
            expect(Object.keys(theme.templates).sort()).toEqual(['heart','music','status','weather','world']);
            const settings = normalizeSettings({ ...SETTINGS, frame: theme.frame,
                modules: Object.fromEntries(Object.entries(SETTINGS.modules).map(([key, value]) =>
                    [key, { ...value, enabled:true, template:theme.templates[key] }])) });
            const fitted = fitChatbox(renderModuleLines(settings, data, 0));
            expect(Array.from(fitted.text).length).toBeLessThanOrEqual(CHATBOX_MAX_CHARS);
            expect(fitted.text.split('\n').length).toBeLessThanOrEqual(CHATBOX_MAX_LINES);
            expect(fitted.text).toContain('Midnight');
        }
    });
    it('captures only safe presentation data and never stores statuses/ZIP/sending state', () => {
        const scene = captureOscScene(SETTINGS, ' DJ Night ', 'osc-scene-test-1');
        const serialized = JSON.stringify(scene);
        expect(scene.name).toBe('DJ Night');
        expect(serialized).not.toContain('49201');
        expect(serialized).not.toContain('secret-status');
        expect(serialized).not.toContain('Private note');
        expect(serialized).not.toContain('"enabled":true,"statuses"');
        expect(scene.modules.music.enabled).toBe(true);
    });
    it('applies scenes without enabling the OSC sender or changing sensitive settings', () => {
        const original = normalizeSettings({ ...SETTINGS, enabled:false });
        const scene = captureOscScene(SETTINGS, 'DJ', 'osc-scene-test-2');
        scene.modules.music.enabled = false;
        scene.frame.header = '◉ Midnight FM';
        const applied = applyOscSceneToSettings(original, scene);
        expect(applied.enabled).toBe(false);
        expect(applied.statuses).toEqual(original.statuses);
        expect(applied.modules.weather.zip).toBe('49201');
        expect(applied.modules.music.enabled).toBe(false);
        expect(applied.frame.header).toBe('◉ Midnight FM');
        expect(original.modules.music.enabled).toBe(true);
        expect(sceneMatchesSettings(scene, applied)).toBe(true);
        expect(sceneMatchesSettings(scene, original)).toBe(false);
    });
    it('normalizes malicious, duplicate, invalid and excessive scene libraries', () => {
        const scene = captureOscScene(SETTINGS, 'DJ', 'osc-scene-test-3');
        expect(normalizeOscScene({ ...scene, id:'__proto__' })).toBeNull();
        expect(normalizeOscScene({ ...scene, modules:null })).toBeNull();
        expect(normalizeOscSceneLibrary([scene, scene, { id:'bogus' }])).toHaveLength(1);
        expect(normalizeOscSceneLibrary(Array.from({length:30},(_,i)=>({ ...scene, id:'osc-scene-'+i })))).toHaveLength(8);
        expect(normalizeOscScene({ ...scene, name:'\nA'.repeat(60) }).name.length).toBeLessThanOrEqual(30);
        expect(normalizeOscScene({ ...scene, frame:{header:'H'.repeat(999)} }).frame.header.length).toBe(40);
    });
    it('supports replacement by name, scene deletion, and count bounds', () => {
        const scene = captureOscScene(SETTINGS, 'Social', 'osc-scene-test-4');
        const list = saveOscScene([], scene);
        expect(saveOscScene(list, { ...scene, id:'osc-scene-test-5', name:'social' })).toHaveLength(1);
        expect(deleteOscScene(list, scene.id)).toEqual([]);
        const full = Array.from({length:8},(_,i)=>({ ...scene, id:'osc-scene-'+i, name:'s'+i }));
        expect(() => saveOscScene(full, { ...scene, name:'Extra', id:'osc-scene-test-9' })).toThrow();
    });
});
