import React, { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import Knob from './Knob';
import { useStudio } from '@/lib/audio/StudioEngine';

const ACCENT = { '#a855f7': 'purple', '#ff00ff': 'magenta', '#ff4d6d': 'magenta', '#ff8a4d': 'purple' };

/** Live level meter fed by the per-channel analyser in the audio graph. */
function Meter({ trackId, isMaster }) {
  const { engineRef, ready } = useStudio();
  const barRef = useRef(null);
  useEffect(() => {
    if (!ready) return undefined;
    let raf = 0;
    const data = new Float32Array(512);
    const tick = () => {
      const eng = engineRef.current;
      const node = eng && (isMaster ? eng.masterAnalyser : eng.ch[trackId] && eng.ch[trackId].analyser);
      if (node && barRef.current) {
        node.getFloatTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length);
        barRef.current.style.height = `${Math.min(100, rms * 260)}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [engineRef, trackId, isMaster, ready]);

  return (
    <div className="w-3 h-32 bg-black rounded-sm border border-studio-border overflow-hidden flex flex-col-reverse">
      <div ref={barRef} className="bg-gradient-to-t from-green-500 via-yellow-400 to-red-500" style={{ height: '0%' }} />
    </div>
  );
}

export default function ChannelStrip({ track, onUpdate, isMaster = false }) {
  const accent = ACCENT[track.color] || 'cyan';
  const vol = isMaster ? track.volume : track.volume;

  return (
    <div className={`w-[140px] shrink-0 glass rounded-lg p-3 flex flex-col items-center gap-2 ${isMaster ? 'border-neon-cyan/40 box-glow-cyan' : ''}`}>
      <div className="w-full flex items-center justify-between">
        <span className="text-[11px] font-medium truncate flex-1">{track.name}</span>
        {!isMaster && track.color && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: track.color }} />}
      </div>

      {!isMaster && (
        <div className="flex gap-2 w-full justify-center">
          <Knob
            value={track.send ? track.send.rev : 0} size={36} label="Verb" accent={accent}
            onChange={v => onUpdate({ send: { ...track.send, rev: v } })}
          />
          <Knob
            value={track.send ? track.send.dly : 0} size={36} label="Delay" accent={accent}
            onChange={v => onUpdate({ send: { ...track.send, dly: v } })}
          />
        </div>
      )}

      {!isMaster && (
        <Knob value={track.pan || 0} min={-1} max={1} label="Pan" accent={accent}
          onChange={v => onUpdate({ pan: v })} />
      )}

      <div className="flex items-center gap-2 my-1">
        <div className="flex flex-col items-center">
          <div className="relative w-7 h-32 bg-gradient-to-b from-black to-studio-panel2 rounded-md border border-studio-border">
            <input
              type="range" min="0" max="1" step="0.01" value={vol}
              onChange={e => onUpdate({ volume: Number(e.target.value) })}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
              aria-label={`${track.name} volume`}
            />
            <div className="absolute left-1/2 -translate-x-1/2 w-7 h-1.5 rounded-sm pointer-events-none"
              style={{ bottom: `${vol * 100}%`, background: track.color || '#00f0ff', boxShadow: `0 0 6px ${track.color || '#00f0ff'}` }} />
          </div>
          <span className="text-[9px] font-mono mt-1">{Math.round(vol * 100)}</span>
        </div>
        <Meter trackId={track.id} isMaster={isMaster} />
      </div>

      {!isMaster && (
        <div className="flex gap-1 w-full">
          <button onClick={() => onUpdate({ muted: !track.muted })}
            className={`flex-1 py-1 rounded text-[10px] font-bold ${track.muted ? 'bg-amber-500/20 text-amber-400' : 'text-muted-foreground'}`}>M</button>
          <button onClick={() => onUpdate({ soloed: !track.soloed })}
            className={`flex-1 py-1 rounded text-[10px] font-bold ${track.soloed ? 'bg-neon-cyan/20 text-neon-cyan' : 'text-muted-foreground'}`}>S</button>
          {track.type === 'audio' && (
            <button onClick={() => onUpdate({ recordArmed: !track.recordArmed })}
              className={`flex-1 py-1 rounded text-[10px] font-bold ${track.recordArmed ? 'bg-red-500/25 text-red-400' : 'text-muted-foreground'}`}>R</button>
          )}
        </div>
      )}

      <div className="w-full border-t border-studio-border pt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            {isMaster ? 'Master bus' : track.type === 'drum' ? track.kind : track.type}
          </span>
          {!isMaster && <Plus size={11} className="text-muted-foreground/40" />}
        </div>
        <div className="space-y-1 text-[10px]">
          {isMaster ? (
            <div className="px-1.5 py-1 rounded bg-studio-panel2">Limiter · always on</div>
          ) : track.type === 'midi' || track.type === 'synth' ? (
            <div className="px-1.5 py-1 rounded bg-studio-panel2 truncate">{track.wave} · {Math.round(track.cutoff)}Hz</div>
          ) : track.type === 'audio' ? (
            <div className="px-1.5 py-1 rounded bg-studio-panel2 truncate">{track.bufferName || 'no sample'}</div>
          ) : (
            <div className="px-1.5 py-1 rounded bg-studio-panel2">tune {track.tune > 0 ? '+' : ''}{track.tune}st</div>
          )}
        </div>
      </div>
    </div>
  );
}
