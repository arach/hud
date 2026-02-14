/**
 * HUD Sound Library
 *
 * Minimal, tactile UI sounds generated with Web Audio API.
 * No audio files needed — everything is synthesized.
 */

let audioCtx: AudioContext | null = null;
let _muted = localStorage.getItem('hud_sounds') !== 'on'; // muted by default

export function isMuted(): boolean { return _muted; }

export function setMuted(muted: boolean) {
  _muted = muted;
  localStorage.setItem('hud_sounds', muted ? 'off' : 'on');
}

export function toggleMute(): boolean {
  setMuted(!_muted);
  return _muted;
}

function getCtx(): AudioContext | null {
  if (_muted) return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getCtxForce(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ── Helpers ──────────────────────────────────────────────

function tone(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  vol: number,
  attack: number,
  hold: number,
  decay: number,
  startAt: number
) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = startAt;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.setValueAtTime(vol, t + attack + hold);
  g.gain.exponentialRampToValueAtTime(0.001, t + attack + hold + decay);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + attack + hold + decay + 0.01);
  return o;
}

function noise(ctx: AudioContext, duration: number, vol: number, startAt: number, filterFreq?: number) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, startAt);
  g.gain.linearRampToValueAtTime(vol, startAt + 0.002);
  g.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  if (filterFreq) {
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = filterFreq;
    f.Q.value = 1.2;
    src.connect(f).connect(g).connect(ctx.destination);
  } else {
    src.connect(g).connect(ctx.destination);
  }
  src.start(startAt);
  src.stop(startAt + duration + 0.01);
}

// ── Sounds ───────────────────────────────────────────────

/** Soft click — button press, toggle */
export function click() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    tone(ctx, 'sine', 1400, 0.18, 0.001, 0, 0.035, t);
    tone(ctx, 'sine', 600, 0.05, 0.001, 0, 0.025, t);
  } catch {}
}

/** Thock — window focus, panel open */
export function thock() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    tone(ctx, 'sine', 150, 0.18, 0.001, 0, 0.06, t);
    tone(ctx, 'triangle', 800, 0.1, 0.001, 0, 0.03, t);
    noise(ctx, 0.02, 0.05, t, 4000);
  } catch {}
}

/** Rising blip — task complete, success */
export function blipUp() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(500, t);
    o.frequency.exponentialRampToValueAtTime(1000, t + 0.06);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.11);
  } catch {}
}

/** Falling blip — dismiss, close */
export function blipDown() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(800, t);
    o.frequency.exponentialRampToValueAtTime(350, t + 0.07);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.14, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.11);
  } catch {}
}

/** Pop — command palette, modal open */
export function pop() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(350, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.01);
    o.frequency.exponentialRampToValueAtTime(650, t + 0.06);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.09);
  } catch {}
}

/** Two-tone confirm — save, commit */
export function confirm() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    tone(ctx, 'sine', 523, 0.14, 0.003, 0.02, 0.06, t);
    tone(ctx, 'sine', 784, 0.14, 0.003, 0.02, 0.1, t + 0.06);
  } catch {}
}

/** Soft error — validation fail */
export function error() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    tone(ctx, 'sine', 400, 0.13, 0.003, 0.02, 0.06, t);
    tone(ctx, 'sine', 300, 0.13, 0.003, 0.02, 0.08, t + 0.06);
  } catch {}
}

/** Whoosh — context switch, transition */
export function whoosh() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    noise(ctx, 0.12, 0.08, t, 2500);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(250, t);
    o.frequency.exponentialRampToValueAtTime(700, t + 0.04);
    o.frequency.exponentialRampToValueAtTime(400, t + 0.12);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.13);
  } catch {}
}

/** Ascending chime — activation, welcome. Always plays. */
export function chime() {
  try {
    const ctx = getCtxForce();
    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      tone(ctx, 'sine', freq, 0.14, 0.005, 0.02, 0.25, t + i * 0.08);
    });
  } catch {}
}

/** Tick — checkbox, step progress */
export function tick() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    tone(ctx, 'sine', 1800, 0.1, 0.001, 0, 0.025, t);
    noise(ctx, 0.012, 0.04, t, 6000);
  } catch {}
}

/** Slide in — drawer open */
export function slideIn() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(400, t);
    o.frequency.exponentialRampToValueAtTime(750, t + 0.05);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.1);
  } catch {}
}

/** Slide out — drawer close */
export function slideOut() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(650, t);
    o.frequency.exponentialRampToValueAtTime(350, t + 0.05);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.09);
  } catch {}
}

/** Boot — system init */
export function boot() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    tone(ctx, 'sine', 440, 0.1, 0.003, 0.01, 0.05, t);
    tone(ctx, 'sine', 554, 0.1, 0.003, 0.01, 0.05, t + 0.04);
    tone(ctx, 'sine', 659, 0.1, 0.003, 0.01, 0.05, t + 0.08);
    tone(ctx, 'sine', 880, 0.12, 0.005, 0.03, 0.15, t + 0.14);
  } catch {}
}

/** Ping — notification, alert */
export function ping() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    tone(ctx, 'sine', 880, 0.14, 0.002, 0.03, 0.18, t);
    tone(ctx, 'sine', 1320, 0.05, 0.002, 0.01, 0.1, t);
  } catch {}
}

/** Type — keyboard keystroke. Creamy mechanical key. */
export function type() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const p = 0.92 + Math.random() * 0.16;
    const v = 0.85 + Math.random() * 0.3;
    noise(ctx, 0.022, 0.06 * v, t, 3500 * p);
    tone(ctx, 'sine', 180 * p, 0.06 * v, 0.001, 0, 0.025, t);
    tone(ctx, 'sine', 2200 * p, 0.03 * v, 0.001, 0, 0.01, t);
  } catch {}
}

// ── Convenience map ──────────────────────────────────────

export const sounds = {
  click,
  thock,
  blipUp,
  blipDown,
  pop,
  confirm,
  error,
  whoosh,
  chime,
  tick,
  slideIn,
  slideOut,
  boot,
  ping,
  type,
} as const;

export type SoundName = keyof typeof sounds;

/** Play a sound by name, bypassing mute (for dev preview) */
export function preview(name: SoundName) {
  const wasMuted = _muted;
  _muted = false;
  try { sounds[name](); } finally { _muted = wasMuted; }
}
