import assert from 'node:assert/strict';
import { clipOscLine, renderCombinedOsc } from './oscComposer.mjs';

const good = renderCombinedOsc({
    status: 'We own the night',
    title: 'Emergence',
    artist: 'Sleep Token',
    time: '2:34/6:26',
    temperature: '69°F',
    condition: 'Cloudy',
    isPlaying: true,
    enabled: { status: true, music: true, weather: true }
});
assert.equal(good.split('\n').length, 3);
assert.match(good, /🕷 We own the night/);
assert.match(good, /🎵 Emergence — Sleep Token · 2:34\/6:26/);
assert.match(good, /🌤 69°F · Cloudy/);
assert.ok(good.length <= 144);
const veryLong = renderCombinedOsc({
    status: '👻'.repeat(80),
    title: '🔥'.repeat(110),
    artist: 'A'.repeat(120),
    time: '12:34/23:45',
    temperature: '115°F',
    condition: 'Violent thunderstorms',
    isPlaying: true
});
assert.equal(veryLong.split('\n').length, 3, 'Do not drop core modules when clipping');
assert.ok(veryLong.length <= 144, 'Respect chatbox length including surrogate pairs');
for (const prefix of ['🕷 ', '🎵 ', '🌤 ']) assert.ok(veryLong.split('\n').some(x=>x.startsWith(prefix)));
const idle = renderCombinedOsc();
assert.match(idle, /Not playing/);
assert.match(idle, /Weather unavailable/);
assert.equal(renderCombinedOsc({enabled:{weather:false}}).split('\n').length, 2);
assert.equal(renderCombinedOsc({enabled:{music:false,status:false,weather:false}}), '');
assert.ok(clipOscLine('🙂'.repeat(120), 20).length <= 20);
console.log('OSC simultaneous status + music + weather composer: 8 assertions passed.');
