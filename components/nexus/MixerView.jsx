import React from 'react';
import ChannelStrip from './ChannelStrip';
import { useStudio } from '@/lib/audio/StudioEngine';

export default function MixerView() {
  const { project, updateTrack, setMaster, setFx } = useStudio();

  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-3 p-4 min-w-min h-full items-stretch">
        {project.tracks.map(t => (
          <ChannelStrip key={t.id} track={t} onUpdate={patch => updateTrack(t.id, patch)} />
        ))}

        <div className="w-px bg-neon-cyan/30 mx-1" />

        <ChannelStrip
          track={{ id: '__master', name: 'MASTER', volume: project.master, color: '#00f0ff' }}
          onUpdate={patch => { if ('volume' in patch) setMaster(patch.volume); }}
          isMaster
        />

        <div className="w-[200px] shrink-0 glass rounded-lg p-3 space-y-3">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Send effects</span>
          {[
            { k: 'revSize', label: 'Reverb size', min: 0.3, max: 6, step: 0.1, fmt: v => `${v.toFixed(1)}s` },
            { k: 'revMix', label: 'Reverb level', min: 0, max: 1.5, step: 0.01, fmt: v => `${Math.round(v * 100)}%` },
            { k: 'dlyTime', label: 'Delay time', min: 1, max: 8, step: 1, fmt: v => `${v}/16` },
            { k: 'dlyFb', label: 'Feedback', min: 0, max: 0.88, step: 0.01, fmt: v => `${Math.round(v * 100)}%` },
            { k: 'dlyTone', label: 'Delay tone', min: 400, max: 12000, step: 100, fmt: v => `${Math.round(v)}Hz` },
          ].map(c => (
            <div key={c.k}>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-muted-foreground">{c.label}</span>
                <span className="font-mono text-neon-cyan">{c.fmt(project.fx[c.k])}</span>
              </div>
              <input
                type="range" min={c.min} max={c.max} step={c.step} value={project.fx[c.k]}
                onChange={e => setFx({ [c.k]: Number(e.target.value) })}
                className="w-full accent-neon-purple"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
