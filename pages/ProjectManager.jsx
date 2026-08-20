import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/localdb';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, Plus, Search, Grid3x3, List, MoreVertical,
  Copy, Trash2, Pencil, Share2, Clock
} from 'lucide-react';
import PageHeader from '@/components/nexus/PageHeader';
import { useToast } from '@/components/ui/use-toast';

const STATUS = { draft: '#64748b', 'in-progress': '#00f0ff', mastered: '#a855f7', exported: '#22c55e' };

export default function ProjectManager() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(null);

  const load = useCallback(async () => {
    try { setProjects(await db.entities.Project.list('-lastModified')); } catch (e) { setProjects([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createProject = async () => {
    try {
      const p = await db.entities.Project.create({ name: 'Untitled Project', genre: 'Electronic', bpm: 120, keySignature: 'C minor', timeSignature: '4/4', duration: 0, status: 'draft', settings: { sampleRate: 44100, bitDepth: 24 } });
      toast({ title: 'New project created' });
      setProjects([p, ...projects]);
      navigate('/studio');
    } catch (e) { toast({ title: 'Could not create project' }); }
  };

  const deleteProject = async (p) => {
    try { await db.entities.Project.delete(p.id); setProjects(ps => ps.filter(x => x.id !== p.id)); toast({ title: 'Project deleted' }); }
    catch (e) { toast({ title: 'Could not delete' }); }
  };

  const duplicateProject = async (p) => {
    try {
      await db.entities.Project.create({ name: `${p.name} (Copy)`, genre: p.genre, bpm: p.bpm, keySignature: p.keySignature, timeSignature: p.timeSignature, duration: p.duration, status: 'draft', settings: p.settings });
      toast({ title: 'Project duplicated' });
      load();
    } catch (e) { toast({ title: 'Could not duplicate' }); }
  };

  const filtered = projects.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.genre || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader
        icon={FolderKanban}
        title="Project Manager"
        subtitle="Create, duplicate, share, and archive your studio sessions"
        action={
          <button onClick={createProject} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neon-cyan text-black text-sm font-medium hover:opacity-90 box-glow-cyan"><Plus size={16} /> New Project</button>
        }
      />

      <div className="glass-strong rounded-xl p-4 mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="w-full bg-studio-panel2 border border-studio-border rounded-lg pl-9 pr-3 py-2 text-sm focus:border-neon-cyan outline-none" />
        </div>
        <div className="flex gap-1 ml-auto">
          <button onClick={() => setView('grid')} className={`w-9 h-9 grid place-items-center rounded-lg ${view === 'grid' ? 'bg-neon-cyan/20 text-neon-cyan' : 'glass text-muted-foreground'}`}><Grid3x3 size={16} /></button>
          <button onClick={() => setView('list')} className={`w-9 h-9 grid place-items-center rounded-lg ${view === 'list' ? 'bg-neon-cyan/20 text-neon-cyan' : 'glass text-muted-foreground'}`}><List size={16} /></button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass h-56 rounded-xl animate-pulse" />)}</div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div key={p.id} className="glass rounded-xl overflow-hidden hover:border-neon-cyan/30 transition group">
              <div className="relative aspect-square overflow-hidden bg-studio-panel cursor-pointer" onClick={() => navigate('/studio')}>
                {p.coverImage ? <img src={p.coverImage} alt={p.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-85 group-hover:scale-105 transition" /> : <div className="w-full h-full grid place-items-center text-muted-foreground/30"><FolderKanban size={40} /></div>}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium border" style={{ borderColor: `${STATUS[p.status]}66`, color: STATUS[p.status] }}>{p.status}</div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate flex-1">{p.name}</p>
                  <button onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)} className="w-7 h-7 grid place-items-center rounded hover:bg-white/10"><MoreVertical size={14} /></button>
                </div>
                <p className="text-xs text-muted-foreground">{p.genre} · {p.bpm} BPM · {p.keySignature}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1"><Clock size={9} /> {p.lastModified ? new Date(p.lastModified).toLocaleDateString() : '—'}</p>
                {menuOpen === p.id && (
                  <div className="absolute right-3 mt-1 glass-strong rounded-lg p-1 z-20 w-32" onMouseLeave={() => setMenuOpen(null)}>
                    <button onClick={() => navigate('/studio')} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-white/10"><Pencil size={12} /> Open</button>
                    <button onClick={() => duplicateProject(p)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-white/10"><Copy size={12} /> Duplicate</button>
                    <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-white/10"><Share2 size={12} /> Share</button>
                    <button onClick={() => deleteProject(p)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-red-500/20 text-red-400"><Trash2 size={12} /> Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-strong rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-studio-border text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Genre</th><th className="p-3 font-medium">BPM</th><th className="p-3 font-medium">Key</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Modified</th><th className="p-3"></th>
            </tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-studio-border/40 hover:bg-white/5 cursor-pointer" onClick={() => navigate('/studio')}>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-muted-foreground">{p.genre}</td>
                  <td className="p-3 font-mono">{p.bpm}</td>
                  <td className="p-3 font-mono">{p.keySignature}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full text-[10px] border" style={{ borderColor: `${STATUS[p.status]}66`, color: STATUS[p.status] }}>{p.status}</span></td>
                  <td className="p-3 text-xs text-muted-foreground">{p.lastModified ? new Date(p.lastModified).toLocaleDateString() : '—'}</td>
                  <td className="p-3"><button onClick={(e) => { e.stopPropagation(); deleteProject(p); }} className="text-muted-foreground hover:text-red-400"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}