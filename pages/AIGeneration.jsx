import React, { useState } from 'react';
import {
  Music4, Sparkles, Mic, Upload, FileText, Play, Pause, Send,
  Wand2, Loader2, Cloud, Cpu, Clock, Gauge, Music2
} from 'lucide-react';
import PageHeader from '@/components/nexus/PageHeader';
import Waveform from '@/components/nexus/Waveform';
import { useToast } from '@/components/ui/use-toast';

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Lo-Fi', 'Metal', 'Country', 'Folk', 'Ambient', 'Cinematic', 'Synthwave'];
const MOODS = ['Happy', 'Sad', 'Energetic', 'Calm', 'Dark', 'Epic', 'Dreamy', 'Aggressive', 'Romantic', 'Mysterious'];
const STRUCTURE = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Outro'];
const DURATIONS = [{ label: '30s', val: 30 }, { label: '60s', val: 60 }, { label: '2 min', val: 120 }, { label: '3 min', val: 180 }, { label: 'Full', val: 240 }];
const QUALITIES = ['Standard', 'High', 'Ultra'];

export default function AIGeneration() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('Electronic');
  const [mood, setMood] = useState('Epic');
  const [bpm, setBpm] = useState(128);
  const [key, setKey] = useState('C minor');
  const [duration, setDuration] = useState(120);
  const [quality, setQuality] = useState('High');
  const [engine, setEngine] = useState('local');
  const [structure, setStructure] = useState(['Intro', 'Verse', 'Chorus', 'Verse', 'Chorus', 'Bridge', 'Outro']);
  const [instrumental, setInstrumental] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState([]);

  const toggleSection = (s) => setStructure(st => st.includes(s) ? st.filter(x => x !== s) : [...st, s]);

  const generate = async () => {
    if (!prompt.trim()) { toast({ title: 'Enter a prompt', description: 'Describe the song you want to create' }); return; }
    setGenerating(true); setProgress(0);
    const interval = setInterval(() => setProgress(p => Math.min(100, p + Math.random() * 12)), 200);
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      const newTrack = { prompt: prompt.slice(0, 50), genre, mood, bpm, key, duration, quality, engine, audioUrl: 'demo', instrumental, timestamp: Date.now() };
      setHistory(h => [newTrack, ...h]);
      setTimeout(() => { setGenerating(false); setProgress(0); toast({ title: 'Track generated', description: `Your ${genre} track is ready to preview` }); }, 400);
    }, 3200);
  };

  const sendToStudio = () => toast({ title: 'Sent to Studio', description: 'Your generated track is now in the DAW' });

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader
        icon={Sparkles}
        title="AI Music Generation"
        subtitle="Describe a song — genre, mood, structure — and let the engine compose it"
        action={
          <div className="flex items-center gap-2 glass rounded-lg p-1">
            <button onClick={() => setEngine('local')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${engine === 'local' ? 'bg-neon-cyan text-black' : 'text-muted-foreground'}`}><Cpu size={13} /> Local</button>
            <button onClick={() => setEngine('cloud')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${engine === 'cloud' ? 'bg-neon-purple text-white' : 'text-muted-foreground'}`}><Cloud size={13} /> Cloud</button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* Left: generation form */}
        <div className="space-y-6">
          <div className="glass-strong rounded-2xl p-6">
            <label className="block text-sm font-medium mb-2">Describe the song you want</label>
            <textarea
              value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3}
              placeholder="A dreamy synthwave track with ethereal female vocals, driving 808 bass, retro arpeggios, and a cinematic build..."
              className="w-full bg-studio-panel2 border border-studio-border rounded-lg p-3 text-sm focus:border-neon-cyan outline-none resize-none"
            />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Genre</label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {GENRES.map(g => (
                    <button key={g} onClick={() => setGenre(g)} className={`px-2.5 py-1 rounded-full text-xs border transition ${genre === g ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40' : 'text-muted-foreground border-studio-border hover:text-foreground'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Mood</label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {MOODS.map(m => (
                    <button key={m} onClick={() => setMood(m)} className={`px-2.5 py-1 rounded-full text-xs border transition ${mood === m ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/40' : 'text-muted-foreground border-studio-border hover:text-foreground'}`}>{m}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Gauge size={11} /> Tempo</label>
                <div className="flex items-center gap-2 mt-2">
                  <input type="range" min="60" max="200" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="flex-1 accent-neon-cyan" />
                  <span className="text-sm font-mono w-12">{bpm}</span>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Key</label>
                <select value={key} onChange={(e) => setKey(e.target.value)} className="w-full mt-2 bg-studio-panel2 border border-studio-border rounded px-2 py-1.5 text-sm focus:border-neon-cyan outline-none">
                  {['C major', 'G major', 'D major', 'A major', 'E major', 'C minor', 'A minor', 'D minor', 'E minor', 'G minor'].map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Quality</label>
                <select value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full mt-2 bg-studio-panel2 border border-studio-border rounded px-2 py-1.5 text-sm focus:border-neon-cyan outline-none">
                  {QUALITIES.map(q => <option key={q}>{q}</option>)}
                </select>
              </div>
            </div>

            <label className="text-xs uppercase tracking-wider text-muted-foreground block mt-4">Song Structure</label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {STRUCTURE.map(s => (
                <button key={s} onClick={() => toggleSection(s)} className={`px-2.5 py-1 rounded-full text-xs border ${structure.includes(s) ? 'bg-neon-magenta/20 text-neon-magenta border-neon-magenta/40' : 'text-muted-foreground border-studio-border'}`}>{s}</button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Clock size={11} /> Duration</label>
                <div className="flex gap-1.5 mt-2">
                  {DURATIONS.map(d => (
                    <button key={d.val} onClick={() => setDuration(d.val)} className={`px-2.5 py-1 rounded text-xs ${duration === d.val ? 'bg-neon-cyan/20 text-neon-cyan' : 'glass text-muted-foreground'}`}>{d.label}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 mt-5 cursor-pointer">
                <input type="checkbox" checked={instrumental} onChange={(e) => setInstrumental(e.target.checked)} className="accent-neon-purple" />
                <span className="text-sm">Instrumental only</span>
              </label>
            </div>
          </div>

          {/* Lyrics input */}
          <div className="glass-strong rounded-2xl p-6">
            <label className="text-sm font-medium block mb-2 flex items-center gap-2"><FileText size={15} /> Lyrics</label>
            <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} rows={4} placeholder="Paste lyrics, type them, or let AI write them..." className="w-full bg-studio-panel2 border border-studio-border rounded-lg p-3 text-sm focus:border-neon-cyan outline-none resize-none" />
            <div className="flex gap-2 mt-3">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs hover:bg-white/10"><Wand2 size={13} className="text-neon-purple" /> Generate Lyrics</button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs hover:bg-white/10"><Mic size={13} /> Record</button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs hover:bg-white/10"><Upload size={13} /> Upload .txt</button>
            </div>
          </div>

          {/* Generate button */}
          <button onClick={generate} disabled={generating} className="w-full py-4 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2 box-glow-cyan">
            {generating ? <><Loader2 size={18} className="animate-spin" /> Generating... {progress}%</> : <><Sparkles size={18} /> Generate Track</>}
          </button>
          {generating && (
            <div className="h-2 bg-studio-panel2 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* Right: history & preview */}
        <div className="space-y-6">
          <div className="glass-strong rounded-2xl p-5">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2"><Music4 size={16} className="text-neon-cyan" /> Generation History</h3>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No generations yet. Your AI tracks will appear here.</p>
            ) : (
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {history.map((h, i) => (
                  <div key={i} className="glass rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium truncate flex-1">{h.prompt}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${h.engine === 'local' ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-neon-purple/20 text-neon-purple'}`}>{h.engine}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{h.genre} · {h.mood} · {h.bpm} BPM · {h.duration}s</p>
                    <div className="h-8 mt-2"><Waveform bars={40} color={h.engine === 'local' ? '#00f0ff' : '#a855f7'} height={32} /></div>
                    <div className="flex gap-2 mt-2">
                      <button className="flex items-center gap-1 px-2 py-1 rounded glass text-[10px] hover:bg-white/10"><Play size={10} /> Preview</button>
                      <button onClick={sendToStudio} className="flex items-center gap-1 px-2 py-1 rounded glass text-[10px] hover:bg-white/10"><Send size={10} /> To Studio</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-5 border border-studio-border">
            <h4 className="font-medium text-sm mb-3">Engine Status</h4>
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={14} className="text-neon-cyan" />
              <span className="text-xs flex-1">MusicGen Local</span>
              <span className="text-[10px] text-neon-green">● Online</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Local engine generates on your GPU — no cloud credits used. Falls back to Suno Cloud when busy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}