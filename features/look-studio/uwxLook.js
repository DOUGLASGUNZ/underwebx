// UWX Layout & Appearance Studio — additive display settings only.
// The existing UWX theme engine exclusively owns accent colors and tints.
export const DEFAULT_LAYOUT = Object.freeze({
    density: 'comfortable',
    corners: 'soft',
    surface: 'solid',
    motion: 'system',
    type: 'default',
    backdrop: 'none',
    imageData: ''
});

export const LAYOUT_OPTIONS = Object.freeze({
    density: ['comfortable', 'compact'],
    corners: ['sharp', 'soft', 'rounded'],
    surface: ['solid', 'glass'],
    motion: ['system', 'reduce'],
    type: ['small', 'default', 'large'],
    backdrop: ['none', 'ambient', 'grid', 'image']
});

// Prevent remote tracking URLs, CSS injection, and oversized imported images.
// Max 1.5 MB source file -> roughly 2 MB data URL.
export const MAX_IMAGE_BYTES = 1_500_000;
export const MAX_IMAGE_DATA_LENGTH = 2_100_000;
const IMAGE_DATA_URL = /^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/]+={0,2}$/;

export function isSafeImageData(data) {
    return typeof data === 'string' &&
        data.length <= MAX_IMAGE_DATA_LENGTH &&
        IMAGE_DATA_URL.test(data);
}

export function normalizeLayout(raw) {
    const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const layout = { ...DEFAULT_LAYOUT };
    for (const key of Object.keys(LAYOUT_OPTIONS)) {
        if (LAYOUT_OPTIONS[key].includes(input[key])) layout[key] = input[key];
    }
    if (isSafeImageData(input.imageData)) layout.imageData = input.imageData;
    if (layout.backdrop === 'image' && !layout.imageData) layout.backdrop = 'none';
    return layout;
}

export function changeLayoutOption(original, key, value) {
    if (!Object.hasOwn(LAYOUT_OPTIONS, key) || !LAYOUT_OPTIONS[key].includes(value)) {
        throw new Error('Invalid layout option');
    }
    const next = { ...normalizeLayout(original), [key]: value };
    return normalizeLayout(next);
}

export function withLocalImage(original, imageData) {
    if (!isSafeImageData(imageData)) throw new Error('Choose a PNG, JPEG, or WebP image below 1.5 MB.');
    return normalizeLayout({ ...normalizeLayout(original), imageData, backdrop: 'image' });
}

export function withoutLocalImage(original) {
    return normalizeLayout({ ...normalizeLayout(original), imageData: '', backdrop: 'none' });
}
