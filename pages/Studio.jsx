import React, { useState, useEffect, useRef } from 'react';
import { Sliders, ListMusic, Grid3x3, Music2, Save, FolderOpen, Download, Loader2 } from 'lucide-react';
import TransportBar from '@/components/nexus/TransportBar';
import TrackList from '@/components/nexus/TrackList';
import MixerView from '@/components/nexus/MixerView';
import PianoRoll from '@/components/nexus/PianoRoll';
import StepSequencer from '@/components/nexus/StepSequencer';
import InstrumentPanel from '@/components/nexus/InstrumentPanel';
import { useStudio } from '@/lib/audio/StudioEngine';
import { downloadBlob } from '@/lib/audio/engine';
import { useToast } from '@/components/ui/use-toast';

const VIEW_TABS = [
  { id: 'arrange', name: 'Arrangement', icon: ListMusic },
  { id: 'mixer', name: 'Mixer', icon: Sliders },
  { id: 'piano', name: 'Piano Roll', icon: Music2 },
  { id: 'sequencer', name: 'Step Seq', icon: Grid3x3 },
];

export default function Studio() {
  const { toast } = useToast();
  const { project, setProject, togglePlay, saveProject, openProject, exportWav } = useStudio();
  const [view, setView] = useState('sequencer');
  const [bouncing, setBouncing] = useState(false);
  const openRef = useRef(null);

  // Space toggles transport unless the user is typing
  useEffect(() => {
    const onKey = e => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay]);

  const bounce = async () => {
    setBouncing(true);
    try {
      const { blob, duration } = await exportWav();
      downloadBlob(blob, `${project.name || 'mix'}.wav`);
      toast({ title: 'Bounced to WAV', description: `${duration.toFixed(1)}s rendered` });
    } catch (e) {
      toast({ title: 'Render failed', description: e.message });
    }
    setBouncing(false);
  };

  const open = async e => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const p = await openProject(f);
      toast({ title: `Opened ${p.name}`, description: 'Samples are not stored in the project file — reload those.' });
    } catch (err) {
      toast({ title: 'That is not a SoundForge project file' });
    }
    e.target.value = '';
  };

  return (
    <div className="h-screen flex flex-col">
      <input ref={openRef} type="file" accept=".json,application/json" hidden onChange={open} />

      <div className="glass-strong border-b border-studio-border px-4 py-2.5 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 grid place-items-center rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
            <Music2 size={16} className="text-neon-cyan" />
          </div>
          <div>
            <input
              value={project.name}
              onChange={e => setProject(p => ({ ...p, name: e.target.value }))}
              className="text-sm font-medium leading-tight bg-transparent outline-none focus:text-neon-cyan w-40"
              aria-label="Project name"
            />
            <p className="text-[10px] text-muted-foreground">
              {project.bpm} BPM · {project.tracks.length} tracks · {project.patterns.length} patterns
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => openRef.current.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs hover:bg-white/10 transition">
            <FolderOpen size={13} /> Open
          </button>
          <button onClick={saveProject} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs hover:bg-white/10 transition">
            <Save size={13} /> Save
          </button>
          <button onClick={bounce} disabled={bouncing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan text-xs hover:bg-neon-cyan/25 transition disabled:opacity-50">
            {bouncing ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            {bouncing ? 'Rendering' : 'Bounce WAV'}
          </button>
        </div>
      </div>

      <TransportBar />

      <div className="glass border-b border-studio-border px-4 py-1.5 flex items-center gap-2">
        {VIEW_TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id} onClick={() => setView(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${view === t.id ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon size={13} /> {t.name}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="flex-1 min-w-0 overflow-hidden">
          {view === 'arrange' && <TrackList />}
          {view === 'mixer' && <MixerView />}
          {view === 'piano' && <div className="p-4 h-full"><PianoRoll /></div>}
          {view === 'sequencer' && <div className="p-4 h-full"><StepSequencer /></div>}
        </div>
        {view !== 'mixer' && <InstrumentPanel />}
      </div>
    </div>
  );
}
