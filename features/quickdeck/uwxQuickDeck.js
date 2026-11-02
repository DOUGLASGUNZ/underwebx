// RC38: routes exposed to native QuickDeck are an explicit allow-list.
export const QUICKDECK_SHORTCUTS = Object.freeze([
    { route: 'uwx-people', label: 'People' },
    { route: 'uwx-worlds', label: 'World Passport' },
    { route: 'uwx-invites', label: 'Invites' },
    { route: 'uwx-osc', label: 'OSC Lab' },
    { route: 'search', label: 'Search' },
    { route: 'underweb', label: 'Overview' }
]);
const ROUTES = new Set(QUICKDECK_SHORTCUTS.map(x=>x.route));
export function normalizeQuickDeckRoute(raw) {
    return typeof raw === 'string' && ROUTES.has(raw) ? raw : null;
}
export function countOnlineFriends(friends) {
    if (!friends || typeof friends.values !== 'function') return 0;
    let count=0;
    for (const row of friends.values()) {
        if (row?.state === 'online') count++;
    }
    return count;
}
export function quickDeckWorldLabel(location) {
    const value = typeof location?.name === 'string' ? location.name.trim() : '';
    return value.slice(0, 160);
}
