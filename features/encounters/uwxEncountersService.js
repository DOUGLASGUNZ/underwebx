import sqliteService from '../services/sqlite.js';
import { ENCOUNTER_WINDOW_DAYS, normalizeEncounters } from '../shared/utils/uwxEncounters';

// Existing local gamelog_join_leave only. No VRChat HTTP calls or remote uploads.
// Read once when the browser is opened; refresh only by user action.
export async function readLocalEncounters() {
    const since = new Date(Date.now() - ENCOUNTER_WINDOW_DAYS * 86400000).toISOString();
    const rows = [];
    const sql = [
        'SELECT j.user_id,',
        "COALESCE((SELECT newer.display_name FROM gamelog_join_leave AS newer WHERE newer.user_id = j.user_id AND newer.display_name <> '' ORDER BY newer.created_at DESC LIMIT 1), j.user_id) AS display_name,",
        'COUNT(DISTINCT substr(j.created_at, 1, 10)) AS observed_days,',
        'MAX(j.created_at) AS last_seen,',
        "COALESCE(SUM(CASE WHEN j.type = 'OnPlayerLeft' THEN j.time ELSE 0 END), 0) AS observed_ms,",
        "SUM(CASE WHEN j.type = 'OnPlayerJoined' THEN 1 ELSE 0 END) AS arrivals",
        'FROM gamelog_join_leave AS j',
        'WHERE j.created_at >= @since',
        "AND j.type IN ('OnPlayerJoined', 'OnPlayerLeft')",
        "AND j.user_id LIKE 'usr_%'",
        'GROUP BY j.user_id',
        'ORDER BY last_seen DESC LIMIT 200'
    ].join(' ');
    await sqliteService.execute(row => rows.push(row), sql, { '@since': since });
    return normalizeEncounters(rows);
}
