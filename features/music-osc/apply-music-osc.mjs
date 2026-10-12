import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
function patch(rel, before, after) {
    const dest = path.join(root, rel);
    const src = fs.readFileSync(dest, 'utf8').replace(/\r\n/g, '\n');
    if (!src.includes(before)) throw new Error('Music OSC: missing expected source anchor in ' + rel + ': ' + before.slice(0, 90));
    fs.writeFileSync(dest, src.replace(before, after), 'utf8');
}

// Windows System Media Transport Controls includes background/paused sessions.
// Prioritize a *playing* Spotify desktop session, then another playing session.
// This avoids using old Spotify metadata when music is actually playing elsewhere.
const oldSelector = `                foreach (var candidate in sessions)
                {
                    if ((candidate.SourceAppUserModelId ?? string.Empty).Contains("Spotify", StringComparison.OrdinalIgnoreCase))
                    {
                        session = candidate;
                        break;
                    }
                }

                session ??= manager.GetCurrentSession();`;
const newSelector = `                // Prefer active Spotify; otherwise another actively playing session.
                foreach (var candidate in sessions)
                {
                    var isPlaying = candidate.GetPlaybackInfo()?.PlaybackStatus ==
                        GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing;
                    if (!isPlaying) continue;
                    if ((candidate.SourceAppUserModelId ?? string.Empty).Contains("Spotify", StringComparison.OrdinalIgnoreCase))
                    {
                        session = candidate;
                        break;
                    }
                    session ??= candidate;
                }

                // Show an available paused session in the UI, but do not broadcast
                // stale 'Now Playing' data as live OSC music.
                if (session == null)
                {
                    session = manager.GetCurrentSession();
                }`;
patch('Dotnet/AppApi/Common/AppApiCommon.cs', oldSelector, newSelector);

// In auto media mode, only an active Playing track qualifies for music rotation.
// Manual metadata entry is still available with auto-detection switched off.
patch(
    'src/stores/oscLab.js',
    "        if (key === 'music') return Boolean(nowPlayingTitle.value.trim());",
    "        if (key === 'music') return Boolean(nowPlayingTitle.value.trim() && (!autoMedia.value || mediaState.value === 'playing'));"
);

patch(
    'src/views/UnderWeb/UnderWeb.vue',
    "    // Refresh remote music progress while the music screen is active, without 1-second OSC spam.",
    "    // Music OSC runs only for an active playback session in auto mode; no paused/stale song spam.\n    // Refresh remote music progress while the music screen is active, without 1-second OSC spam."
);

const changelog = path.join(root, 'CHANGELOG_UWX.md');
let s = fs.readFileSync(changelog, 'utf8');
if (!s.includes('## 0.5.1-rc10 — OSC reliability')) throw new Error('Music OSC: RC10 changelog expected.');
s = s.replace('## 0.5.1-rc10 — OSC reliability', '## 0.5.1-rc10 — OSC/music reliability');
s = s.replace('- Saved OSC2 statuses, favorites, module toggles, theme, and Stealth preference locally across restarts.',
    '- Windows media sessions prefer actively playing Spotify, then another actively playing app.\n- Paused/stopped auto-detected tracks no longer qualify for rotating music output.\n- Saved OSC2 statuses, favorites, module toggles, theme, and Stealth preference locally across restarts.');
fs.writeFileSync(changelog, s, 'utf8');
console.log('Applied active playback priorities to Music OSC.');
