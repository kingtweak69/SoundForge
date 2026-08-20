import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/localdb';
import {
  AppWindow, Play, Pause, Gauge, Sliders, Activity, Volume2,
  Loader2, Download, Music2, Cloud, Cpu
} from 'lucide-react';
import PageHeader from '@/components/nexus/PageHeader';
import Knob from '@/components/nexus/Knob';
import Waveform from '@/components/nexus/Waveform';
import { useToast } from '@/components/ui/use-toast';

export default function Mastering() {
  const { toast } = useToast();
  const [presets, setPresets] = useState([]);
  const [activePreset, setActivePreset] = useState('spotify');
  const [playing, setPlaying] = useState(false);
  const [abToggle, setAbToggle] = useState('A');
  const [processing, setProcessing] = useState(false);
  const [loudness, setLoudness] = useState(-14);
  const [stereoWidth, setStereoWidth] = useState(100);
  const [compRatio, setCompRatio] = useState(2.5);
  const [eqLow, setEqLow] = useState(0.5);
  const [eqHi, setEqHi] = useState(0.5);
  const [limiter, setLimiter] = useState(0.85);

  useEffect(() => {
    (async () => { try { setPresets(await db.entities.MasterPreset.list()); } catch (e) { setPresets([]); } })();
  }, []);

  const applyPreset = useCallback((p) => {
    if (!p) return;
    setActivePreset(p.type);
    setLoudness(p.targetLoudness);
    if (p.settings?.stereoWidth) setStereoWidth(p.settings.stereoWidth);
    if (p.settings?.compressor?.ratio) setCompRatio(p.settings.compressor.ratio);
    toast({ title: `Applied: ${p.name}` });
  }, [toast]);

  const runMaster = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); toast({ title: 'Mastering complete', description: `Target ${loudness} LUFS achieved` }); }, 2400);
  };

  // Loudness meter levels (simulated)
  const [meter, setMeter] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setMeter(Math.max(20, 60 + Math.random() * 35)), 100);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader
        icon={AppWindow}
        title="Mastering Suite"
        subtitle="Loudness metering, multi-band processing, and reference-matching presets"
        action={
          <button onClick={runMaster} disabled={processing} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple text-black text-sm font-medium hover:opacity-90 disabled:opacity-60">
            {processing ? <><Loader2 size={16} className="animate-spin" /> Mastering...</> : <><Music2 size={16} /> Run Master</>}
          </button>
        }
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          {/* Loudness meter + waveform */}
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold flex items-center gap-2"><Gauge size={16} className="text-neon-cyan" /> Loudness Metering</h3>
              <div className="flex items-center gap-1 glass rounded-lg p-1">
                {['A','B'].map(t => (
                  <button key={t} onClick={() => setAbToggle(t)} className={`px-3 py-1 rounded text-xs font-medium ${abToggle === t ? 'bg-neon-cyan text-black' : 'text-muted-foreground'}`}>{t === 'A' ? 'Before' : 'After'}</button>
                ))}
              </div>
            </div>

            <div className="h-20 mb-4 glass rounded-lg px-4 flex items-center"><Waveform bars={80} color={abToggle === 'A' ? '#64748b' : '#00f0ff'} height={72} animate={playing} /></div>

            {/* Meter */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'LUFS', value: loudness.toFixed(1), unit: 'LUFS', color: '#00f0ff' },
                { label: 'True Peak', value: '-0.9', unit: 'dBFS', color: '#a855f7' },
                { label: 'RMS', value: '-12.3', unit: 'dB', color: '#22c55e' },
                { label: 'Dynamic Range', value: '8.4', unit: 'DR', color: '#ffb627' },
              ].map(m => (
                <div key={m.label} className="glass rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
                  <p className="text-xl font-display font-bold font-mono" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.unit}</p>
                </div>
              ))}
            </div>

            {/* Vertical VU meter */}
            <div className="flex items-center gap-6 mt-5 justify-center">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">L</span>
                <div className="w-4 h-24 bg-black rounded border border-studio-border overflow-hidden flex flex-col-reverse">
                  <div className="bg-gradient-to-t from-green-500 via-yellow-400 to-red-500 transition-all" style={{ height: `${meter}%` }} />
                </div>
              </div>
              <button onClick={() => setPlaying(p => !p)} className="w-12 h-12 grid place-items-center rounded-full bg-neon-cyan text-black hover:scale-105 transition">
                {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-4 h-24 bg-black rounded border border-studio-border overflow-hidden flex flex-col-reverse">
                  <div className="bg-gradient-to-t from-green-500 via-yellow-400 to-red-500 transition-all" style={{ height: `${meter}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">R</span>
              </div>
            </div>
          </div>

          {/* Processing chain */}
          <div className="glass-strong rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2"><Sliders size={16} className="text-neon-purple" /> Processing Chain</h3>
            <div className="flex flex-wrap justify-center gap-6 py-2">
              <Knob value={compRatio} label="Comp Ratio" accent="purple" onChange={setCompRatio} />
              <Knob value={eqLow} label="EQ Low" accent="cyan" onChange={setEqLow} />
              <Knob value={0.5} label="EQ Mid" accent="cyan" />
              <Knob value={eqHi} label="EQ Hi" accent="cyan" onChange={setEqHi} />
              <Knob value={stereoWidth / 150} label="Stereo Width" accent="purple" onChange={(v) => setStereoWidth(v * 150)} />
              <Knob value={limiter} label="Limiter" accent="cyan" onChange={setLimiter} />
            </div>
            <div className="flex flex-wrap gap-2 mt-5 justify-center">
              {['Multi-band Comp', 'Stereo Imager', 'Master EQ', 'Limiter', 'Dither'].map(e => (
                <span key={e} className="px-2.5 py-1 rounded-full text-xs bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan">{e}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="space-y-6">
          <div className="glass-strong rounded-2xl p-5">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><Activity size={15} className="text-neon-cyan" /> Export Presets</h3>
            <div className="space-y-2">
              {presets.map(p => (
                <button key={p.id} onClick={() => applyPreset(p)} className={`w-full text-left p-3 rounded-lg border transition ${activePreset === p.type ? 'bg-neon-cyan/10 border-neon-cyan/40' : 'glass border-studio-border hover:border-white/20'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs font-mono text-neon-cyan">{p.targetLoudness} LUFS</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{p.description}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-5 border border-studio-border">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2"><Cloud size={14} className="text-neon-purple" /> Reference Match</h4>
            <p className="text-[11px] text-muted-foreground mb-3">Upload a reference track to match EQ and loudness curve.</p>
            <button className="w-full py-2 rounded-lg glass text-xs hover:bg-white/10">Upload Reference</button>
          </div>
          <div className="glass rounded-2xl p-5 border border-studio-border flex items-center gap-2">
            <Cpu size={14} className="text-neon-green" />
            <span className="text-xs">Engine: <span className="text-neon-cyan">Local GPU</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}