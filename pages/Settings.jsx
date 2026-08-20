import React, { useState, useEffect } from 'react';
import { db } from '@/lib/localdb';
import {
  Settings as SettingsIcon, Cpu, Cloud, HardDrive, Volume2, Keyboard,
  Palette, Clock, Download, CheckCircle, Loader2, Mic, MonitorSpeaker
} from 'lucide-react';
import PageHeader from '@/components/nexus/PageHeader';
import { useToast } from '@/components/ui/use-toast';

const TABS = [
  { id: 'ai', name: 'AI Engine', icon: Cpu },
  { id: 'audio', name: 'Audio', icon: Volume2 },
  { id: 'appearance', name: 'Appearance', icon: Palette },
  { id: 'general', name: 'General', icon: SettingsIcon },
];

const FALLBACK_OPTIONS = [
  { id: 'local-only', name: 'Always Local', desc: 'Never use cloud APIs' },
  { id: 'local-first', name: 'Local First', desc: 'Cloud only when local unavailable' },
  { id: 'cloud-first', name: 'Cloud First', desc: 'Local when offline only' },
  { id: 'cloud-only', name: 'Always Cloud', desc: 'Highest quality, uses credits' },
];

const ACCENTS = [
  { id: 'cyan', color: '#00f0ff', name: 'Cyan' },
  { id: 'purple', color: '#a855f7', name: 'Purple' },
  { id: 'magenta', color: '#ff00ff', name: 'Magenta' },
  { id: 'green', color: '#22c55e', name: 'Green' },
  { id: 'amber', color: '#ffb627', name: 'Amber' },
];

