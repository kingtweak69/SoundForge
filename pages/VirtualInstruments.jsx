import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/localdb';
import {
  Piano, Music2, Drum, Waves, AudioWaveform, Grid3x3, Play, Save, Plus
} from 'lucide-react';
import PageHeader from '@/components/nexus/PageHeader';
import Knob from '@/components/nexus/Knob';
import Waveform from '@/components/nexus/Waveform';
import { useToast } from '@/components/ui/use-toast';

const INSTRUMENTS = [
  { id: 'synth', name: 'Synthesizer', icon: AudioWaveform, color: '#00f0ff' },
  { id: 'drum-machine', name: 'Drum Machine', icon: Drum, color: '#a855f7' },
  { id: 'sampler', name: 'Sampler', icon: Music2, color: '#ff00ff' },
  { id: 'piano', name: 'Piano', icon: Piano, color: '#22c55e' },
  { id: 'bass-synth', name: 'Bass Synth', icon: Waves, color: '#ffb627' },
  { id: 'pad', name: 'Pad / Ambient', icon: Waves, color: '#4dabf7' },
  { id: 'arpeggiator', name: 'Arpeggiator', icon: Grid3x3, color: '#ff8a4d' },
];

const KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C5','C#5','D5'];

export default function VirtualInstruments() {
  const { toast } = useToast();
  const [active, setActive] = useState('synth');
  const [activeKey, setActiveKey] = useState(null);
  const [presets, setPresets] = useState([]);
  const [cutoff, setCutoff] = useState(0.5);
  const [resonance, setResonance] = useState(0.3);
  const [attack, setAttack] = useState(0.1);
  const [release, setRelease] = useState(0.4);

  useEffect(() => {
    (async () => {
      try { setPresets(await db.entities.InstrumentPreset.filter({ instrumentType: active })); } catch (e) { setPresets([]); }
    })();
  }, [active]);

  const playKey = useCallback((k) => {
    setActiveKey(k);
    setTimeout(() => setActiveKey(null), 200);
  }, []);

  const currentInst = INSTRUMENTS.find(i => i.id === active);
  const isBlack = (k) => k.includes('#');

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader
        icon={Piano}
        title="Virtual Instruments"
        subtitle="Play, tweak, and send instruments straight to your studio"
        action={
          <button onClick={() => toast({ title: 'Instrument sent to Studio' })} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neon-cyan text-black text-sm font-medium hover:opacity-90">
            <Plus size={16} /> Add to Studio
          </button>
        }
      />

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Instrument selector */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Instruments</p>
          {INSTRUMENTS.map(i => {
            const Icon = i.icon;
            return (
              <button key={i.id} onClick={() => setActive(i.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${active === i.id ? 'bg-white/5 border-neon-cyan/40' : 'glass border-studio-border hover:border-white/20'}`}>
                <div className="w-9 h-9 grid place-items-center rounded-lg" style={{ background: `${i.color}22`, border: `1px solid ${i.color}44` }}>
                  <Icon size={17} style={{ color: i.color }} />
                </div>
                <span className="text-sm font-medium">{i.name}</span>
              </button>
            );
          })}
        </div>

        {/* Main instrument view */}
        <div className="space-y-4">
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <currentInst.icon size={20} style={{ color: currentInst.color }} /> {currentInst.name}
              </h3>
              <button onClick={() => toast({ title: 'Preset saved' })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs hover:bg-white/10"><Save size={13} /> Save Preset</button>
            </div>

            {active === 'drum-machine' ? (
              <div className="grid grid-cols-4 gap-3">
                {['Kick','Snare','Clap','Hat','Open Hat','Tom','Rim','Cymbal'].map((d, i) => (
                  <button key={d} onClick={() => playKey(d + i)} className={`aspect-square rounded-xl glass border border-studio-border hover:border-neon-purple/40 flex flex-col items-center justify-center gap-1 transition ${activeKey === d + i ? 'bg-neon-purple/20 box-glow-purple' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-b from-neon-purple/40 to-studio-bg border border-neon-purple/40 grid place-items-center" style={{ boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)' }}>
                      <Play size={14} className="text-neon-purple" />
                    </div>
                    <span className="text-xs">{d}</span>
                  </button>
                ))}
              </div>
            ) : active === 'arpeggiator' ? (
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  <button key={i} onClick={() => playKey('arp' + i)} className={`h-14 rounded-md border border-studio-border glass hover:border-neon-amber/40 ${activeKey === 'arp' + i ? 'bg-neon-amber/30' : ''}`} />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-6 py-2">
                <Knob value={cutoff} label="Cutoff" accent="cyan" onChange={setCutoff} />
                <Knob value={resonance} label="Resonance" accent="purple" onChange={setResonance} />
                <Knob value={attack} label="Attack" accent="cyan" onChange={setAttack} />
                <Knob value={release} label="Release" accent="purple" onChange={setRelease} />
                <Knob value={0.5} label="Drive" accent="cyan" />
                <Knob value={0.4} label="Reverb" accent="purple" />
              </div>
            )}

            {/* Live waveform */}
            <div className="h-14 mt-5 glass rounded-lg px-4 flex items-center"><Waveform bars={70} color={currentInst.color} height={48} animate /></div>
          </div>

          {/* Presets */}
          <div className="glass-strong rounded-2xl p-5">
            <h4 className="font-medium text-sm mb-3">Presets</h4>
            <div className="flex flex-wrap gap-2">
              {presets.length === 0 ? (
                <p className="text-xs text-muted-foreground">No saved presets yet — tweak and save your own.</p>
              ) : presets.map(p => (
                <button key={p.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-xs hover:bg-white/10"><Music2 size={12} className="text-neon-cyan" /> {p.name}</button>
              ))}
            </div>
          </div>

          {/* On-screen keyboard */}
          <div className="glass-strong rounded-2xl p-4">
            <div className="flex h-32 relative">
              {KEYS.map((k, i) => (
                <button
                  key={k}
                  onPointerDown={() => playKey(k)}
                  className={`flex-1 rounded-b-md border border-studio-border transition-all relative ${isBlack(k) ? 'bg-studio-bg h-20 -mx-3 z-10 border-x' : 'bg-gradient-to-b from-white/10 to-studio-panel h-full'} ${activeKey === k ? 'bg-neon-cyan/40 box-glow-cyan' : 'hover:bg-white/5'}`}
                >
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] ${isBlack(k) ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>{k}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}