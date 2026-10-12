// Pure chatbox composition shared by the UWX client and build-time tests.
// VRChat chatbox permits 144 UTF-16 characters; keep all enabled core lines visible.
const LIMIT = 144;
const normalize = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

export function clipOscLine(value, maxLength) {
    const text = normalize(value);
    if (text.length <= maxLength) return text;
    if (maxLength <= 1) return '…'.slice(0, maxLength);
    let output = '';
    for (const point of text) {
        if ((output + point + '…').length > maxLength) break;
        output += point;
    }
    return output.trimEnd() + '…';
}

export function renderCombinedOsc({
    status = '',
    title = '',
    artist = '',
    time = '',
    temperature = '',
    condition = '',
    isPlaying = false,
    enabled = {}
} = {}) {
    const lines = [];
    if (enabled.status !== false) {
        const statusText = normalize(status) || 'No status set';
        lines.push(clipOscLine('🕷 ' + statusText, 42));
    }
    if (enabled.music !== false) {
        const description = isPlaying && normalize(title)
            ? [normalize(title) + (normalize(artist) ? ' — ' + normalize(artist) : ''), normalize(time)].filter(Boolean).join(' · ')
            : 'Not playing';
        lines.push(clipOscLine('🎵 ' + description, 73));
    }
    if (enabled.weather !== false) {
        const weatherText = [normalize(temperature), normalize(condition)].filter(Boolean).join(' · ') || 'Weather unavailable';
        lines.push(clipOscLine('🌤 ' + weatherText, 25));
    }
    // 42 + 73 + 25 + 2 newlines = 142 UTF-16 code units at most.
    const text = lines.join('\n');
    if (text.length > LIMIT) throw new Error('Combined OSC exceeded the 144-character limit.');
    return text;
}
