// UWX RC37 — personal world annotations, not a second VRChat favorites database.
export const WORLD_PASSPORT_WINDOW_DAYS = 180;
export const WORLD_PASSPORT_LIMIT = 200;
export const WORLD_MAX_COLLECTIONS = 6;
export const WORLD_MAX_RECORDS = 500;
export const WORLD_COLLECTION_LENGTH = 28;
const WORLD_ID = /^wrld_[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export function isWorldId(value) {
    return typeof value === 'string' && WORLD_ID.test(value);
}

export function cleanCollection(value) {
    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, WORLD_COLLECTION_LENGTH) : '';
}

export function normalizePassportRecords(raw) {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const result = {};
    for (const [id, data] of Object.entries(source).slice(0, WORLD_MAX_RECORDS)) {
        if (!isWorldId(id) || !data || typeof data !== 'object' || Array.isArray(data)) continue;
        const rating = Number.isInteger(data.rating) && data.rating >= 0 && data.rating <= 5 ? data.rating : 0;
        const collections = [];
        if (Array.isArray(data.collections)) {
            for (const item of data.collections) {
                const label = cleanCollection(item);
                if (!label || collections.some(c => c.toLowerCase() === label.toLowerCase())) continue;
                collections.push(label);
                if (collections.length >= WORLD_MAX_COLLECTIONS) break;
            }
        }
        if (rating || collections.length) result[id] = { rating, collections };
    }
    return result;
}

export function updateWorldRating(records, id, rating) {
    if (!isWorldId(id) || !Number.isInteger(rating) || rating < 0 || rating > 5) throw new Error('Invalid world rating');
    const next = normalizePassportRecords(records);
    if (!Object.hasOwn(next, id) && Object.keys(next).length >= WORLD_MAX_RECORDS) throw new Error('Local World Passport is full');
    const current = next[id] || { rating: 0, collections: [] };
    if (rating === 0 && !current.collections.length) delete next[id];
    else next[id] = { ...current, rating };
    return next;
}

export function addWorldCollection(records, id, input) {
    if (!isWorldId(id)) throw new Error('Invalid world ID');
    const label = cleanCollection(input);
    if (!label) throw new Error('Enter a collection name');
    const next = normalizePassportRecords(records);
    if (!Object.hasOwn(next, id) && Object.keys(next).length >= WORLD_MAX_RECORDS) throw new Error('Local World Passport is full');
    const current = next[id] || { rating: 0, collections: [] };
    if (current.collections.some(c => c.toLowerCase() === label.toLowerCase())) throw new Error('Already in that collection');
    if (current.collections.length >= WORLD_MAX_COLLECTIONS) throw new Error('Up to six collections per world');
    next[id] = { ...current, collections: [...current.collections, label] };
    return next;
}

export function removeWorldCollection(records, id, label) {
    if (!isWorldId(id)) throw new Error('Invalid world ID');
    const next = normalizePassportRecords(records);
    const current = next[id];
    if (!current) return next;
    const collections = current.collections.filter(c => c !== label);
    if (!current.rating && !collections.length) delete next[id];
    else next[id] = { rating: current.rating, collections };
    return next;
}

export function normalizeWorldVisits(rows) {
    const ids = new Set();
    const result = [];
    for (const raw of rows || []) {
        if (!Array.isArray(raw) || !isWorldId(raw[0]) || ids.has(raw[0])) continue;
        const lastSeen = typeof raw[3] === 'string' && Number.isFinite(Date.parse(raw[3])) ? raw[3] : '';
        if (!lastSeen) continue;
        ids.add(raw[0]);
        result.push({
            id: raw[0],
            name: String(raw[1] || raw[0]).trim().slice(0, 140) || raw[0],
            visits: Math.max(0, Math.trunc(Number(raw[2]) || 0)),
            lastSeen,
            favorite: Boolean(raw[4])
        });
        if (result.length >= WORLD_PASSPORT_LIMIT) break;
    }
    return result;
}

export function filterWorldVisits(rows, { search = '', sort = 'recent', category = 'all', records = {} } = {}) {
    const needle = String(search || '').trim().toLowerCase().slice(0, 100);
    const list = (rows || []).filter(r => isWorldId(r.id)
        && (!needle || r.name.toLowerCase().includes(needle) || r.id.toLowerCase().includes(needle))
        && (category === 'all' || (category === 'favorites' && r.favorite)
            || (category === 'rated' && (records[r.id]?.rating || 0) > 0)
            || (category !== 'favorites' && category !== 'rated'
                && (records[r.id]?.collections || []).some(c => c.toLowerCase() === category.toLowerCase()))));
    return [...list].sort(sort === 'visits'
        ? (a, b) => b.visits - a.visits || b.lastSeen.localeCompare(a.lastSeen)
        : sort === 'rating'
            ? (a, b) => (records[b.id]?.rating || 0) - (records[a.id]?.rating || 0) || b.lastSeen.localeCompare(a.lastSeen)
            : (a, b) => b.lastSeen.localeCompare(a.lastSeen));
}
