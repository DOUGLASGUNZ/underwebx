import { describe, expect, it } from 'vitest';
import { DEFAULT_HOME, HOME_TILES, dragHomeBefore, homeIsVisible, homeRank, moveHomeWidget, normalizeHome, setHomeVisible } from '../uwxHome';
describe('UWX customizable Home widgets', () => {
    it('starts with the four existing overview cards in normal order', () => {
        expect(normalizeHome(null)).toEqual(DEFAULT_HOME);
        expect(HOME_TILES.map(t => t.id)).toEqual(DEFAULT_HOME.order);
    });
    it('restores missing items and ignores unknown IDs and duplicate items from saved settings', () => {
        expect(normalizeHome({ order: ['session', 'session', 'fake'], hidden: ['network', 'network', 'fake'] })).toEqual({
            order: ['session', 'world', 'instance', 'network'], hidden: ['network']
        });
    });
    it('reorders tiles while retaining original live content and IDs', () => {
        const next = moveHomeWidget(DEFAULT_HOME, 'session', -1);
        expect(next.order).toEqual(['world', 'instance', 'session', 'network']);
        const dragged = dragHomeBefore(DEFAULT_HOME, 'session', 'world');
        expect(dragged.order).toEqual(['session', 'world', 'instance', 'network']);
        expect(homeRank(dragged, 'session')).toBe(0);
        expect(moveHomeWidget(DEFAULT_HOME, 'world', -1)).toEqual(DEFAULT_HOME);
    });
    it('allows hiding all tiles while preserving a restore path in the editor', () => {
        let state = DEFAULT_HOME;
        for (const tile of HOME_TILES) state = setHomeVisible(state, tile.id, false);
        expect(HOME_TILES.every(tile => !homeIsVisible(state, tile.id))).toBe(true);
        expect(homeIsVisible(setHomeVisible(state, 'network', true), 'network')).toBe(true);
    });
    it('refuses unexpected tile IDs and invalid operations', () => {
        expect(() => dragHomeBefore(DEFAULT_HOME, 'fake', 'world')).toThrow();
        expect(() => moveHomeWidget(DEFAULT_HOME, 'network', 40)).toThrow();
        expect(() => setHomeVisible(DEFAULT_HOME, 'cookie', false)).toThrow();
        expect(homeIsVisible(DEFAULT_HOME, 'unknown')).toBe(false);
    });
});
