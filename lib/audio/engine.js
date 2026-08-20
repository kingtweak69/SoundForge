/* SoundForge audio engine — framework-free Web Audio core.
 * Same scheduling code drives the live AudioContext and the
 * OfflineAudioContext used for bouncing, so what you hear is what
 * you export. No React in this file on purpose. */

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const isBlackKey = m => [1, 3, 6, 8, 10].includes(((m % 12) + 12) % 12);
export const noteLabel = m => NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
export const DRUM_KINDS = ['kick', 'snare', 'hat', 'ohat', 'clap', 'tom'];

let uid = 1;
export const nextId = () => 'tk' + (uid++);

/* ── track factories ─────────────────────────────────────────── */
export function drumTrack(name, kind, color) {
  return {
    id: nextId(), name, type: 'drum', kind, color: color || '#00f0ff',
    volume: 0.8, pan: 0, muted: false, soloed: false, recordArmed: false,
    send: { rev: 0.08, dly: 0 }, tune: 0, decay: 1,
  };
}
export function synthTrack(name, patch, color) {
  return Object.assign({
    id: nextId(), name, type: 'midi', color: color || '#ff00ff',
    volume: 0.65, pan: 0, muted: false, soloed: false, recordArmed: false,
    send: { rev: 0.18, dly: 0.12 },
    wave: 'sawtooth', detune: 8, cutoff: 1800, resonance: 6, filterEnv: 0.55,
    attack: 0.005, decay: 0.12, sustain: 0.6, release: 0.25, octave: 0,
  }, patch || {});
}
export function audioTrack(name, color) {
  return {
    id: nextId(), name, type: 'audio', color: color || '#22c55e',
    volume: 0.8, pan: 0, muted: false, soloed: false, recordArmed: false,
    send: { rev: 0.05, dly: 0 }, buffer: null, bufferName: '', rate: 1,
  };
}
export const blankPattern = (name, steps = 16) => ({ name, steps, clips: {} });

export function defaultProject() {
  const tracks = [
    drumTrack('Kick', 'kick', '#00f0ff'),
    drumTrack('Snare', 'snare', '#a855f7'),
    drumTrack('Hi-Hat', 'hat', '#4dabf7'),
    drumTrack('Open Hat', 'ohat', '#ff8a4d'),
    drumTrack('Clap', 'clap', '#ffb627'),
    synthTrack('808 Bass', { cutoff: 700, resonance: 8, octave: -1, volume: 0.7, send: { rev: 0.04, dly: 0 } }, '#ff4d6d'),
    synthTrack('Lead Synth', { wave: 'square', cutoff: 2600, resonance: 4, attack: 0.01, decay: 0.3, sustain: 0.25, release: 0.5, volume: 0.5 }, '#ff00ff'),
    audioTrack('Vocal', '#22c55e'),
  ];
  const A = blankPattern('A', 16);
  const put = (t, steps) => { A.clips[t.id] = steps.map(s => ({ s, l: 1, p: 60, v: 0.9 })); };
  put(tracks[0], [0, 7, 8, 14]);
  put(tracks[1], [4, 12]);
  put(tracks[2], [0, 2, 4, 6, 8, 10, 12, 14]);
  put(tracks[4], [4, 12]);
  A.clips[tracks[5].id] = [
    { s: 0, l: 3, p: 36, v: 1 }, { s: 6, l: 2, p: 36, v: 0.8 },
    { s: 8, l: 3, p: 43, v: 0.9 }, { s: 14, l: 2, p: 41, v: 0.8 },
  ];
  A.clips[tracks[6].id] = [
    { s: 0, l: 4, p: 63, v: 0.5 }, { s: 8, l: 4, p: 67, v: 0.45 }, { s: 12, l: 4, p: 70, v: 0.4 },
  ];
  return {
    name: 'Untitled', bpm: 88, swing: 18, master: 0.9,
    fx: { revSize: 2.4, revMix: 0.9, dlyTime: 3, dlyFb: 0.34, dlyTone: 2600 },
    tracks, patterns: [A, blankPattern('B', 16)], song: [0, 0, 1, 0], songMode: false,
  };
}

