import React, { useState } from 'react';
import { Trash2, Grid3x3, Music2 } from 'lucide-react';
import { useStudio } from '@/lib/audio/StudioEngine';
import { noteLabel, isBlackKey } from '@/lib/audio/engine';

const LOW = 36, HIGH = 72;              // C2..C5
const PITCHES = Array.from({ length: HIGH - LOW + 1 }, (_, i) => HIGH - i);
const CELL_H = 18;
const CELL_W = 28;

export default function PianoRoll({ onClose }) {
  const {
    project, curPattern, selectedTrackId, setSelectedTrackId,
    toggleNote, auditionNote, isPlaying, step, playPattern, setProject,
  } = useStudio();
  const [len, setLen] = useState(2);

  const pitched = project.tracks.filter(t => t.type === 'midi' || t.type === 'synth');
  const track = pitched.find(t => t.id === selectedTrackId) || pitched[0];
  const pattern = project.patterns[curPattern];
  const cols = pattern.steps;
  const notes = (track && pattern.clips[track.id]) || [];
  const live = isPlaying && playPattern === curPattern;

  if (!track) {
    return (
      <div className="h-full grid place-items-center glass-strong rounded-lg text-muted-foreground text-sm">
        No instrument tracks yet — add one from the mixer or arrangement view.
      </div>
    );
  }

  const clearTrack = () => setProject(p => ({
    ...p,
    patterns: p.patterns.map((pt, i) => (i === curPattern ? { ...pt, clips: { ...pt.clips, [track.id]: [] } } : pt)),
  }));

  return (
    <div className="flex flex-col h-full glass-strong rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-studio-border flex-wrap">
        <Music2 size={16} className="text-neon-cyan" />
        <span className="font-display font-semibold text-sm">Piano Roll</span>

        <select
          value={track.id} onChange={e => setSelectedTrackId(e.target.value)}
          className="bg-studio-panel2 border border-studio-border rounded px-2 py-1 text-xs"
        >
          {pitched.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-muted-foreground">Length</span>
          <select
            value={len} onChange={e => setLen(Number(e.target.value))}
            className="bg-studio-panel2 border border-studio-border rounded px-2 py-1 text-xs"
          >
            <option value={1}>1/16</option><option value={2}>1/8</option>
            <option value={4}>1/4</option><option value={8}>1/2</option><option value={16}>1 bar</option>
          </select>
        </div>

        <div className="ml-auto flex gap-2">
          <button onClick={clearTrack} className="flex items-center gap-1 px-2 py-1 rounded text-xs glass hover:bg-white/10">
            <Trash2 size={12} /> Clear track
          </button>
          {onClose && (
            <button onClick={onClose} className="w-7 h-7 grid place-items-center rounded glass hover:bg-white/10 text-muted-foreground">✕</button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-auto">
        <div className="sticky left-0 z-10 bg-studio-panel border-r border-studio-border">
          {PITCHES.map(m => (
            <button
              key={m} onClick={() => auditionNote(track.id, m, len)}
              className="flex items-center px-2 text-[9px] font-mono border-b border-studio-border/40 w-14 hover:bg-white/5"
              style={{
                height: CELL_H,
                background: isBlackKey(m) ? 'hsl(240 14% 8%)' : 'transparent',
                color: isBlackKey(m) ? '#6b7280' : '#cbd5e1',
              }}
            >{noteLabel(m)}</button>
          ))}
        </div>

        <div className="relative" style={{ width: cols * CELL_W }}>
          <div className="absolute inset-0 flex pointer-events-none">
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c} className="shrink-0 border-r border-studio-border/40"
                style={{
                  width: CELL_W,
                  background: live && step === c ? 'hsl(186 100% 50% / 0.14)'
                    : c % 4 === 0 ? 'hsl(270 91% 65% / 0.05)' : 'transparent',
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0 pointer-events-none">
            {PITCHES.map(m => (
              <div key={m} className="border-b border-studio-border/40"
                style={{ height: CELL_H, background: isBlackKey(m) ? 'hsl(240 14% 10% / 0.4)' : 'transparent' }} />
            ))}
          </div>

          {notes.map((n, i) => (
            <div
              key={i}
              className="absolute rounded-sm border cursor-pointer"
              style={{
                left: n.s * CELL_W,
                top: (HIGH - n.p) * CELL_H,
                width: n.l * CELL_W - 2,
                height: CELL_H - 2,
                background: `${track.color}${Math.round(60 + n.v * 40).toString(16)}`,
                borderColor: track.color,
                boxShadow: `0 0 6px ${track.color}66`,
                pointerEvents: 'none',
              }}
            />
          ))}

          <div className="absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${cols}, ${CELL_W}px)`, gridTemplateRows: `repeat(${PITCHES.length}, ${CELL_H}px)` }}>
            {Array.from({ length: cols * PITCHES.length }).map((_, idx) => {
              const col = idx % cols;
              const row = Math.floor(idx / cols);
              const pitch = HIGH - row;
              return (
                <div
                  key={idx}
                  onClick={() => toggleNote(track.id, col, pitch, len, 0.9)}
                  className="hover:bg-neon-cyan/10"
                  style={{ gridColumn: col + 1, gridRow: row + 1 }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="h-16 border-t border-studio-border px-4 py-2 flex items-end gap-[3px] overflow-x-auto">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground mr-2 self-center shrink-0">Velocity</span>
        {notes.slice().sort((a, b) => a.s - b.s).map((n, i) => (
          <button
            key={i}
            onClick={() => setProject(p => ({
              ...p,
              patterns: p.patterns.map((pt, pi) => {
                if (pi !== curPattern) return pt;
                const list = (pt.clips[track.id] || []).map(x =>
                  (x === n ? { ...x, v: x.v > 0.85 ? 0.4 : Math.min(1, x.v + 0.2) } : x));
                return { ...pt, clips: { ...pt.clips, [track.id]: list } };
              }),
            }))}
            className="w-2.5 rounded-sm shrink-0"
            style={{ height: `${n.v * 100}%`, background: track.color, boxShadow: `0 0 4px ${track.color}` }}
            title={`${noteLabel(n.p)} · vel ${Math.round(n.v * 100)} — tap to cycle`}
          />
        ))}
        {notes.length === 0 && <span className="text-[10px] text-muted-foreground self-center">Tap the grid to write notes.</span>}
      </div>
    </div>
  );
}
