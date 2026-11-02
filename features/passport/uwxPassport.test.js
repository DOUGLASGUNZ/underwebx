import { describe, expect, it } from 'vitest';
import { addPassportTag, cleanPassportTag, MAX_TAGS, normalizePassportTags, removePassportTag, togetherSummary, validPassportUserId } from '../uwxPassport';

const USER = 'usr_12345678-1234-1234-1234-123456789abc';
const OTHER = 'usr_aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

describe('Social Passport personal tags and local-history summaries', () => {
    it('only accepts real-shaped VRChat user IDs', () => {
        expect(validPassportUserId(USER)).toBe(true);
        expect(validPassportUserId('grp_12345678-1234-1234-1234-123456789abc')).toBe(false);
        expect(validPassportUserId('__proto__')).toBe(false);
        expect(validPassportUserId('usr_invalid')).toBe(false);
    });
    it('normalizes tags without duplicating, injecting, or storing unrelated properties', () => {
        const raw = { [USER]: [' DJ  friend ', 'dj friend', '', 42, 'a'.repeat(50)], [OTHER]: ['Creator'], invalid: ['danger'] };
        const clean = normalizePassportTags(raw);
        expect(clean[USER]).toEqual(['DJ friend', 'a'.repeat(24)]);
        expect(clean[OTHER]).toEqual(['Creator']);
        expect(Object.hasOwn(clean, 'invalid')).toBe(false);
        expect(cleanPassportTag('  late     night  ')).toBe('late night');
    });
    it('adds and removes tags independently without mutating the original', () => {
        const old = { [USER]: ['Friend'], [OTHER]: ['DJ'] };
        const added = addPassportTag(old, USER, 'Event Crew');
        expect(added[USER]).toEqual(['Friend', 'Event Crew']);
        expect(old[USER]).toEqual(['Friend']);
        expect(removePassportTag(added, USER, 'Friend')[USER]).toEqual(['Event Crew']);
        expect(removePassportTag({ [USER]: ['Friend'] }, USER, 'Friend')).toEqual({});
        expect(added[OTHER]).toEqual(['DJ']);
    });
    it('rejects duplicates, invalid IDs, empty tags and too many tags', () => {
        expect(() => addPassportTag({ [USER]: ['Friend'] }, USER, 'fRiEnD')).toThrow();
        expect(() => addPassportTag({}, 'some string', 'Friend')).toThrow();
        expect(() => addPassportTag({}, USER, ' ')).toThrow();
        const full = { [USER]: Array.from({ length: MAX_TAGS }, (_, i) => 'Tag' + i) };
        expect(() => addPassportTag(full, USER, 'Extra')).toThrow();
    });
    it('labels observed local history rather than claiming global account history', () => {
        expect(togetherSummary(null)).toBeNull();
        expect(togetherSummary({ ms: 7240000, days: 3, lastSeen: '2026-10-28' })).toEqual({ duration: '2h 1m', days: 3, lastSeen: '2026-10-28' });
        expect(togetherSummary({ ms: -20, days: -2 })).toEqual({ duration: '0m', days: 0, lastSeen: '' });
    });
});