/* ── graph construction ──────────────────────────────────────── */
function noiseBuf(ctx) {
  if (ctx._noise) return ctx._noise;
  const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  ctx._noise = b;
  return b;
}
export function impulse(ctx, seconds, decay) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const b = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return b;
}

export function buildGraph(ctx, project) {
  const out = ctx.createGain();
  out.gain.value = project.master;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -2; limiter.knee.value = 0; limiter.ratio.value = 20;
  limiter.attack.value = 0.003; limiter.release.value = 0.12;
  out.connect(limiter); limiter.connect(ctx.destination);
  const masterAnalyser = ctx.createAnalyser();
  masterAnalyser.fftSize = 1024;
  limiter.connect(masterAnalyser);

  const rev = ctx.createConvolver();
  rev.buffer = impulse(ctx, project.fx.revSize, 2.6);
  const revG = ctx.createGain(); revG.gain.value = project.fx.revMix;
  rev.connect(revG); revG.connect(out);

  const dly = ctx.createDelay(2), fb = ctx.createGain(), tone = ctx.createBiquadFilter();
  tone.type = 'lowpass'; tone.frequency.value = project.fx.dlyTone;
  dly.connect(tone); tone.connect(fb); fb.connect(dly); dly.connect(out);
  fb.gain.value = project.fx.dlyFb;
  dly.delayTime.value = (60 / project.bpm) * (project.fx.dlyTime / 4);

  const ch = {};
  for (const t of project.tracks) ch[t.id] = channel(ctx, t, out, rev, dly);
  return { ctx, project, out, limiter, masterAnalyser, rev, revG, dly, fb, tone, ch };
}
function channel(ctx, t, out, rev, dly) {
  const g = ctx.createGain(); g.gain.value = t.volume;
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
  if (pan.pan) pan.pan.value = t.pan;
  const sr = ctx.createGain(); sr.gain.value = t.send.rev;
  const sd = ctx.createGain(); sd.gain.value = t.send.dly;
  const analyser = ctx.createAnalyser(); analyser.fftSize = 512;
  g.connect(pan); pan.connect(out); pan.connect(analyser);
  pan.connect(sr); sr.connect(rev); pan.connect(sd); sd.connect(dly);
  return { g, pan, sr, sd, analyser };
}
/** Add a channel for a track created after the graph was built — no rebuild, no audio dropout. */
export function attachTrack(eng, t) {
  if (eng.ch[t.id]) return eng.ch[t.id];
  eng.ch[t.id] = channel(eng.ctx, t, eng.out, eng.rev, eng.dly);
  return eng.ch[t.id];
}
export function detachTrack(eng, id) {
  const c = eng.ch[id];
  if (!c) return;
  try { c.g.disconnect(); c.pan.disconnect(); c.sr.disconnect(); c.sd.disconnect(); } catch (e) { /* already gone */ }
  delete eng.ch[id];
}

/* ── voices ──────────────────────────────────────────────────── */
function ampEnv(param, t, peak, a, d, s, r, dur) {
  const floor = 0.0001;
  param.cancelScheduledValues(t);
  param.setValueAtTime(floor, t);
  param.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
  param.exponentialRampToValueAtTime(Math.max(0.0002, peak * s), t + a + d);
  param.setValueAtTime(Math.max(0.0002, peak * s), t + Math.max(a + d, dur));
  param.exponentialRampToValueAtTime(floor, t + Math.max(a + d, dur) + r);
}

