import { describe, expect, it } from 'vitest';
import { QUICKDECK_SHORTCUTS, normalizeQuickDeckRoute, countOnlineFriends, quickDeckWorldLabel } from '../uwxQuickDeck';

describe('QuickDeck native companion safety',()=>{
    it('routes only to known existing UWX or VRCX sections',()=>{
        expect(QUICKDECK_SHORTCUTS.map(x=>x.route)).toHaveLength(6);
        for(const action of QUICKDECK_SHORTCUTS) expect(normalizeQuickDeckRoute(action.route)).toBe(action.route);
        for(const value of ['https://example.com','logout','uwx-staff','uwx-moderation','javascript:alert(1)','',null,{}]){
            expect(normalizeQuickDeckRoute(value)).toBeNull();
        }
    });
    it('uses current friend state without a network request',()=>{
        const friends=new Map([
            ['a',{state:'online'}], ['b',{state:'active'}],['c',{state:'offline'}], ['d',{state:'online'}]
        ]);
        expect(countOnlineFriends(friends)).toBe(2);
        expect(countOnlineFriends(undefined)).toBe(0);
    });
    it('derives world label from already loaded local location data',()=>{
        expect(quickDeckWorldLabel({name:'My World'})).toBe('My World');
        expect(quickDeckWorldLabel({name:null})).toBe('');
        expect(quickDeckWorldLabel({name:'x'.repeat(220)})).toHaveLength(160);
    });
});
