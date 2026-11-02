// RC36: read-only, PC-local encounter summaries from VRCX's existing game log.
// All dates/counts are *observed by this PC*, never universal VRChat history.
import { validPassportUserId } from './uwxPassport';

export const ENCOUNTER_WINDOW_DAYS = 30;
export const ENCOUNTER_LIMIT = 200;
export const ENCOUNTER_UI_LIMIT = 80;

export function normalizeEncounterRow(raw) {
    if (!Array.isArray(raw) || !validPassportUserId(raw[0])) return null;
    const name = String(raw[1] || raw[0]).trim().slice(0, 100) || raw[0];
    const days = Math.max(0, Math.trunc(Number(raw[2]) || 0));
    const lastSeen = typeof raw[3] === 'string' && Number.isFinite(Date.parse(raw[3])) ? raw[3] : '';
    const ms = Math.max(0, Math.trunc(Number(raw[4]) || 0));
    const arrivals = Math.max(0, Math.trunc(Number(raw[5]) || 0));
    if (!lastSeen) return null;
    return { userId: raw[0], displayName: name, days, lastSeen, ms, arrivals };
}

export function normalizeEncounters(rows) {
    const unique = new Map();
    for (const raw of rows || []) {
        const row = Array.isArray(raw) ? normalizeEncounterRow(raw) : null;
        if (!row || unique.has(row.userId)) continue;
        unique.set(row.userId, row);
        if (unique.size >= ENCOUNTER_LIMIT) break;
    }
    return Array.from(unique.values()).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}

export function visibleEncounters(rows, { friendIds = [], selfId = '', search = '', includeFriends = false, sort = 'recent' } = {}) {
    const friends = friendIds instanceof Set ? friendIds : new Set(friendIds);
    const needle = String(search || '').trim().toLocaleLowerCase().slice(0, 100);
    const result = (rows || [])
        .filter(r => validPassportUserId(r.userId) && r.userId !== selfId)
        .filter(r => includeFriends || !friends.has(r.userId))
        .filter(r => !needle || r.displayName.toLocaleLowerCase().includes(needle) || r.userId.toLowerCase().includes(needle));
    result.sort(sort === 'days'
        ? (a, b) => b.days - a.days || b.lastSeen.localeCompare(a.lastSeen)
        : (a, b) => b.lastSeen.localeCompare(a.lastSeen));
    return result.slice(0, ENCOUNTER_UI_LIMIT);
}
