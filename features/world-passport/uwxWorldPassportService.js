// World Passport only queries data that VRCX already writes to local SQLite.
// No VRChat API calls, no new tables and no syncing to UnderWeb.cloud.
import sqliteService from '../services/sqlite.js';
import { database } from '../services/database';
import { normalizeWorldVisits, WORLD_PASSPORT_WINDOW_DAYS } from '../shared/utils/uwxWorldPassport';

export async function readWorldPassportVisits() {
    const since = new Date(Date.now() - WORLD_PASSPORT_WINDOW_DAYS * 86400000).toISOString();
    const rows = [];
    const sql = [
        'WITH candidates AS (',
        ' SELECT world_id FROM gamelog_location WHERE created_at >= @since AND world_id LIKE \'wrld_%\'',
        ' UNION SELECT world_id FROM favorite_world WHERE world_id LIKE \'wrld_%\'',
        ')',
        'SELECT c.world_id,',
        " COALESCE((SELECT NULLIF(cache.name, '') FROM cache_world AS cache WHERE cache.id = c.world_id),",
        " (SELECT NULLIF(g.world_name, '') FROM gamelog_location AS g WHERE g.world_id = c.world_id ORDER BY g.created_at DESC LIMIT 1), c.world_id),",
        ' (SELECT COUNT(DISTINCT location) FROM gamelog_location WHERE world_id = c.world_id),',
        ' (SELECT MAX(created_at) FROM gamelog_location WHERE world_id = c.world_id),',
        ' EXISTS(SELECT 1 FROM favorite_world AS f WHERE f.world_id = c.world_id)',
        'FROM candidates AS c',
        'ORDER BY (SELECT MAX(created_at) FROM gamelog_location WHERE world_id = c.world_id) DESC',
        'LIMIT 200'
    ].join(' ');
    await sqliteService.execute(row => rows.push(row), sql, { '@since': since });
    return normalizeWorldVisits(rows);
}

export async function readExistingWorldMemo(worldId) {
    const value = await database.getWorldMemo(worldId);
    return typeof value?.memo === 'string' ? value.memo : '';
}

export async function saveExistingWorldMemo(worldId, memo) {
    // Await SQLite directly: older VRCX's setWorldMemo wrapper does not return the write Promise.
    if (memo.trim()) {
        await sqliteService.executeNonQuery(
            'INSERT OR REPLACE INTO world_memos (world_id, edited_at, memo) VALUES (@world_id, @edited_at, @memo)',
            { '@world_id': worldId, '@edited_at': new Date().toISOString(), '@memo': memo }
        );
    } else {
        await sqliteService.executeNonQuery(
            'DELETE FROM world_memos WHERE world_id = @world_id',
            { '@world_id': worldId }
        );
    }
}
