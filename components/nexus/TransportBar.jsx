import React from 'react';
import { Play, Pause, Square, Circle, Repeat, Timer, Volume2 } from 'lucide-react';
import { useStudio } from '@/lib/audio/StudioEngine';
import { useToast } from '@/components/ui/use-toast';

export default function TransportBar() {
  const {
    project, isPlaying, isRecording, step, playPattern,
    togglePlay, stop, toggleRecord, setBpm, setMaster, setProject,
  } = useStudio();
  const { toast } = useToast();

  const bar = Math.floor(step / 16) + 1;
  const beat = (Math.floor(step / 4) % 4) + 1;
  const tick = (step % 4) + 1;
  const secs = step * ((60 / project.bpm) / 4);
  const timecode = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(Math.floor(secs % 60)).padStart(2, '0')}:${String(Math.floor((secs % 1) * 100)).padStart(2, '0')}`;

  const record = async () => {
    try { await toggleRecord(); }
    catch (e) { toast({ title: 'Cannot record', description: e.message }); }
  };

  return (
    <div className="glass-strong border-b border-studio-border px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-3">
      <div className="flex items-center gap-2">
        <button onClick={stop} className="w-10 h-10 grid place-items-center rounded-lg glass hover:bg-white/10 transition" title="Stop">
          <Square size={16} />
        </button>
        <button onClick={togglePlay} className={`w-12 h-12 grid place-items-center rounded-lg ${isPlaying ? 'bg-neon-cyan text-black box-glow-cyan' : 'glass hover:bg-white/10'} transition`} title="Play (Space)">
          {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
        </button>
        <button onClick={record} className={`w-10 h-10 grid place-items-center rounded-lg ${isRecording ? 'bg-red-500 text-white animate-pulse-glow' : 'glass hover:bg-white/10'} transition`} title="Record into the armed audio track">
          <Circle size={16} />
        </button>
        <button
          onClick={() => setProject(p => ({ ...p, songMode: !p.songMode }))}
          className={`w-10 h-10 grid place-items-center rounded-lg ${project.songMode ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/40' : 'glass hover:bg-white/10'} transition`}
          title={project.songMode ? 'Song mode: playing the pattern chain' : 'Pattern mode: looping one pattern'}
        >
          <Repeat size={16} />
        </button>
      </div>

      <div className="h-8 w-px bg-studio-border" />

      <div className="font-mono text-center min-w-[128px]">
        <div className="text-2xl font-bold neon-cyan text-glow-cyan tabular-nums">{bar}:{beat}:{tick}</div>
        <div className="text-[10px] text-muted-foreground tabular-nums">
          {timecode} · {project.songMode ? `chain ${(project.patterns[playPattern] || {}).name || ''}` : 'pattern loop'}
        </div>
      </div>

      <div className="h-8 w-px bg-studio-border" />

      <div className="flex flex-col">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Tempo</label>
        <div className="flex items-center gap-2">
          <input
            type="number" min="40" max="220" value={project.bpm}
            onChange={e => setBpm(Number(e.target.value))}
            className="w-16 bg-studio-panel2 border border-studio-border rounded-md px-2 py-1.5 text-center font-mono font-bold text-sm focus:border-neon-cyan outline-none"
          />
          <span className="text-xs text-muted-foreground">BPM</span>
        </div>
      </div>

      <div className="flex flex-col">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Swing</label>
        <div className="flex items-center gap-2">
          <input
            type="range" min="0" max="60" value={project.swing}
            onChange={e => setProject(p => ({ ...p, swing: Number(e.target.value) }))}
            className="w-24 accent-neon-purple"
          />
          <span className="text-xs font-mono text-muted-foreground w-8">{project.swing}%</span>
        </div>
      </div>

      <div className="flex flex-col">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Timing</label>
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <Timer size={13} className="text-neon-cyan" />
          {(project.patterns[playPattern] || project.patterns[0]).steps} steps · 4/4
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Volume2 size={14} className="text-muted-foreground" />
        <input
          type="range" min="0" max="1" step="0.01" value={project.master}
          onChange={e => setMaster(Number(e.target.value))}
          className="w-28 accent-neon-cyan"
        />
        <span className="text-xs font-mono text-muted-foreground w-9">{Math.round(project.master * 100)}%</span>
      </div>
    </div>
  );
}
