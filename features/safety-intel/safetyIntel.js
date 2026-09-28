import { reactive, ref } from 'vue';
import { defineStore } from 'pinia';

const SUPABASE_URL = 'https://pxipclkptxpqukefwexh.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4aXBjbGtwdHhwcXVrZWZ3ZXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwOTM0MDcsImV4cCI6MjEwNDY2OTQwN30.B7hucEUAMsVvoyEpScq9SWQXEGsfg3C9FHuRTBLgKnc';
const CACHE_MS = 5 * 60 * 1000;
const USER_ID_RE = /^usr_[A-Za-z0-9-]{8,}$/;

const SELECT_FIELDS =
    'vrchat_user_id,last_known_display_name,risk_level,verified_flags,verified_report_count,public_summary,latest_verified_at,last_reviewed_at,active';

export const useSafetyIntelStore = defineStore('SafetyIntel', () => {
    const intelByUserId = reactive(new Map());
    const checkedAtByUserId = reactive(new Map());
    const isLoading = ref(false);
    const lastError = ref('');
    const lastScanAt = ref(0);

    function normalizeUserId(value) {
        const id = String(value || '').trim();
        return USER_ID_RE.test(id) ? id : '';
    }

    function getIntel(userId) {
        const id = normalizeUserId(userId);
        if (!id) return null;
        return intelByUserId.get(id) || null;
    }

    function wasRecentlyChecked(userId) {
        const id = normalizeUserId(userId);
        if (!id) return false;
        const checkedAt = checkedAtByUserId.get(id) || 0;
        return Date.now() - checkedAt < CACHE_MS;
    }

    async function requestRows(query) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/uwx_safety_subjects?${query}`, {
            method: 'GET',
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                Accept: 'application/json'
            }
        });
        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`Safety Intel request failed (${response.status})${body ? `: ${body.slice(0, 160)}` : ''}`);
        }
        return response.json();
    }

    async function lookupUser(userId, { force = false } = {}) {
        const id = normalizeUserId(userId);
        if (!id) throw new Error('Enter a valid VRChat user ID beginning with usr_.');
        if (!force && wasRecentlyChecked(id)) return getIntel(id);

        isLoading.value = true;
        lastError.value = '';
        try {
            const rows = await requestRows(
                `select=${encodeURIComponent(SELECT_FIELDS)}&vrchat_user_id=eq.${encodeURIComponent(id)}&limit=1`
            );
            const row = Array.isArray(rows) && rows.length ? rows[0] : null;
            intelByUserId.set(id, row && row.active ? row : null);
            checkedAtByUserId.set(id, Date.now());
            lastScanAt.value = Date.now();
            return intelByUserId.get(id);
        } catch (error) {
            lastError.value = error?.message || 'Safety Intel lookup failed.';
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    async function batchLookup(userIds, { force = false } = {}) {
        const ids = Array.from(new Set((userIds || []).map(normalizeUserId).filter(Boolean))).slice(0, 100);
        const pending = force ? ids : ids.filter((id) => !wasRecentlyChecked(id));
        if (!pending.length) return ids.map((id) => getIntel(id)).filter(Boolean);

        isLoading.value = true;
        lastError.value = '';
        try {
            for (let offset = 0; offset < pending.length; offset += 40) {
                const batch = pending.slice(offset, offset + 40);
                const inFilter = batch.map((id) => `"${id}"`).join(',');
                const rows = await requestRows(
                    `select=${encodeURIComponent(SELECT_FIELDS)}&vrchat_user_id=in.(${encodeURIComponent(inFilter)})`
                );
                const found = new Map((Array.isArray(rows) ? rows : []).map((row) => [row.vrchat_user_id, row]));
                const checkedAt = Date.now();
                for (const id of batch) {
                    const row = found.get(id);
                    intelByUserId.set(id, row && row.active ? row : null);
                    checkedAtByUserId.set(id, checkedAt);
                }
            }
            lastScanAt.value = Date.now();
            return ids.map((id) => getIntel(id)).filter(Boolean);
        } catch (error) {
            lastError.value = error?.message || 'Safety Intel scan failed.';
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    function clearCache() {
        intelByUserId.clear();
        checkedAtByUserId.clear();
        lastError.value = '';
        lastScanAt.value = 0;
    }

    return {
        intelByUserId,
        isLoading,
        lastError,
        lastScanAt,
        getIntel,
        lookupUser,
        batchLookup,
        clearCache
    };
});
