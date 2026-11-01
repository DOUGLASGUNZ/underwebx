import { describe, expect, test } from 'vitest';
import { DEFAULT_LOOK, LOOK_PRESETS, lookFromPreset, normalizeLook, withLookOption } from '../uwxLook';

describe('UWX Look Studio', () => {
    test('loads comfortable UnderWeb style by default', () => {
        expect(normalizeLook(null)).toEqual(DEFAULT_LOOK);
    });

    test('keeps preset identifiers and all their styles valid', () => {
        const ids = new Set();
        for (const preset of LOOK_PRESETS) {
            expect(ids.has(preset.id)).toBe(false);
            ids.add(preset.id);
            expect(normalizeLook(lookFromPreset(preset.id))).toEqual(lookFromPreset(preset.id));
            expect(preset.accent).toMatch(/^#[0-9a-f]{6}$/i);
        }
    });

    test('drops malicious or unknown saved properties rather than injecting CSS', () => {
        const look = normalizeLook({
            preset: 'anything',
            density: 'compact; color: red',
            corners: 'evil',
            surface: 'url(https://invalid.test)',
            motion: '__proto__',
            unknown: 'bad'
        });
        expect(look).toEqual({ ...DEFAULT_LOOK, preset: 'custom' });
        expect(Object.hasOwn(look, 'unknown')).toBe(false);
    });

    test('user changes only a local presentation property', () => {
        const original = lookFromPreset('void');
        const result = withLookOption(original, 'density', 'compact');
        expect(result).toEqual({ ...original, preset: 'custom', density: 'compact' });
        expect(original.density).toBe('comfortable');
        expect(() => withLookOption(original, 'cookie', 'token')).toThrow();
    });
});