export function playDrum(eng, t, note, time) {
  const ctx = eng.ctx, dest = eng.ch[t.id] && eng.ch[t.id].g;
  if (!dest) return;
  const v = note.v, tune = Math.pow(2, (t.tune || 0) / 12), dk = t.decay || 1;
  const g = ctx.createGain(); g.connect(dest);

  if (t.kind === 'kick') {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(150 * tune, time);
    o.frequency.exponentialRampToValueAtTime(44 * tune, time + 0.11 * dk);
    const click = ctx.createOscillator(); click.type = 'triangle'; click.frequency.value = 1100 * tune;
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(0.5 * v, time); cg.gain.exponentialRampToValueAtTime(0.001, time + 0.012);
    click.connect(cg); cg.connect(g);
    g.gain.setValueAtTime(v, time); g.gain.exponentialRampToValueAtTime(0.001, time + 0.42 * dk);
    o.connect(g); o.start(time); o.stop(time + 0.5 * dk);
    click.start(time); click.stop(time + 0.05);
  } else if (t.kind === 'snare' || t.kind === 'clap') {
    const n = ctx.createBufferSource(); n.buffer = noiseBuf(ctx); n.playbackRate.value = tune;
    const f = ctx.createBiquadFilter();
    f.type = t.kind === 'clap' ? 'bandpass' : 'highpass';
    f.frequency.value = t.kind === 'clap' ? 1150 * tune : 1400 * tune;
    f.Q.value = t.kind === 'clap' ? 2.2 : 0.8;
    n.connect(f); f.connect(g);
    const len = (t.kind === 'clap' ? 0.22 : 0.19) * dk;
    g.gain.setValueAtTime(v * (t.kind === 'clap' ? 0.9 : 0.75), time);
    g.gain.exponentialRampToValueAtTime(0.001, time + len);
    if (t.kind === 'snare') {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 185 * tune;
      const og = ctx.createGain();
      og.gain.setValueAtTime(v * 0.45, time); og.gain.exponentialRampToValueAtTime(0.001, time + 0.11 * dk);
      o.connect(og); og.connect(dest); o.start(time); o.stop(time + 0.2 * dk);
    }
    n.start(time); n.stop(time + len + 0.05);
  } else if (t.kind === 'hat' || t.kind === 'ohat') {
    const n = ctx.createBufferSource(); n.buffer = noiseBuf(ctx); n.playbackRate.value = tune;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7200 * tune;
    n.connect(f); f.connect(g);
    const len = (t.kind === 'hat' ? 0.055 : 0.34) * dk;
    g.gain.setValueAtTime(v * 0.42, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + len);
    n.start(time); n.stop(time + len + 0.05);
  } else {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(260 * tune, time);
    o.frequency.exponentialRampToValueAtTime(90 * tune, time + 0.18 * dk);
    g.gain.setValueAtTime(v * 0.9, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.3 * dk);
    o.connect(g); o.start(time); o.stop(time + 0.4 * dk);
  }
}

export function playSynth(eng, t, note, time, dur) {
  const ctx = eng.ctx, dest = eng.ch[t.id] && eng.ch[t.id].g;
  if (!dest) return;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = t.resonance;
  const amp = ctx.createGain(); amp.gain.value = 0;
  f.connect(amp); amp.connect(dest);
  const hz = mtof(note.p + (t.octave || 0) * 12);
  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
  o1.type = t.wave; o2.type = t.wave;
  o1.frequency.value = hz; o2.frequency.value = hz; o2.detune.value = t.detune;
  const m1 = ctx.createGain(), m2 = ctx.createGain();
  m1.gain.value = 0.5; m2.gain.value = 0.5;
  o1.connect(m1); m1.connect(f); o2.connect(m2); m2.connect(f);
  const base = clamp(t.cutoff, 60, 18000);
  const peak = clamp(t.cutoff * (1 + t.filterEnv * 3), 60, 18000);
  f.frequency.cancelScheduledValues(time);
  f.frequency.setValueAtTime(base, time);
  f.frequency.exponentialRampToValueAtTime(peak, time + 0.008);
  f.frequency.exponentialRampToValueAtTime(base, time + 0.008 + t.decay + 0.05);
  ampEnv(amp.gain, time, note.v * 0.6, t.attack, t.decay, t.sustain, t.release, dur);
  const end = time + Math.max(t.attack + t.decay, dur) + t.release + 0.05;
  o1.start(time); o2.start(time); o1.stop(end); o2.stop(end);
}

