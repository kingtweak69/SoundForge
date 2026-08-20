import React, { useRef } from 'react';
import { Upload, Play } from 'lucide-react';
import { useStudio } from '@/lib/audio/StudioEngine';
import { DRUM_KINDS } from '@/lib/audio/engine';

function Slider({ label, value, min, max, step = 1, fmt, onChange }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-neon-cyan">{fmt ? fmt(value) : value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-neon-cyan"
        aria-label={label}
      />
    </div>
  );
}

/** Editor for whichever track is selected — the sound design half of the studio. */
export default function InstrumentPanel() {
  const { project, selectedTrackId, updateTrack, auditionNote, loadSample } = useStudio();
  const track = project.tracks.find(t => t.id === selectedTrackId);
  const fileRef = useRef(null);

  if (!track) return null;
  const set = patch => updateTrack(track.id, patch);
  const isSynth = track.type === 'midi' || track.type === 'synth';

  return (
    <div className="w-[230px] shrink-0 border-l border-studio-border bg-studio-panel overflow-y-auto p-3 space-y-4 hidden lg:block">
      <input ref={fileRef} type="file" accept="audio/*" hidden
        onChange={async e => { const f = e.target.files[0]; if (f) await loadSample(track.id, f); e.target.value = ''; }} />

      <div className="flex items-center gap-2">
        <div className="w-2 h-6 rounded-sm" style={{ background: track.color }} />
        <div className="min-w-0">
          <p className="text-xs font-medium truncate">{track.name}</p>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {track.type === 'drum' ? track.kind : track.type}
          </span>
        </div>
        <button
          onClick={() => auditionNote(track.id, isSynth ? 60 : 60, 2)}
          className="ml-auto w-7 h-7 grid place-items-center rounded glass hover:bg-neon-cyan/20 hover:text-neon-cyan"
          title="Audition"
        ><Play size={12} /></button>
      </div>

      {track.type === 'drum' && (
        <div className="space-y-3">
          <div>
            <span className="text-[10px] text-muted-foreground">Voice</span>
            <select
              value={track.kind} onChange={e => set({ kind: e.target.value })}
              className="w-full mt-1 bg-studio-panel2 border border-studio-border rounded px-2 py-1.5 text-xs"
            >
              {DRUM_KINDS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <Slider label="Tune" value={track.tune} min={-24} max={24} fmt={v => `${v > 0 ? '+' : ''}${v} st`} onChange={v => set({ tune: v })} />
          <Slider label="Decay" value={track.decay} min={0.2} max={3} step={0.01} fmt={v => `${v.toFixed(2)}x`} onChange={v => set({ decay: v })} />
        </div>
      )}

      {isSynth && (
        <div className="space-y-4">
          <div className="space-y-3">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Oscillator</span>
            <select
              value={track.wave} onChange={e => set({ wave: e.target.value })}
              className="w-full bg-studio-panel2 border border-studio-border rounded px-2 py-1.5 text-xs"
            >
              {['sawtooth', 'square', 'triangle', 'sine'].map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <Slider label="Detune" value={track.detune} min={0} max={40} fmt={v => `${v} ct`} onChange={v => set({ detune: v })} />
            <Slider label="Octave" value={track.octave} min={-2} max={2} fmt={v => `${v > 0 ? '+' : ''}${v}`} onChange={v => set({ octave: v })} />
          </div>

          <div className="space-y-3 border-t border-studio-border pt-3">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Filter</span>
            <Slider label="Cutoff" value={track.cutoff} min={80} max={12000} step={10} fmt={v => `${Math.round(v)} Hz`} onChange={v => set({ cutoff: v })} />
            <Slider label="Resonance" value={track.resonance} min={0} max={22} step={0.5} fmt={v => v.toFixed(1)} onChange={v => set({ resonance: v })} />
            <Slider label="Env amount" value={track.filterEnv} min={0} max={1} step={0.01} fmt={v => `${Math.round(v * 100)}%`} onChange={v => set({ filterEnv: v })} />
          </div>

          <div className="space-y-3 border-t border-studio-border pt-3">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Amp envelope</span>
            <Slider label="Attack" value={track.attack} min={0.001} max={0.6} step={0.001} fmt={v => `${Math.round(v * 1000)} ms`} onChange={v => set({ attack: v })} />
            <Slider label="Decay" value={track.decay} min={0.01} max={1.5} step={0.01} fmt={v => `${Math.round(v * 1000)} ms`} onChange={v => set({ decay: v })} />
            <Slider label="Sustain" value={track.sustain} min={0} max={1} step={0.01} fmt={v => `${Math.round(v * 100)}%`} onChange={v => set({ sustain: v })} />
            <Slider label="Release" value={track.release} min={0.01} max={3} step={0.01} fmt={v => `${Math.round(v * 1000)} ms`} onChange={v => set({ release: v })} />
          </div>
        </div>
      )}

      {track.type === 'audio' && (
        <div className="space-y-3">
          <p className="text-[10px] text-muted-foreground break-words">{track.bufferName || 'No sample loaded'}</p>
          <button onClick={() => fileRef.current.click()} className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded glass text-xs hover:bg-white/10">
            <Upload size={12} /> Load sample
          </button>
          <Slider label="Speed" value={track.rate} min={0.25} max={4} step={0.01} fmt={v => `${v.toFixed(2)}x`} onChange={v => set({ rate: v })} />
          <p className="text-[10px] text-muted-foreground">
            Arm this track with R, then hit record in the transport to capture a take.
          </p>
        </div>
      )}

      <div className="space-y-3 border-t border-studio-border pt-3">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Sends</span>
        <Slider label="Reverb" value={track.send.rev} min={0} max={1} step={0.01} fmt={v => `${Math.round(v * 100)}%`} onChange={v => set({ send: { ...track.send, rev: v } })} />
        <Slider label="Delay" value={track.send.dly} min={0} max={1} step={0.01} fmt={v => `${Math.round(v * 100)}%`} onChange={v => set({ send: { ...track.send, dly: v } })} />
      </div>
    </div>
  );
}
