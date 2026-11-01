// UWX Look Studio: original, local-only presentation presets.
// Independent from VRChat authentication, user data, and the existing accent-color engine.
export const LOOK_PRESETS = Object.freeze([
    { id: 'underweb', label: 'UnderWeb', subtitle: 'Our signature look', accent: '#3df514', color: 'underweb', tint: 'subtle', density: 'comfortable', corners: 'soft', surface: 'solid', motion: 'system' },
    { id: 'void', label: 'The Void', subtitle: 'Low light, violet glow', accent: '#a855f7', color: 'violet', tint: 'none', density: 'comfortable', corners: 'soft', surface: 'glass', motion: 'system' },
    { id: 'cyber', label: 'Cyberline', subtitle: 'Compact blue precision', accent: '#38bdf8', color: 'ice', tint: 'subtle', density: 'compact', corners: 'sharp', surface: 'solid', motion: 'system' },
    { id: 'ember', label: 'Blood Moon', subtitle: 'Warm and cinematic', accent: '#ff3b3b', color: 'blood', tint: 'subtle', density: 'comfortable', corners: 'soft', surface: 'glass', motion: 'system' },
    { id: 'minimal', label: 'Minimal', subtitle: 'Nothing but the essentials', accent: '#d4d4d8', color: 'mono', tint: 'none', density: 'compact', corners: 'sharp', surface: 'solid', motion: 'reduce' },
    { id: 'angel', label: 'Angel Engine', subtitle: 'Soft light, hard edges', accent: '#fbbf24', color: 'gold', tint: 'none', density: 'comfortable', corners: 'rounded', surface: 'glass', motion: 'system' }
]);

export const DEFAULT_LOOK = Object.freeze({
    preset: 'underweb',
    density: 'comfortable',
    corners: 'soft',
    surface: 'solid',
    motion: 'system'
});

const options = Object.freeze({
    density: ['comfortable', 'compact'],
    corners: ['soft', 'sharp', 'rounded'],
    surface: ['solid', 'glass'],
    motion: ['system', 'reduce']
});

export function normalizeLook(raw) {
    const value = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const out = { ...DEFAULT_LOOK };
    out.preset = LOOK_PRESETS.some((preset) => preset.id === value.preset) ? value.preset : 'custom';
    if (!raw) out.preset = DEFAULT_LOOK.preset;
    for (const key of Object.keys(options)) {
        out[key] = options[key].includes(value[key]) ? value[key] : DEFAULT_LOOK[key];
    }
    return out;
}

export function lookFromPreset(id) {
    const preset = LOOK_PRESETS.find((p) => p.id === id);
    if (!preset) throw new Error('Unknown look preset');
    return {
        preset: preset.id,
        density: preset.density,
        corners: preset.corners,
        surface: preset.surface,
        motion: preset.motion
    };
}

export function withLookOption(look, key, value) {
    if (!Object.hasOwn(options, key) || !options[key].includes(value)) {
        throw new Error('Invalid look option');
    }
    return normalizeLook({ ...look, preset: 'custom', [key]: value });
}
