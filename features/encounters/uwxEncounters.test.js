import { describe, expect, it } from 'vitest';
import { normalizeEncounterRow, normalizeEncounters, visibleEncounters, ENCOUNTER_UI_LIMIT } from '../uwxEncounters';
const A='usr_aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const B='usr_bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const C='usr_cccccccc-cccc-cccc-cccc-cccccccccccc';
const sample=[
    [A, 'Alice', 3, '2026-10-30T19:00:00Z', 3800000, 5],
    [B, 'Bob', 7, '2026-10-28T19:00:00Z', 25000, 9],
    [C, 'Casey', 1, '2026-10-31T19:00:00Z', 0, 1]
];
describe('Recent Encounters sourced only from local VRChat game logs', () => {
    it('drops invalid user IDs and dates rather than creating phantom profiles',()=>{
        expect(normalizeEncounterRow(['usr_invalid','Someone',1,'2026-10-30T00:00:00Z',0,1])).toBeNull();
        expect(normalizeEncounterRow([A,'Someone',1,'not-a-date',0,1])).toBeNull();
        expect(normalizeEncounters([...sample, sample[0], ['grp_fake','no',1,'2026-10-30T00:00:00Z',0,1]])).toHaveLength(3);
    });
    it('clamps negative or missing encounter values',()=>{
        expect(normalizeEncounterRow([A,'A',-5,'2026-10-30T00:00:00Z',-100,-2])).toMatchObject({ days:0, ms:0, arrivals:0 });
    });
    it('excludes current friends and signed-in user by default',()=>{
        const all=normalizeEncounters(sample);
        const current=visibleEncounters(all,{friendIds:new Set([A]),selfId:C});
        expect(current.map(x=>x.userId)).toEqual([B]);
        expect(visibleEncounters(all,{friendIds:[A],selfId:C,includeFriends:true}).map(x=>x.userId)).toContain(A);
    });
    it('supports local name search and sort by observed days',()=>{
        const rows=normalizeEncounters(sample);
        expect(visibleEncounters(rows,{search:'bOb'}).map(x=>x.userId)).toEqual([B]);
        expect(visibleEncounters(rows,{sort:'days'}).map(x=>x.userId)).toEqual([B,A,C]);
    });
    it('bounds the visible results and ignores unknown shapes',()=>{
        expect(visibleEncounters(Array.from({length:100},()=>({userId:A,displayName:'a',lastSeen:'2026-01-01',days:1}))).length).toBeLessThanOrEqual(ENCOUNTER_UI_LIMIT);
        expect(normalizeEncounters([{},null,'bad'])).toEqual([]);
    });
});