export function playClip(eng, t, note, time) {
  if (!t.buffer) return;
  const c = eng.ch[t.id]; if (!c) return;
  const s = eng.ctx.createBufferSource();
  s.buffer = t.buffer; s.playbackRate.value = t.rate || 1;
  s.connect(c.g); s.start(time);
}

export function trigger(eng, t, note, time, dur) {
  if (t.type === 'drum') playDrum(eng, t, note, time);
  else if (t.type === 'midi' || t.type === 'synth') playSynth(eng, t, note, time, dur);
  else playClip(eng, t, note, time);
}

/* ── timing ──────────────────────────────────────────────────── */
export const stepDur = p => (60 / p.bpm) / 4;
export const swingOffset = (p, step) => (step % 2 === 1 ? stepDur(p) * (p.swing / 100) * 0.9 : 0);
const anySolo = p => p.tracks.some(t => t.soloed);
export const audible = (p, t) => (anySolo(p) ? t.soloed : !t.muted);

export function scheduleStep(eng, patIdx, step, time) {
  const p = eng.project, pat = p.patterns[patIdx];
  if (!pat) return;
  for (const t of p.tracks) {
    if (!audible(p, t)) continue;
    const notes = pat.clips[t.id];
    if (!notes) continue;
    for (const n of notes) {
      if (n.s !== step) continue;
      trigger(eng, t, n, time + swingOffset(p, step), Math.max(0.05, n.l * stepDur(p)));
    }
  }
}

/* ── offline bounce ──────────────────────────────────────────── */
export async function bounce(project, { sampleRate = 44100, tail = 2.2, patternIndex = 0, onProgress } = {}) {
  const list = project.songMode ? project.song.slice() : [patternIndex];
  const totalSteps = list.reduce((a, i) => a + (project.patterns[i] ? project.patterns[i].steps : 0), 0);
  const dur = totalSteps * stepDur(project) + tail;
  const OfflineCtor = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const off = new OfflineCtor(2, Math.ceil(sampleRate * dur), sampleRate);
  const eng = buildGraph(off, project);
  let t = 0.05;
  for (const pi of list) {
    const pat = project.patterns[pi];
    if (!pat) continue;
    for (let s = 0; s < pat.steps; s++) { scheduleStep(eng, pi, s, t); t += stepDur(project); }
    if (onProgress) onProgress(list.indexOf(pi) / list.length);
  }
  const rendered = await off.startRendering();
  return { buffer: rendered, blob: encodeWav(rendered), duration: dur };
}

export function encodeWav(buf) {
  const n = buf.length, ch = Math.min(2, buf.numberOfChannels);
  const ab = new ArrayBuffer(44 + n * ch * 2), v = new DataView(ab);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * ch * 2, true);
  v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, n * ch * 2, true);
  const chans = [];
  for (let c = 0; c < ch; c++) chans.push(buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      const x = clamp(chans[c][i], -1, 1);
      v.setInt16(o, x < 0 ? x * 32768 : x * 32767, true);
      o += 2;
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}

export function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}

/* ── project (de)serialization — buffers can't ride along ────── */
export function serializeProject(p) {
  return JSON.stringify({
    ...p,
    tracks: p.tracks.map(t => ({ ...t, buffer: undefined })),
  }, null, 1);
}
export function reviveProject(obj) {
  const p = { ...defaultProject(), ...obj };
  p.tracks = p.tracks.map(t => (t.type === 'audio' ? { ...t, buffer: null, bufferName: '' } : t));
  return p;
}
