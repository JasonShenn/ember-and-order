// audio.js — all sound is synthesized with WebAudio: no audio files, no network.
// Short blips for picking up, a chop thock, grill sizzle, a service bell and a
// sad trombone-ish buzz for a lost ticket. Created lazily on first user gesture.

let ctx = null;
let muted = false;
let sizzleNodes = null;

export function setMuted(value) {
  muted = value;
  if (muted) stopSizzle();
}

export function isMuted() {
  return muted;
}

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ensureCtx();
}

function tone(freq, dur, type = 'sine', gain = 0.12, when = 0, slideTo = null) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, gain = 0.15, filterFreq = 1800) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(ac.destination);
  src.start();
}

export const sfx = {
  pickup() { tone(520, 0.07, 'triangle', 0.1); },
  place() { tone(340, 0.08, 'triangle', 0.1); noiseBurst(0.05, 0.06, 900); },
  chop() { noiseBurst(0.09, 0.22, 1400); tone(180, 0.06, 'square', 0.05); },
  done() { tone(880, 0.09, 'sine', 0.1); tone(1320, 0.12, 'sine', 0.08, 0.09); },
  serve() { tone(1046, 0.12, 'sine', 0.12); tone(1568, 0.2, 'sine', 0.1, 0.1); },
  bell() { tone(1568, 0.35, 'sine', 0.14); tone(2093, 0.4, 'sine', 0.08, 0.05); },
  error() { tone(160, 0.22, 'sawtooth', 0.08, 0, 110); },
  burnt() { tone(220, 0.3, 'sawtooth', 0.07, 0, 90); noiseBurst(0.2, 0.08, 500); },
  ticket() { tone(660, 0.08, 'triangle', 0.09); tone(880, 0.1, 'triangle', 0.09, 0.08); },
  click() { tone(700, 0.04, 'triangle', 0.06); },
  levelClear() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'sine', 0.11, i * 0.11));
  },
  gameOver() {
    [392, 330, 262].forEach((f, i) => tone(f, 0.25, 'triangle', 0.1, i * 0.2));
  },
};

// A soft looping sizzle while any grill/pot is working. Started/stopped by main.
export function startSizzle() {
  if (muted || sizzleNodes) return;
  const ac = ensureCtx();
  if (!ac) return;
  const len = ac.sampleRate;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3500;
  const g = ac.createGain();
  g.gain.value = 0.018;
  src.connect(filter).connect(g).connect(ac.destination);
  src.start();
  sizzleNodes = { src, g };
}

export function stopSizzle() {
  if (!sizzleNodes) return;
  try { sizzleNodes.src.stop(); } catch { /* already stopped */ }
  sizzleNodes = null;
}
