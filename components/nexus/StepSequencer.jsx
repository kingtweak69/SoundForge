import React from 'react';
import { Plus, Grid3x3, Trash2 } from 'lucide-react';
import { useStudio } from '@/lib/audio/StudioEngine';

/* Step grid for everything that isn't a pitched instrument:
 * drum voices and audio tracks. Pitched tracks live in the piano roll. */
export default function StepSequencer() {
  const {
    project, curPattern, setCurPattern, addPattern, clearPattern, setPatternSteps,
    toggleNote, addTrack, selectedTrackId, setSelectedTrackId,
    isPlaying, step, playPattern,
  } = useStudio();

  const pattern = project.patterns[curPattern];
  const steps = pattern.steps;
  const rows = project.tracks.filter(t => t.type === 'drum' || t.type === 'audio');
  const live = isPlaying && playPattern === curPattern;

  const hasNote = (id, s) => (pattern.clips[id] || []).some(n => n.s === s);

  return (
    <div className="flex flex-col h-full glass-strong rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-studio-border flex-wrap">
        <Grid3x3 size={16} className="text-neon-purple" />
        <span className="font-display font-semibold text-sm">Step Sequencer — Pattern {pattern.name}</span>

        <div className="flex gap-1 ml-2">
          {project.patterns.map((p, i) => (
            <button
              key={i} onClick={() => setCurPattern(i)}
              className={`w-7 h-7 rounded text-xs ${i === curPattern ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/40' : 'glass text-muted-foreground'}`}
            >{p.name}</button>
          ))}
          <button onClick={addPattern} className="w-7 h-7 rounded text-xs glass text-muted-foreground hover:text-neon-purple" title="New pattern">+</button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <select
            value={steps} onChange={e => setPatternSteps(Number(e.target.value))}
            className="bg-studio-panel2 border border-studio-border rounded px-2 py-1 text-xs"
          >
            <option value={16}>1 bar</option>
            <option value={32}>2 bars</option>
            <option value={64}>4 bars</option>
          </select>
          <button onClick={clearPattern} className="flex items-center gap-1 px-2 py-1 rounded text-xs glass hover:bg-white/10">
            <Trash2 size={12} /> Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex gap-3 p-3 min-w-min">
          <div className="w-32 shrink-0">
            <div className="h-6 mb-1" />
            {rows.map(t => (
              <button
                key={t.id} onClick={() => setSelectedTrackId(t.id)}
                className={`flex items-center gap-2 h-10 mb-1 px-2 rounded glass w-full text-left ${selectedTrackId === t.id ? 'ring-1 ring-neon-cyan/50' : ''}`}
              >
                <div className="w-3 h-7 rounded-sm shrink-0" style={{ background: t.color, boxShadow: `0 0 5px ${t.color}` }} />
                <span className="text-xs font-medium truncate">{t.name}</span>
              </button>
            ))}
          </div>

          <div>
            <div className="flex h-6 mb-1">
              {Array.from({ length: steps }).map((_, s) => (
                <div key={s} className="w-9 mr-1 text-center text-[9px] font-mono text-muted-foreground/70">
                  {s % 4 === 0 ? s / 4 + 1 : ''}
                </div>
              ))}
            </div>
            {rows.map(t => (
              <div key={t.id} className="flex mb-1">
                {Array.from({ length: steps }).map((_, s) => {
                  const on = hasNote(t.id, s);
                  const now = live && step === s;
                  return (
                    <button
                      key={s} onClick={() => toggleNote(t.id, s)}
                      className={`w-9 h-10 mr-1 rounded-md transition ${on ? 'box-glow-cyan' : 'border border-studio-border bg-studio-panel2 hover:bg-white/5'} ${now ? 'ring-2 ring-white/70' : ''} ${s % 4 === 0 && !on ? 'bg-white/[0.04]' : ''}`}
                      style={on ? { background: `${t.color}99`, borderColor: t.color } : {}}
                      title={`${t.name} · step ${s + 1}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-studio-border p-3 flex gap-2">
        <button onClick={() => addTrack('drum')} className="flex items-center gap-1 px-3 py-1.5 rounded glass text-xs hover:bg-white/10">
          <Plus size={12} /> Drum channel
        </button>
        <button onClick={() => addTrack('audio')} className="flex items-center gap-1 px-3 py-1.5 rounded glass text-xs hover:bg-white/10">
          <Plus size={12} /> Audio channel
        </button>
        <span className="text-[10px] text-muted-foreground self-center ml-2">
          Tap a pad to place a hit. Pitched instruments are in the piano roll.
        </span>
      </div>
    </div>
  );
}
