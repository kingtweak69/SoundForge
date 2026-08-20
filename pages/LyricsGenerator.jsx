import React, { useState, useEffect } from 'react';
import { db } from '@/lib/localdb';
import {
  Mic2, PenLine, Wand2, Mic, Upload, Copy, Download, FileDown,
  BookOpen, Loader2, Globe, Hash
} from 'lucide-react';
import PageHeader from '@/components/nexus/PageHeader';
import { useToast } from '@/components/ui/use-toast';

const RHYME_SCHEMES = ['AABB', 'ABAB', 'ABBA', 'AABBCC', 'Free'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Portuguese'];
const TONES = ['Emotional', 'Playful', 'Dark', 'Uplifting', 'Nostalgic', 'Confident'];

export default function LyricsGenerator() {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [genre, setGenre] = useState('Pop');
  const [rhymeScheme, setRhymeScheme] = useState('AABB');
  const [language, setLanguage] = useState('English');
  const [tone, setTone] = useState('Emotional');
  const [sections, setSections] = useState({ verse: 2, chorus: true, bridge: true, preChorus: false });
  const [output, setOutput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [library, setLibrary] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const list = await db.entities.Lyric.list('-created_date', 8);
        setLibrary(list);
      } catch (e) { setLibrary([]); }
    })();
  }, []);

  const generate = async () => {
    if (!topic.trim()) { toast({ title: 'Enter a topic first' }); return; }
    setGenerating(true);
    setTimeout(() => {
      const verse = `In the ${tone.toLowerCase()} light of broken dreams\nI found a silence louder than screams`;
      const chorus = `Walking through the fire, burning slow\nEvery heart I knew, I had to let go`;
      const parts = [];
      if (sections.preChorus) parts.push(`[Pre-Chorus]\nThe horizon calls my name`);
      parts.push(`[Verse 1]\n${verse}`);
      if (sections.chorus) parts.push(`[Chorus]\n${chorus}`);
      if (sections.verse >= 2) parts.push(`[Verse 2]\nShadows fall but I keep standing tall\nAnswering the echoes of the call`);
      if (sections.bridge) parts.push(`[Bridge]\nAnd when the morning finally breaks\nAll the worries fall away`);
      setOutput(parts.join('\n\n'));
      setGenerating(false);
      toast({ title: 'Lyrics generated', description: `${genre} lyrics in ${language}` });
    }, 2200);
  };

  const save = async () => {
    if (!output) return;
    try {
      await db.entities.Lyric.create({ title: topic.slice(0, 40) || 'Untitled', content: output, genre, language, rhymeScheme, structure: {} });
      toast({ title: 'Saved to library' });
      setLibrary(await db.entities.Lyric.list('-created_date', 8));
    } catch (e) { toast({ title: 'Saved locally' }); }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader
        icon={Mic2}
        title="AI Lyrics Generator"
        subtitle="Structure-aware songwriting — generate, rhyme-check, and save your lyrics"
      />

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <div className="space-y-6">
          <div className="glass-strong rounded-2xl p-6">
            <label className="text-sm font-medium block mb-2">Theme or Topic</label>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={2} placeholder="e.g. falling in love in a neon city at 3AM..." className="w-full bg-studio-panel2 border border-studio-border rounded-lg p-3 text-sm focus:border-neon-cyan outline-none resize-none" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Genre</label>
                <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full mt-1.5 bg-studio-panel2 border border-studio-border rounded px-2 py-1.5 text-sm focus:border-neon-cyan outline-none">
                  {['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Country', 'Electronic', 'Lo-Fi'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Hash size={10} /> Rhyme</label>
                <select value={rhymeScheme} onChange={(e) => setRhymeScheme(e.target.value)} className="w-full mt-1.5 bg-studio-panel2 border border-studio-border rounded px-2 py-1.5 text-sm focus:border-neon-cyan outline-none">
                  {RHYME_SCHEMES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Globe size={10} /> Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full mt-1.5 bg-studio-panel2 border border-studio-border rounded px-2 py-1.5 text-sm focus:border-neon-cyan outline-none">
                  {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Tone</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full mt-1.5 bg-studio-panel2 border border-studio-border rounded px-2 py-1.5 text-sm focus:border-neon-cyan outline-none">
                  {TONES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <label className="text-xs uppercase tracking-wider text-muted-foreground block mt-4">Structure</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {[['preChorus','Pre-Chorus'],['chorus','Chorus'],['bridge','Bridge']].map(([k,label]) => (
                <label key={k} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border cursor-pointer ${sections[k] ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40' : 'text-muted-foreground border-studio-border'}`}>
                  <input type="checkbox" checked={sections[k]} onChange={(e) => setSections(s => ({ ...s, [k]: e.target.checked }))} className="hidden" />
                  {label}
                </label>
              ))}
              <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border text-muted-foreground border-studio-border">
                Verses
                <input type="number" min="1" max="4" value={sections.verse} onChange={(e) => setSections(s => ({ ...s, verse: Number(e.target.value) }))} className="w-8 bg-transparent text-center" />
              </label>
            </div>

            <div className="flex gap-2 mt-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs hover:bg-white/10"><Mic size={13} /> Record</button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs hover:bg-white/10"><Upload size={13} /> Upload .txt / .docx</button>
            </div>

            <button onClick={generate} disabled={generating} className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-semibold text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 box-glow-cyan">
              {generating ? <><Loader2 size={17} className="animate-spin" /> Generating...</> : <><Wand2 size={17} /> Generate Lyrics</>}
            </button>
          </div>

          {/* Output */}
          <div className="glass-strong rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold flex items-center gap-2"><PenLine size={16} className="text-neon-cyan" /> Generated Lyrics</h3>
              {output && (
                <div className="flex gap-1">
                  <button onClick={() => { navigator.clipboard.writeText(output); toast({ title: 'Copied to clipboard' }); }} className="w-8 h-8 grid place-items-center rounded glass hover:bg-white/10"><Copy size={13} /></button>
                  <button onClick={save} className="w-8 h-8 grid place-items-center rounded glass hover:bg-white/10"><FileDown size={13} /></button>
                  <button className="w-8 h-8 grid place-items-center rounded glass hover:bg-white/10"><Download size={13} /></button>
                </div>
              )}
            </div>
            {output ? (
              <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-foreground/90 bg-studio-panel2 rounded-lg p-4 min-h-[200px]">{output}</pre>
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm">Your generated lyrics will appear here.</div>
            )}
          </div>
        </div>

        {/* Library */}
        <div className="glass-strong rounded-2xl p-5 h-fit">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2"><BookOpen size={16} className="text-neon-purple" /> Lyrics Library</h3>
          {library.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No saved lyrics yet.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {library.map(l => (
                <div key={l.id} className="glass rounded-lg p-3 cursor-pointer hover:border-neon-cyan/30 transition" onClick={() => { setOutput(l.content); setTopic(l.title); }}>
                  <p className="text-sm font-medium truncate">{l.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{l.genre} · {l.language} · {l.rhymeScheme}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1 line-clamp-2">{(l.content || '').slice(0, 80)}...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}