export default function Settings() {
  const { toast } = useToast();
  const [tab, setTab] = useState('ai');
  const [featureToggles, setFeatureToggles] = useState({ generation: 'local', voiceClone: 'local', voiceChange: 'local', lyrics: 'local' });
  const [models, setModels] = useState([]);
  const [fallback, setFallback] = useState('local-first');
  const [gpu, setGpu] = useState(true);
  const [modelPath, setModelPath] = useState('~/.nexus/models');
  const [accent, setAccent] = useState('cyan');
  const [autoSave, setAutoSave] = useState(30);
  const [sampleRate, setSampleRate] = useState(48000);
  const [bufferSize, setBufferSize] = useState(256);
  const [audioInput, setAudioInput] = useState('Default Microphone');
  const [audioOutput, setAudioOutput] = useState('System Speakers');

  useEffect(() => {
    (async () => { try { setModels(await db.entities.AIModel.list()); } catch (e) { setModels([]); } })();
  }, []);

  const toggleInstall = async (m) => {
    setModels(ms => ms.map(x => x.id === m.id ? { ...x, status: 'downloading' } : x));
    toast({ title: `Downloading ${m.name}...`, description: `${m.size} · ${m.engine}` });
    setTimeout(async () => {
      setModels(ms => ms.map(x => x.id === m.id ? { ...x, status: 'installed' } : x));
      toast({ title: `${m.name} installed` });
    }, 2000);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      <PageHeader icon={SettingsIcon} title="Settings" subtitle="Configure your AI engines, audio devices, and studio preferences" />

      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <div className="space-y-1">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${tab === t.id ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>
                <Icon size={16} /> {t.name}
              </button>
            );
          })}
        </div>

        <div className="space-y-6">
          {tab === 'ai' && (
            <>
              <div className="glass-strong rounded-2xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center gap-2"><Cpu size={16} className="text-neon-cyan" /> Engine Mode per Feature</h3>
                <div className="space-y-3">
                  {Object.keys(featureToggles).map(f => (
                    <div key={f} className="flex items-center justify-between py-2">
                      <span className="text-sm capitalize">{f.replace(/([A-Z])/g, ' $1')}</span>
                      <div className="flex items-center gap-1 glass rounded-lg p-1">
                        <button onClick={() => setFeatureToggles(t => ({ ...t, [f]: 'local' }))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${featureToggles[f] === 'local' ? 'bg-neon-cyan text-black' : 'text-muted-foreground'}`}><Cpu size={12} /> Local</button>
                        <button onClick={() => setFeatureToggles(t => ({ ...t, [f]: 'cloud' }))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${featureToggles[f] === 'cloud' ? 'bg-neon-purple text-white' : 'text-muted-foreground'}`}><Cloud size={12} /> Cloud</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-strong rounded-2xl p-6">
                <h3 className="font-display font-semibold mb-4">Fallback Strategy</h3>
                <div className="grid grid-cols-2 gap-2">
                  {FALLBACK_OPTIONS.map(o => (
                    <button key={o.id} onClick={() => setFallback(o.id)} className={`text-left p-3 rounded-lg border transition ${fallback === o.id ? 'bg-neon-purple/10 border-neon-purple/40' : 'glass border-studio-border'}`}>
                      <p className="text-sm font-medium">{o.name}</p>
                      <p className="text-[10px] text-muted-foreground">{o.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-strong rounded-2xl p-6">
                <h3 className="font-display font-semibold mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2"><HardDrive size={16} className="text-neon-purple" /> Local Models</span>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={gpu} onChange={(e) => setGpu(e.target.checked)} className="accent-neon-cyan" /> Use GPU (CUDA)</label>
                </h3>
                <div className="mb-3">
                  <label className="text-xs text-muted-foreground">Model storage path</label>
                  <input value={modelPath} onChange={(e) => setModelPath(e.target.value)} className="w-full mt-1 bg-studio-panel2 border border-studio-border rounded-lg px-3 py-2 text-sm font-mono focus:border-neon-cyan outline-none" />
                </div>
                <div className="space-y-2">
                  {models.map(m => (
                    <div key={m.id} className="glass rounded-lg p-3 flex items-center gap-3">
                      <div className={`w-8 h-8 grid place-items-center rounded-lg ${m.engine === 'local' ? 'bg-neon-cyan/15 text-neon-cyan' : 'bg-neon-purple/15 text-neon-purple'}`}>
                        {m.engine === 'local' ? <Cpu size={15} /> : <Cloud size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{m.name}<span className="text-[10px] text-muted-foreground ml-2 capitalize">{m.type.replace('-', ' ')}</span></p>
                        <p className="text-[10px] text-muted-foreground truncate">{m.description} · {m.size}</p>
                      </div>
                      {m.status === 'installed' ? (
                        <span className="flex items-center gap-1 text-xs text-neon-green"><CheckCircle size={13} /> Installed</span>
                      ) : m.status === 'downloading' ? (
                        <span className="flex items-center gap-1 text-xs text-neon-cyan"><Loader2 size={13} className="animate-spin" /> Installing</span>
                      ) : (
                        <button onClick={() => toggleInstall(m)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg glass text-xs hover:bg-white/10"><Download size={12} /> Install</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'audio' && (
            <div className="glass-strong rounded-2xl p-6 space-y-4">
              <h3 className="font-display font-semibold mb-2 flex items-center gap-2"><Volume2 size={16} className="text-neon-cyan" /> Audio Devices</h3>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Mic size={11} /> Input Device</label>
                <select value={audioInput} onChange={(e) => setAudioInput(e.target.value)} className="w-full mt-1.5 bg-studio-panel2 border border-studio-border rounded-lg px-3 py-2 text-sm focus:border-neon-cyan outline-none">
                  {['Default Microphone', 'USB Audio Interface', 'Focusrite Scarlett 2i2', 'Built-in Input'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><MonitorSpeaker size={11} /> Output Device</label>
                <select value={audioOutput} onChange={(e) => setAudioOutput(e.target.value)} className="w-full mt-1.5 bg-studio-panel2 border border-studio-border rounded-lg px-3 py-2 text-sm focus:border-neon-cyan outline-none">
                  {['System Speakers', 'Studio Monitors', 'Headphones', 'Bluetooth'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Sample Rate</label>
                  <select value={sampleRate} onChange={(e) => setSampleRate(Number(e.target.value))} className="w-full mt-1.5 bg-studio-panel2 border border-studio-border rounded-lg px-3 py-2 text-sm focus:border-neon-cyan outline-none">
                    {[44100, 48000, 96000, 192000].map(r => <option key={r} value={r}>{r / 1000} kHz</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Buffer Size</label>
                  <select value={bufferSize} onChange={(e) => setBufferSize(Number(e.target.value))} className="w-full mt-1.5 bg-studio-panel2 border border-studio-border rounded-lg px-3 py-2 text-sm focus:border-neon-cyan outline-none">
                    {[64, 128, 256, 512, 1024].map(b => <option key={b} value={b}>{b} samples ({Math.round(b / sampleRate * 1000)}ms)</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="glass-strong rounded-2xl p-6">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2"><Palette size={16} className="text-neon-purple" /> Accent Color</h3>
              <div className="flex gap-3">
                {ACCENTS.map(a => (
                  <button key={a.id} onClick={() => setAccent(a.id)} className={`flex flex-col items-center gap-1.5 group`}>
                    <div className={`w-12 h-12 rounded-full border-2 transition ${accent === a.id ? 'scale-110' : 'group-hover:scale-105'}`} style={{ background: a.color, borderColor: accent === a.id ? '#fff' : 'transparent', boxShadow: `0 0 12px ${a.color}66` }} />
                    <span className="text-[10px] text-muted-foreground">{a.name}</span>
                  </button>
                ))}
              </div>
              <div className="mt-6">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Theme</label>
                <div className="flex gap-2 mt-2">
                  {['Studio Dark', 'Midnight', 'Carbon'].map((t, i) => (
                    <button key={t} className={`px-3 py-2 rounded-lg text-xs border transition ${i === 0 ? 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40' : 'glass border-studio-border'}`}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'general' && (
            <div className="glass-strong rounded-2xl p-6 space-y-5">
              <h3 className="font-display font-semibold mb-2 flex items-center gap-2"><Keyboard size={16} className="text-neon-cyan" /> General</h3>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Clock size={11} /> Auto-save interval (seconds)</label>
                <input type="number" min="0" max="300" value={autoSave} onChange={(e) => setAutoSave(Number(e.target.value))} className="w-full mt-1.5 bg-studio-panel2 border border-studio-border rounded-lg px-3 py-2 text-sm focus:border-neon-cyan outline-none" />
              </div>
              <div className="border-t border-studio-border pt-4">
                <h4 className="font-medium text-sm mb-2">Keyboard Shortcuts</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[['Space', 'Play/Pause'], ['R', 'Record'], ['Ctrl+S', 'Save'], ['Ctrl+Z', 'Undo'], ['Ctrl+E', 'Export'], ['B', 'Add Track']].map(([k, d]) => (
                    <div key={k} className="flex items-center justify-between glass rounded px-3 py-1.5"><span className="text-muted-foreground">{d}</span><span className="font-mono px-2 py-0.5 rounded bg-studio-bg border border-studio-border">{k}</span></div>
                  ))}
                </div>
              </div>
              <button onClick={() => toast({ title: 'Settings saved' })} className="w-full py-3 rounded-xl bg-neon-cyan text-black font-medium text-sm hover:opacity-90">Save Settings</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}