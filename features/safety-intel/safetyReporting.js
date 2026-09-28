import { ref } from 'vue';
import { defineStore } from 'pinia';

const API = 'https://pxipclkptxpqukefwexh.supabase.co';
// Public anonymous API key. No VRChat session, UnderWeb session, or reporter
// identifier is sent with a Safety Intel report.
const ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4aXBjbGtwdHhwcXVrZWZ3ZXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwOTM0MDcsImV4cCI6MjEwNDY2OTQwN30.B7hucEUAMsVvoyEpScq9SWQXEGsfg3C9FHuRTBLgKnc';
const USER_ID_RE = /^usr_[A-Za-z0-9-]{8,}$/;
const CATEGORIES = new Set([
    'crashing', 'doxxing_privacy_threat', 'harassment', 'scam_impersonation',
    'malicious_client_behavior', 'ban_evasion', 'other'
]);
const SEVERITIES = new Set(['info', 'caution', 'high']);

export const useSafetyReportingStore = defineStore('SafetyReporting', () => {
    const busy = ref(false);
    const lastError = ref('');

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
            if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(link.hostname) || link.hostname.includes(':')) {
                throw new Error('Do not include IP addresses in evidence links.');
            }
        }
        busy.value = true;
        lastError.value = '';
        try {
            const payload = {
                vrchat_user_id: userId,
                last_known_display_name: String(report.displayName || '').trim().slice(0, 100) || null,
                category,
                suggested_severity: severity,
                incident_at: report.incidentAt ? new Date(report.incidentAt).toISOString() : null,
                incident_world: String(report.incidentWorld || '').trim().slice(0, 160) || null,
                summary,
                status: 'pending',
                source: 'uwx',
                private_evidence_url: evidenceUrl || null
            };
            const response = await fetch(`${API}/rest/v1/uwx_safety_reports`, {
                method: 'POST',
                headers: {
                    apikey: ANON_KEY,
                    Authorization: `Bearer ${ANON_KEY}`,
                    'Content-Type': 'application/json',
                    Prefer: 'return=minimal'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const error = await response.json().catch(() => null);
                throw new Error(error?.message || `Safety report failed (${response.status}).`);
            }
            return true;
        } catch (error) {
            lastError.value = error.message;
            throw error;
        } finally { busy.value = false; }
    }

    return { busy, lastError, submitReport };
});
