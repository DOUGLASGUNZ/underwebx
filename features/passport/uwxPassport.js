// UWX Social Passport: validate personal, PC-local profile tags.
// Source of truth for notes is VRCX's existing SQLite user-memo store, NOT this file.
const USER_ID = /^usr_[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 24;
export const MAX_PEOPLE = 250;

export function validPassportUserId(userId) {
    return typeof userId === 'string' && USER_ID.test(userId);
}

export function cleanPassportTag(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/\s+/g, ' ').slice(0, MAX_TAG_LENGTH);
}

export function normalizePassportTags(raw) {
    const data = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const out = {};
    for (const [userId, values] of Object.entries(data).slice(0, MAX_PEOPLE)) {
        if (!validPassportUserId(userId) || !Array.isArray(values)) continue;
        const tags = [];
        for (const item of values) {
            const value = cleanPassportTag(item);
            if (!value || tags.some(t => t.toLocaleLowerCase() === value.toLocaleLowerCase())) continue;
            tags.push(value);
            if (tags.length >= MAX_TAGS) break;
        }
        if (tags.length) out[userId] = tags;
    }
    return out;
}

export function addPassportTag(entries, userId, rawTag) {
    if (!validPassportUserId(userId)) throw new Error('Select a valid VRChat user.');
    const next = normalizePassportTags(entries);
    const tag = cleanPassportTag(rawTag);
    if (!tag) throw new Error('Enter a tag.');
    const tags = next[userId] || [];
    if (tags.some(t => t.toLocaleLowerCase() === tag.toLocaleLowerCase())) throw new Error('That tag already exists.');
    if (tags.length >= MAX_TAGS) throw new Error('A passport can have up to eight tags.');
    if (!Object.hasOwn(next, userId) && Object.keys(next).length >= MAX_PEOPLE) throw new Error('The local tag library is full.');
    next[userId] = [...tags, tag];
    return next;
}

export function removePassportTag(entries, userId, tag) {
    if (!validPassportUserId(userId)) throw new Error('Select a valid VRChat user.');
    const next = normalizePassportTags(entries);
    const tags = (next[userId] || []).filter(t => t !== tag);
    if (tags.length) next[userId] = tags;
    else delete next[userId];
    return next;
}

export function togetherSummary(record) {
    if (!record) return null;
    const ms = Math.max(0, Number(record.ms) || 0);
    const days = Math.max(0, Math.trunc(Number(record.days) || 0));
    const minutes = Math.round(ms / 60000);
    const duration = minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
    return { duration, days, lastSeen: typeof record.lastSeen === 'string' ? record.lastSeen : '' };
}
