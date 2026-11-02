import { describe, expect, it } from 'vitest';
import { DEFAULT_LAYOUT, LAYOUT_OPTIONS, MAX_IMAGE_DATA_LENGTH, changeLayoutOption, isSafeImageData, normalizeLayout, withLocalImage, withoutLocalImage } from '../uwxLook';

const TEST_IMAGE = 'data:image/png;base64,' + Buffer.from('local-sample').toString('base64');

describe('UWX Layout Studio', () => {
    it('defaults are independent of existing color themes', () => {
        expect(normalizeLayout(null)).toEqual(DEFAULT_LAYOUT);
        expect(Object.keys(DEFAULT_LAYOUT)).not.toContain('accent');
        expect(Object.keys(DEFAULT_LAYOUT)).not.toContain('preset');
    });

    it('only persists enumerated presentation options', () => {
        const settings = normalizeLayout({
            density: 'compact',
            corners: 'rounded',
            surface: 'glass',
            motion: 'reduce',
            type: 'large',
            backdrop: 'ambient',
            cookie: 'sensitive',
            color: '#ff0000'
        });
        expect(settings).toMatchObject({ density: 'compact', corners: 'rounded', surface: 'glass', motion: 'reduce', type: 'large', backdrop: 'ambient' });
        expect(Object.keys(settings).sort()).toEqual(Object.keys(DEFAULT_LAYOUT).sort());
    });

    it('rejects malformed options and does not change the original', () => {
        const original = { ...DEFAULT_LAYOUT };
        expect(changeLayoutOption(original, 'density', 'compact').density).toBe('compact');
        expect(original).toEqual(DEFAULT_LAYOUT);
        expect(() => changeLayoutOption(original, 'theme', 'blood')).toThrow();
        expect(() => changeLayoutOption(original, 'motion', 'javascript:foo')).toThrow();
        for (const [key, values] of Object.entries(LAYOUT_OPTIONS)) {
            for (const value of values) {
                const result = changeLayoutOption(original, key, value);
                expect(result[key] === value || (key === 'backdrop' && value === 'image' && result.backdrop === 'none')).toBe(true);
            }
        }
    });

    it('accepts local data images, rejects remote URLs and CSS injection', () => {
        expect(isSafeImageData(TEST_IMAGE)).toBe(true);
        expect(isSafeImageData('https://example.org/tracker.png')).toBe(false);
        expect(isSafeImageData('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
        expect(isSafeImageData('data:image/jpeg;base64,bad");color:red')).toBe(false);
        expect(isSafeImageData('data:image/webp;base64,' + 'A'.repeat(MAX_IMAGE_DATA_LENGTH))).toBe(false);
        const selected = withLocalImage(DEFAULT_LAYOUT, TEST_IMAGE);
        expect(selected.backdrop).toBe('image');
        expect(selected.imageData).toBe(TEST_IMAGE);
        expect(withoutLocalImage(selected)).toEqual(DEFAULT_LAYOUT);
    });

    it('falls back to plain background if imported image is missing', () => {
        expect(normalizeLayout({ backdrop: 'image', imageData: '' }).backdrop).toBe('none');
    });
});
