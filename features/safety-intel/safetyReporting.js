import { ref } from 'vue';
import { defineStore } from 'pinia';

const API = 'https://pxipclkptxpqukefwexh.supabase.co';
const KEY = 'sb_publishable_g6XQVQvYVSWpIskA7r_1cQ_CaHkVnmc';
const STORAGE_KEY = 'uwx-underweb-report-auth-v1';
const USER_ID_RE = /^usr_[A-Za-z0-9-]{8,}$/;
const CATEGORIES = new Set([
    'crashing', 'doxxing_privacy_threat', 'harassment', 'scam_impersonation',
    'malicious_client_behavior', 'ban_evasion', 'other'
]);
const SEVERITIES = new Set(['info', 'caution', 'high']);

function loadSession() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        return data?.refresh_token && data?.user?.id ? data : null;
    } catch (_) {
        return null;
    }
}

async function apiRequest(path, { method = 'GET', body, bearer, headers = {} } = {}) {
    const response = await fetch(API + path, {
        method,
        headers: {
            apikey: KEY,
            Accept: 'application/json',
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
            ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
            ...headers
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || error?.msg || error?.error_description ||
            `UnderWeb request failed (${response.status}).`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

export const useSafetyReportingStore = defineStore('SafetyReporting', () => {
    const session = ref(loadSession());
    const busy = ref(false);
    const myReports = ref([]);
    const lastError = ref('');

    function saveSession(value) {
        session.value = value;
        try {
            if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
            else localStorage.removeItem(STORAGE_KEY);
        } catch (_) {
            // An unavailable local store means the account is connected only
            // for this UWX session.
        }
    }

    async function sendSignInLink(email) {
        const address = String(email || '').trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new Error('Enter your UnderWeb account email.');
        busy.value = true;
        lastError.value = '';
        try {
            await apiRequest('/auth/v1/otp', {
                method: 'POST',
                body: { email: address, create_user: false }
            });
            return address;
        } catch (error) {
            lastError.value = error.message;
            throw error;
        } finally { busy.value = false; }
    }

    async function verifyEmail(email, supplied) {
        const value = String(supplied || '').trim();
        let body;
        if (/^[0-9]{6,8}$/.test(value)) {
            body = { email: String(email || '').trim(), token: value, type: 'email' };
        } else {
            let link;
            try { link = new URL(value); } catch (_) { throw new Error('Paste the emailed sign-in link or its code.'); }
            if (link.hostname !== 'pxipclkptxpqukefwexh.supabase.co' &&
                link.hostname !== 'underweb.cloud' && link.hostname !== 'www.underweb.cloud') {
                throw new Error('This is not an UnderWeb sign-in link.');
            }
            const tokenHash = link.searchParams.get('token_hash') || link.searchParams.get('token');
            if (!tokenHash) throw new Error('The link has no verification token. Copy the original link from your email.');
            body = { token_hash: tokenHash, type: 'email' };
        }
        busy.value = true;
        lastError.value = '';
        try {
            const result = await apiRequest('/auth/v1/verify', { method: 'POST', body });
            if (!result?.access_token || !result?.refresh_token || !result?.user?.id) {
                throw new Error('The sign-in link did not return an UnderWeb session.');
            }
            saveSession(result);
            return result.user;
        } catch (error) {
            lastError.value = error.message;
            throw error;
        } finally { busy.value = false; }
    }

    async function accessToken() {
        const current = session.value;
        if (!current?.refresh_token) throw new Error('Connect your UnderWeb account to submit a report.');
        if (current.access_token && current.expires_at * 1000 > Date.now() + 60_000) {
            return current.access_token;
        }
        try {
            const next = await apiRequest('/auth/v1/token?grant_type=refresh_token', {
                method: 'POST', body: { refresh_token: current.refresh_token }
            });
            if (!next?.access_token || !next?.user?.id) throw new Error('UnderWeb sign-in expired.');
            saveSession(next);
            return next.access_token;
        } catch (error) {
            saveSession(null);
            throw new Error('UnderWeb sign-in expired. Connect your account again.');
        }
    }

    async function disconnect() {
        const token = session.value?.access_token;
        saveSession(null);
        myReports.value = [];
        if (token) {
            try { await apiRequest('/auth/v1/logout', { method: 'POST', bearer: token }); }
            catch (_) { /* Local credentials are already removed. */ }
        }
    }

    async function submitReport(report) {
        const userId = String(report?.vrchatUserId || '').trim();
        const summary = String(report?.summary || '').trim();
        const category = String(report?.category || '');
        const severity = String(report?.severity || '');
        const evidenceUrl = String(report?.evidenceUrl || '').trim();
        if (!USER_ID_RE.test(userId)) throw new Error('Enter a valid VRChat usr_ ID.');
        if (!CATEGORIES.has(category) || !SEVERITIES.has(severity)) throw new Error('Choose a category and severity.');
        if (summary.length < 10 || summary.length > 2000) throw new Error('Details must be 10–2000 characters.');
        if (evidenceUrl) {
            let link;
            try { link = new URL(evidenceUrl); } catch (_) { throw new Error('Enter a valid evidence URL.'); }
            if (!['https:', 'http:'].includes(link.protocol)) throw new Error('Evidence links must use https:// or http://.');
        }
        busy.value = true;
        lastError.value = '';
        try {
            const token = await accessToken();
            const payload = {
                vrchat_user_id: userId,
                last_known_display_name: String(report.displayName || '').trim().slice(0, 100) || null,
                category,
                suggested_severity: severity,
                incident_at: report.incidentAt ? new Date(report.incidentAt).toISOString() : null,
                incident_world: String(report.incidentWorld || '').trim().slice(0, 160) || null,
                summary,
                status: 'pending',
                reporter_user_id: session.value.user.id
            };
            const rows = await apiRequest('/rest/v1/uwx_safety_reports?select=id,status,created_at', {
                method: 'POST', body: payload, bearer: token,
                headers: { Prefer: 'return=representation' }
            });
            const record = rows?.[0];
            if (!record?.id) throw new Error('Report was submitted, but UWX could not read its ID. Check the website before retrying.');
            let evidenceSaved = true;
            if (evidenceUrl) {
                try {
                    await apiRequest('/rest/v1/uwx_safety_evidence', {
                        method: 'POST',
                        bearer: token,
                        body: {
                            report_id: record.id,
                            submitted_by: session.value.user.id,
                            evidence_type: 'other',
                            url: evidenceUrl
                        }
                    });
                } catch (_) { evidenceSaved = false; }
            }
            await loadMyReports().catch(() => {});
            return { reportId: record.id, evidenceSaved };
        } catch (error) {
            lastError.value = error.message;
            throw error;
        } finally { busy.value = false; }
    }

    async function loadMyReports() {
        const token = await accessToken();
        const id = session.value.user.id;
        myReports.value = await apiRequest(
            `/rest/v1/uwx_safety_reports?select=id,vrchat_user_id,last_known_display_name,category,status,created_at&reporter_user_id=eq.${encodeURIComponent(id)}&order=created_at.desc&limit=30`,
            { bearer: token }
        );
        return myReports.value;
    }

    return {
        session, busy, myReports, lastError,
        sendSignInLink, verifyEmail, disconnect, submitReport, loadMyReports
    };
});
