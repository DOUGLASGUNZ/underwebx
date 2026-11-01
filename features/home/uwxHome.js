// UWX Home: local-only ordering and visibility of existing, live Overview tiles.
// No calls to VRChat, Supabase, or the UnderWeb website.
export const HOME_TILES = Object.freeze([
    { id: 'world', label: 'Current World', description: 'World and friends in the current instance' },
    { id: 'network', label: 'Network Online', description: 'UnderWeb member, staff and creator presence' },
    { id: 'session', label: 'UWX Session', description: 'Session invites and approved group count' }
]);
export const DEFAULT_HOME = Object.freeze({
    order: HOME_TILES.map((tile) => tile.id),
    hidden: []
});
const allowed = new Set(HOME_TILES.map((tile) => tile.id));
const plain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export function normalizeHome(value) {
    const input = plain(value) ? value : {};
    const savedOrder = Array.isArray(input.order) ? input.order : [];
    const order = [...new Set(savedOrder.filter((id) => typeof id === 'string' && allowed.has(id)))];
    for (const tile of HOME_TILES) if (!order.includes(tile.id)) order.push(tile.id);
    const hidden = [...new Set((Array.isArray(input.hidden) ? input.hidden : []).filter((id) => typeof id === 'string' && allowed.has(id)))];
    return { order, hidden };
}
export function homeIsVisible(state, id) {
    return allowed.has(id) && !normalizeHome(state).hidden.includes(id);
}
export function homeRank(state, id) {
    const rank = normalizeHome(state).order.indexOf(id);
    return rank === -1 ? 999 : rank;
}
export function setHomeVisible(state, id, visible) {
    if (!allowed.has(id)) throw new Error('Unknown Home widget');
    const before = normalizeHome(state);
    return { ...before, hidden: visible ? before.hidden.filter(x => x !== id) : [...new Set([...before.hidden, id])] };
}
export function moveHomeWidget(state, id, direction) {
    if (!allowed.has(id) || ![-1, 1].includes(direction)) throw new Error('Invalid Home widget move');
    const next = normalizeHome(state);
    const oldIndex = next.order.indexOf(id);
    const newIndex = oldIndex + direction;
    if (newIndex < 0 || newIndex >= next.order.length) return next;
    next.order.splice(oldIndex, 1);
    next.order.splice(newIndex, 0, id);
    return next;
}
export function dragHomeBefore(state, draggedId, targetId) {
    if (!allowed.has(draggedId) || !allowed.has(targetId)) throw new Error('Invalid Home widget');
    const next = normalizeHome(state);
    if (draggedId === targetId) return next;
    next.order.splice(next.order.indexOf(draggedId), 1);
    next.order.splice(next.order.indexOf(targetId), 0, draggedId);
    return next;
}
