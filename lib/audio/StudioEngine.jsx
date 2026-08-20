import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import {
  defaultProject, buildGraph, attachTrack, detachTrack, scheduleStep, stepDur,
  trigger, bounce, downloadBlob, serializeProject, reviveProject, impulse,
  drumTrack, synthTrack, audioTrack, blankPattern,
} from './engine';

const Ctx = createContext(null);
export const useStudio = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStudio must be used inside <StudioEngineProvider>');
  return v;
};

const LOOKAHEAD = 0.12;   // seconds of audio scheduled ahead of the clock
const TICK = 25;          // ms between scheduler wakeups

export function StudioEngineProvider({ children }) {
  const [project, setProject] = useState(defaultProject);
  const [curPattern, setCurPattern] = useState(0);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [step, setStep] = useState(0);
  const [playPattern, setPlayPattern] = useState(0);
  const [ready, setReady] = useState(false);

  // refs mirror state for the audio thread: the scheduler must never
  // read stale React state, and must never trigger a re-render itself
  const engRef = useRef(null);
  const projRef = useRef(project);
  const patRef = useRef(0);
  const timerRef = useRef(null);
  const nextTimeRef = useRef(0);
  const stepRef = useRef(0);
  const chainRef = useRef(0);
  const recRef = useRef(null);
  const patRefPlay = useRef(0);   // pattern the scheduler is currently firing

  projRef.current = project;
  patRef.current = curPattern;

  useEffect(() => {
    if (!selectedTrackId && project.tracks.length) setSelectedTrackId(project.tracks[0].id);
  }, [project.tracks, selectedTrackId]);

  /* ── context boot (must happen inside a user gesture on iOS) ── */
  const ensure = useCallback(() => {
    if (!engRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      engRef.current = buildGraph(ctx, projRef.current);
      setReady(true);
    }
    const { ctx } = engRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    engRef.current.project = projRef.current;
    return engRef.current;
  }, []);

  /* ── transport ─────────────────────────────────────────────── */
  const scheduler = useCallback(() => {
    const eng = engRef.current;
    if (!eng) return;
    eng.project = projRef.current;
    const p = projRef.current;
    const ctx = eng.ctx;
    while (nextTimeRef.current < ctx.currentTime + LOOKAHEAD) {
      const s = stepRef.current, pi = patRefPlay.current, when = nextTimeRef.current;
      scheduleStep(eng, pi, s, when);
      const delay = Math.max(0, (when - ctx.currentTime) * 1000);
      setTimeout(() => { setStep(s); setPlayPattern(pi); }, delay);
      nextTimeRef.current += stepDur(p);
      stepRef.current = s + 1;
      const len = p.patterns[pi] ? p.patterns[pi].steps : 16;
      if (stepRef.current >= len) {
        stepRef.current = 0;
        if (p.songMode && p.song.length) {
          chainRef.current = (chainRef.current + 1) % p.song.length;
          patRefPlay.current = p.song[chainRef.current] || 0;
        } else {
          patRefPlay.current = patRef.current;
        }
      }
    }
  }, []);

  const play = useCallback(() => {
    const eng = ensure();
    if (timerRef.current) return;
    const p = projRef.current;
    stepRef.current = 0; chainRef.current = 0;
    patRefPlay.current = p.songMode ? (p.song[0] || 0) : patRef.current;
    nextTimeRef.current = eng.ctx.currentTime + 0.06;
    setIsPlaying(true);
    timerRef.current = setInterval(scheduler, TICK);
  }, [ensure, scheduler]);

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    setIsPlaying(false);
    setStep(0);
  }, []);

  const togglePlay = useCallback(() => { if (timerRef.current) stop(); else play(); }, [play, stop]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  /* ── project edits ─────────────────────────────────────────── */
  const patch = useCallback(fn => setProject(p => { const n = fn(p); projRef.current = n; return n; }), []);

  const updateTrack = useCallback((id, delta) => {
    patch(p => {
      const tracks = p.tracks.map(t => (t.id === id ? { ...t, ...delta } : t));
      const eng = engRef.current;
      const c = eng && eng.ch[id];
      const t = tracks.find(x => x.id === id);
      if (c && t) {
        if ('volume' in delta) c.g.gain.value = t.volume;
        if ('pan' in delta && c.pan.pan) c.pan.pan.value = t.pan;
        if ('send' in delta) { c.sr.gain.value = t.send.rev; c.sd.gain.value = t.send.dly; }
      }
      return { ...p, tracks };
    });
  }, [patch]);

  const addTrack = useCallback((type = 'audio') => {
    const n = projRef.current.tracks.length + 1;
    const t = type === 'drum' ? drumTrack('Perc ' + n, 'tom')
      : type === 'midi' || type === 'synth' ? synthTrack('Synth ' + n)
        : audioTrack('Audio ' + n);
    patch(p => ({ ...p, tracks: [...p.tracks, t] }));
    if (engRef.current) attachTrack(engRef.current, t);
    setSelectedTrackId(t.id);
    return t;
  }, [patch]);

  const removeTrack = useCallback(id => {
    if (engRef.current) detachTrack(engRef.current, id);
    patch(p => ({
      ...p,
      tracks: p.tracks.filter(t => t.id !== id),
      patterns: p.patterns.map(pt => {
        const clips = { ...pt.clips };
        delete clips[id];
        return { ...pt, clips };
      }),
    }));
  }, [patch]);

  /** Toggle a note. Drums ignore pitch; synths use it. Returns the new note or null when removed. */
  const toggleNote = useCallback((trackId, s, pitch = 60, len = 1, vel = 0.9) => {
    let made = null;
    patch(p => {
      const patterns = p.patterns.map((pt, i) => {
        if (i !== patRef.current) return pt;
        const list = (pt.clips[trackId] || []).slice();
        const track = p.tracks.find(t => t.id === trackId);
        const pitched = track && (track.type === 'midi' || track.type === 'synth');
        const hit = list.findIndex(n => (pitched ? n.p === pitch && s >= n.s && s < n.s + n.l : n.s === s));
        if (hit >= 0) list.splice(hit, 1);
        else { made = { s, l: len, p: pitch, v: vel }; list.push(made); }
        return { ...pt, clips: { ...pt.clips, [trackId]: list } };
      });
      return { ...p, patterns };
    });
    if (made) {
      const eng = ensure();
      const t = projRef.current.tracks.find(x => x.id === trackId);
      if (t) { attachTrack(eng, t); trigger(eng, t, made, eng.ctx.currentTime + 0.02, made.l * stepDur(projRef.current)); }
    }
    return made;
  }, [patch, ensure]);

  const auditionNote = useCallback((trackId, pitch = 60, len = 2) => {
    const eng = ensure();
    const t = projRef.current.tracks.find(x => x.id === trackId);
    if (!t) return;
    attachTrack(eng, t);
    trigger(eng, t, { s: 0, l: len, p: pitch, v: 0.9 }, eng.ctx.currentTime + 0.02, len * stepDur(projRef.current));
  }, [ensure]);

  const setBpm = useCallback(bpm => patch(p => {
    const n = { ...p, bpm: Math.max(40, Math.min(220, bpm || 88)) };
    if (engRef.current) engRef.current.dly.delayTime.value = (60 / n.bpm) * (n.fx.dlyTime / 4);
    return n;
  }), [patch]);

  const setMaster = useCallback(v => patch(p => {
    if (engRef.current) engRef.current.out.gain.value = v;
    return { ...p, master: v };
  }), [patch]);

  const setFx = useCallback(delta => patch(p => {
    const fx = { ...p.fx, ...delta };
    const eng = engRef.current;
    if (eng) {
      if ('revSize' in delta) eng.rev.buffer = impulse(eng.ctx, fx.revSize, 2.6);
      if ('revMix' in delta) eng.revG.gain.value = fx.revMix;
      if ('dlyTime' in delta) eng.dly.delayTime.value = (60 / p.bpm) * (fx.dlyTime / 4);
      if ('dlyFb' in delta) eng.fb.gain.value = fx.dlyFb;
      if ('dlyTone' in delta) eng.tone.frequency.value = fx.dlyTone;
    }
    return { ...p, fx };
  }), [patch]);

  const addPattern = useCallback(() => patch(p => {
    const name = String.fromCharCode(65 + p.patterns.length);
    return { ...p, patterns: [...p.patterns, blankPattern(name, p.patterns[0].steps)] };
  }), [patch]);

  const clearPattern = useCallback(() => patch(p => ({
    ...p,
    patterns: p.patterns.map((pt, i) => (i === patRef.current ? { ...pt, clips: {} } : pt)),
  })), [patch]);

  const setPatternSteps = useCallback(steps => patch(p => ({
    ...p,
    patterns: p.patterns.map((pt, i) => (i === patRef.current ? { ...pt, steps } : pt)),
  })), [patch]);

  /* ── audio in ──────────────────────────────────────────────── */
  const loadSample = useCallback(async (trackId, file) => {
    const eng = ensure();
    const buffer = await eng.ctx.decodeAudioData(await file.arrayBuffer());
    updateTrack(trackId, { buffer, bufferName: file.name });
    return buffer;
  }, [ensure, updateTrack]);

  const toggleRecord = useCallback(async () => {
    if (recRef.current && recRef.current.state === 'recording') { recRef.current.stop(); return; }
    const armed = projRef.current.tracks.find(t => t.recordArmed && t.type === 'audio')
      || projRef.current.tracks.find(t => t.id === selectedTrackId && t.type === 'audio');
    if (!armed) throw new Error('Arm an audio track first.');
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    const rec = new MediaRecorder(stream);
    const chunks = [];
    recRef.current = rec;
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const eng = ensure();
      const buffer = await eng.ctx.decodeAudioData(await new Blob(chunks, { type: rec.mimeType }).arrayBuffer());
      updateTrack(armed.id, { buffer, bufferName: 'Take ' + new Date().toLocaleTimeString() });
      setIsRecording(false);
      recRef.current = null;
    };
    rec.start();
    setIsRecording(true);
  }, [ensure, selectedTrackId, updateTrack]);

  /* ── bounce / save / open ──────────────────────────────────── */
  const exportWav = useCallback(async opts => {
    const eng = ensure();
    const { blob, duration } = await bounce(projRef.current, {
      sampleRate: eng.ctx.sampleRate, patternIndex: patRef.current, ...opts,
    });
    return { blob, duration };
  }, [ensure]);

  const saveProject = useCallback(() => {
    downloadBlob(new Blob([serializeProject(projRef.current)], { type: 'application/json' }),
      (projRef.current.name || 'project') + '.soundforge.json');
  }, []);

  const openProject = useCallback(async file => {
    stop();
    const revived = reviveProject(JSON.parse(await file.text()));
    setProject(revived);
    projRef.current = revived;
    setCurPattern(0);
    setSelectedTrackId(revived.tracks[0] ? revived.tracks[0].id : null);
    if (engRef.current) {
      Object.keys(engRef.current.ch).forEach(id => detachTrack(engRef.current, id));
      revived.tracks.forEach(t => attachTrack(engRef.current, t));
      engRef.current.out.gain.value = revived.master;
    }
    return revived;
  }, [stop]);

  const value = {
    project, setProject: patch, ready, engineRef: engRef,
    curPattern, setCurPattern, playPattern,
    selectedTrackId, setSelectedTrackId,
    isPlaying, isRecording, step, play, stop, togglePlay, ensure,
    updateTrack, addTrack, removeTrack, toggleNote, auditionNote,
    setBpm, setMaster, setFx, addPattern, clearPattern, setPatternSteps,
    loadSample, toggleRecord, exportWav, saveProject, openProject,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
