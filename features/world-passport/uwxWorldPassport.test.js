import { describe, expect, it } from 'vitest';
import {
    isWorldId, normalizePassportRecords, updateWorldRating, addWorldCollection, removeWorldCollection,
    normalizeWorldVisits, filterWorldVisits, WORLD_MAX_COLLECTIONS
} from '../uwxWorldPassport';

const A = 'wrld_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const B = 'wrld_bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const C = 'wrld_cccccccc-cccc-cccc-cccc-cccccccccccc';
const visits = [
    [A, 'Horror House', 7, '2026-10-31T01:10:00Z', 1],
    [B, 'Photo Studio', 12, '2026-10-28T01:10:00Z', 0],
    [C, 'Saved Favorite', 0, null, 1]
];

describe('World Passport — local ratings, collections and existing VRCX data', () => {
    it('only uses verified VRChat world IDs', () => {
        expect(isWorldId(A)).toBe(true);
        expect(isWorldId('usr_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')).toBe(false);
        expect(isWorldId('__proto__')).toBe(false);
    });
    it('sanitizes imported settings without carrying unexpected properties', () => {
        const model = normalizePassportRecords({
            [A]: { rating: 5, collections: [' Horror ', 'horror', 12, 'Chill'], token: 'secret' },
            [B]: { rating: 18, collections: ['Gaming'] },
            evil: { rating: 5, collections: ['Anything'] }
        });
        expect(model[A]).toEqual({ rating: 5, collections: ['Horror', 'Chill'] });
        expect(model[B]).toEqual({ rating: 0, collections: ['Gaming'] });
        expect(Object.hasOwn(model, 'evil')).toBe(false);
    });
    it('updates personal ratings without changing original state or VRCX favorites', () => {
        const original = { [A]: { rating: 2, collections: ['Chill'] } };
        const next = updateWorldRating(original, A, 5);
        expect(next[A].rating).toBe(5);
        expect(original[A].rating).toBe(2);
        expect(updateWorldRating({}, A, 0)).toEqual({});
        expect(() => updateWorldRating({}, B, 6)).toThrow();
    });
    it('validates collections, prevents duplicates, and supports removal', () => {
        const first = addWorldCollection({}, A, ' Photo  Spots ');
        expect(first[A].collections).toEqual(['Photo Spots']);
        expect(() => addWorldCollection(first, A, 'photo spots')).toThrow();
        expect(removeWorldCollection(first, A, 'Photo Spots')).toEqual({});
        let state = {};
        for (let i = 0; i < WORLD_MAX_COLLECTIONS; i++) state = addWorldCollection(state, A, 'tag'+i);
        expect(() => addWorldCollection(state, A, 'another')).toThrow();
        expect(() => addWorldCollection({}, 'not_a_world', 'Horror')).toThrow();
    });
    it('keeps unvisited VRCX favorites instead of inventing a visit', () => {
        const all = normalizeWorldVisits(visits);
        expect(all).toHaveLength(3);
        expect(all.find(x => x.id === C)).toMatchObject({ favorite: true, visits: 0, lastSeen: '' });
        expect(normalizeWorldVisits([...visits, visits[0], ['not_world', 'Name', 1, '2026-10-30T01:00:00Z', 0]])).toHaveLength(3);
    });
    it('filters existing favorites, custom collections and rating without remote lookups', () => {
        const all = normalizeWorldVisits(visits);
        const records = { [A]: { rating: 5, collections: ['Horror'] }, [B]: { rating: 3, collections: [] } };
        expect(filterWorldVisits(all, { category:'favorites', records }).map(x=>x.id)).toEqual([A,C]);
        expect(filterWorldVisits(all, { category:'Horror', records }).map(x=>x.id)).toEqual([A]);
        expect(filterWorldVisits(all, { category:'rated', records }).map(x=>x.id)).toEqual([A,B]);
        expect(filterWorldVisits(all, { sort:'visits', records })[0].id).toBe(B);
        expect(filterWorldVisits(all, { sort:'rating', records })[0].id).toBe(A);
        expect(filterWorldVisits(all, { search:'Studio', records }).map(x=>x.id)).toEqual([B]);
    });
});
