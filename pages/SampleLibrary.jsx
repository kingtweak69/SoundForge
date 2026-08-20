import React, { useState, useEffect } from 'react';
import { db } from '@/lib/localdb';
import {
  Library, Search, Play, Pause, Heart, Upload, Sparkles,
  Star, Music2
} from 'lucide-react';
import PageHeader from '@/components/nexus/PageHeader';
import Waveform from '@/components/nexus/Waveform';
import { useToast } from '@/components/ui/use-toast';

const CATEGORIES = ['All', 'Drums', 'Bass', 'Synths', 'Guitars', 'Vocals', 'FX', 'Orchestral', 'World'];
const SOURCES = ['All', 'library', 'uploaded', 'ai-generated'];

export default function SampleLibrary() {
  const { toast } = useToast();
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [source, setSource] = useState('All');
  const [playing, setPlaying] = useState(null);
  const [favsOnly, setFavsOnly] = useState(false);

  useEffect(() => {
    (async () => {
      try { setSamples(await db.entities.Sample.list()); } catch (e) { setSamples([]); }
      setLoading(false);
    })();
  }, []);

  const toggleFav = async (s) => {
    try {
      await db.entities.Sample.update(s.id, { favorite: !s.favorite });
      setSamples(st => st.map(x => x.id === s.id ? { ...x, favorite: !x.favorite } : x));
    } catch (e) { toast({ title: 'Could not update favorite' }); }
  };

  const filtered = samples.filter(s =>
    (category === 'All' || s.category === category) &&
    (source === 'All' || s.source === source) &&
    (!favsOnly || s.favorite) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader
        icon={Library}
        title="Sample & Loop Library"
        subtitle="Browse, preview, and drag loops and one-shots into your studio"
        action={
          <div className="flex gap-2">
            <button onClick={() => document.getElementById('ai-gen-sample')?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass text-xs hover:bg-white/10"><Sparkles size={13} className="text-neon-purple" /> AI Generate</button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg glass text-xs hover:bg-white/10"><Upload size={13} /> Upload</button>
          </div>
        }
      />

      {/* Filters */}
      <div className="glass-strong rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, genre, BPM, key..." className="w-full bg-studio-panel2 border border-studio-border rounded-lg pl-9 pr-3 py-2 text-sm focus:border-neon-cyan outline-none" />
        </div>
        <button onClick={() => setFavsOnly(f => !f)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs ${favsOnly ? 'bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/40' : 'glass text-muted-foreground'}`}>
          <Heart size={13} /> Favorites
        </button>
      </div>

      <div className="flex gap-6">
        {/* Category sidebar */}
        <div className="w-48 shrink-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Categories</p>
          <div className="space-y-1">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${category === c ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>{c}</button>
            ))}
          </div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 mt-5">Source</p>
          <div className="space-y-1">
            {SOURCES.map(s => (
              <button key={s} onClick={() => setSource(s)} className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition ${source === s ? 'bg-neon-purple/15 text-neon-purple' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}`}>{s.replace('-', ' ')}</button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="glass h-44 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(s => (
                <div key={s.id} className="glass rounded-xl p-4 hover:border-neon-cyan/30 transition group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 grid place-items-center rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/20">
                      <Music2 size={16} className="text-neon-cyan" />
                    </div>
                    <button onClick={() => toggleFav(s)} className={`transition ${s.favorite ? 'text-neon-magenta' : 'text-muted-foreground/40 hover:text-neon-magenta'}`}>
                      <Heart size={15} fill={s.favorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground mb-2">{s.category} · {s.genre}</p>
                  <div className="h-9 mb-3"><Waveform bars={28} color={s.source === 'ai-generated' ? '#a855f7' : '#00f0ff'} height={36} animate={playing === s.id} /></div>
                  <div className="flex items-center justify-between">
                    <button onClick={() => setPlaying(p => p === s.id ? null : s.id)} className="w-8 h-8 grid place-items-center rounded-full bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan hover:text-black transition">
                      {playing === s.id ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                    </button>
                    <div className="text-[10px] font-mono text-muted-foreground text-right">
                      <p>{s.bpm > 0 ? `${s.bpm} BPM` : '—'} · {s.key || '—'}</p>
                      <p className="text-neon-cyan/60">{s.duration}s · {s.type}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {filtered.length === 0 && !loading && (
            <div className="text-center py-16 text-muted-foreground">
              <Star size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No samples match your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}