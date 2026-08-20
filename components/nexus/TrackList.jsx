import React, { useRef } from 'react';
import { Plus, Upload, Trash2, Mic } from 'lucide-react';
import { useStudio } from '@/lib/audio/StudioEngine';

/* Arrangement view. Lanes are the song chain: each slot is one pattern,
 * and a block appears where a track actually has notes in that pattern. */
export default function TrackList() {
  const {
    project, curPattern, setCurPattern, playPattern, step, isPlaying,
    selectedTrackId, setSelectedTrackId, updateTrack, addTrack, removeTrack,
    loadSample, setProject,
  } = useStudio();
  const fileRef = useRef(null);
  const pendingTrack = useRef(null);

  const slots = project.songMode ? project.song : project.patterns.map((_, i) => i);
  const SLOT_W = 96;

  const pickSample = id => { pendingTrack.current = id; fileRef.current.click(); };
  const onFile = async e => {
    const f = e.target.files[0];
    if (f && pendingTrack.current) await loadSample(pendingTrack.current, f);
    e.target.value = '';
  };

  const noteCount = (trackId, patIdx) => (project.patterns[patIdx]?.clips[trackId] || []).length;
  const playingSlot = slots.findIndex((p, i) => isPlaying && p === playPattern && (!project.songMode || true) && i >= 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <input ref={fileRef} type="file" accept="audio/*" hidden onChange={onFile} />

      <div className="flex flex-col flex-1 overflow-auto">
        <div className="sticky top-0 z-10 flex bg-studio-panel border-b border-studio-border">
          <div className="w-[260px] shrink-0 border-r border-studio-border px-3 py-2 text-xs font-mono text-muted-foreground flex items-center justify-between">
            <span>Tracks</span>
            <div className="flex gap-1">
              <button onClick={() => addTrack('midi')} className="w-6 h-6 grid place-items-center rounded-md glass hover:bg-neon-cyan/20 hover:text-neon-cyan" title="Add instrument track">
                <Plus size={14} />
              </button>
              <button onClick={() => addTrack('audio')} className="w-6 h-6 grid place-items-center rounded-md glass hover:bg-neon-green/20" title="Add audio track">
                <Mic size={13} />
              </button>
            </div>
          </div>
          <div className="flex">
            {slots.map((p, i) => (
              <button
                key={i} onClick={() => setCurPattern(p)}
                className={`shrink-0 h-10 border-r border-studio-border/50 text-[10px] font-mono px-2 text-left ${p === curPattern ? 'text-neon-cyan bg-neon-cyan/5' : 'text-muted-foreground/70'}`}
                style={{ width: SLOT_W }}
              >
                {project.songMode ? `${i + 1} · ${project.patterns[p]?.name}` : project.patterns[p]?.name}
              </button>
            ))}
            {project.songMode && (
              <button
                onClick={() => setProject(pr => ({ ...pr, song: [...pr.song, curPattern] }))}
                className="w-10 h-10 grid place-items-center text-muted-foreground hover:text-neon-cyan"
                title="Append current pattern to the song"
              ><Plus size={14} /></button>
            )}
          </div>
        </div>

        {project.tracks.map(track => (
          <div key={track.id} className={`flex border-b border-studio-border ${selectedTrackId === track.id ? 'bg-white/[0.03]' : ''}`}>
            <div
              onClick={() => setSelectedTrackId(track.id)}
              className={`w-[260px] shrink-0 border-r border-studio-border px-3 py-2.5 flex items-center gap-2 cursor-pointer ${selectedTrackId === track.id ? 'bg-neon-cyan/5' : ''}`}
            >
              <div className="w-2.5 h-9 rounded-sm shrink-0" style={{ background: track.color, boxShadow: `0 0 8px ${track.color}66` }} />
              <div className="flex-1 min-w-0">
                <input
                  value={track.name}
                  onChange={e => updateTrack(track.id, { name: e.target.value })}
                  onClick={e => e.stopPropagation()}
                  className="text-sm font-medium truncate bg-transparent outline-none w-full focus:text-neon-cyan"
                />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  {track.type === 'drum' ? track.kind : track.type}
                  {track.type === 'audio' && track.bufferName ? ` · ${track.bufferName}` : ''}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={e => { e.stopPropagation(); updateTrack(track.id, { muted: !track.muted }); }}
                  className={`w-6 h-6 grid place-items-center rounded text-[10px] font-bold ${track.muted ? 'bg-amber-500/20 text-amber-400' : 'text-muted-foreground hover:text-foreground'}`} title="Mute">M</button>
                <button onClick={e => { e.stopPropagation(); updateTrack(track.id, { soloed: !track.soloed }); }}
                  className={`w-6 h-6 grid place-items-center rounded text-[10px] font-bold ${track.soloed ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-muted-foreground hover:text-foreground'}`} title="Solo">S</button>
                {track.type === 'audio' && (
                  <>
                    <button onClick={e => { e.stopPropagation(); updateTrack(track.id, { recordArmed: !track.recordArmed }); }}
                      className={`w-6 h-6 grid place-items-center rounded text-[10px] font-bold ${track.recordArmed ? 'bg-red-500/30 text-red-400' : 'text-muted-foreground hover:text-foreground'}`} title="Arm for recording">R</button>
                    <button onClick={e => { e.stopPropagation(); pickSample(track.id); }}
                      className="w-6 h-6 grid place-items-center rounded text-muted-foreground hover:text-neon-cyan" title="Load a sample">
                      <Upload size={12} />
                    </button>
                  </>
                )}
                <button onClick={e => { e.stopPropagation(); removeTrack(track.id); }}
                  className="w-6 h-6 grid place-items-center rounded text-muted-foreground hover:text-red-400" title="Delete track">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            <div className="flex relative">
              {slots.map((p, i) => {
                const count = noteCount(track.id, p);
                const active = isPlaying && p === playPattern;
                return (
                  <div
                    key={i} onClick={() => setCurPattern(p)}
                    className="shrink-0 h-16 border-r border-studio-border/30 p-1.5 cursor-pointer"
                    style={{ width: SLOT_W, background: i % 2 ? 'hsl(240 14% 6% / 0.3)' : 'transparent' }}
                  >
                    {count > 0 && (
                      <div className="h-full rounded-md border overflow-hidden px-1.5 py-1 relative"
                        style={{ background: `${track.color}22`, borderColor: `${track.color}66`, boxShadow: `0 0 6px ${track.color}33` }}>
                        <div className="text-[9px] font-mono text-white/70">{count} notes</div>
                        <div className="absolute inset-x-1 bottom-1 flex gap-[2px] items-end h-5">
                          {(project.patterns[p].clips[track.id] || []).slice(0, 24).map((n, ni) => (
                            <div key={ni} className="flex-1 rounded-sm" style={{ height: `${20 + n.v * 80}%`, background: track.color, opacity: 0.7 }} />
                          ))}
                        </div>
                        {active && (
                          <div className="absolute top-0 bottom-0 w-[2px] bg-white/80 pointer-events-none"
                            style={{ left: `${(step / (project.patterns[p].steps || 16)) * 100}%` }} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {project.tracks.length === 0 && (
          <div className="flex-1 grid place-items-center text-muted-foreground p-12">
            <div className="text-center">
              <Plus className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No tracks yet. Add one to start composing.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
