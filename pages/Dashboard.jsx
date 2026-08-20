import React, { useState, useEffect } from 'react';
import { db } from '@/lib/localdb';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Music4, Mic, Upload, Sparkles, PenLine, FolderKanban,
  TrendingUp, HardDrive, Layers, Clock, ArrowRight
} from 'lucide-react';

import PageHeader from '@/components/nexus/PageHeader';

const STATUS_COLORS = {
  draft: '#64748b', 'in-progress': '#00f0ff', mastered: '#a855f7', exported: '#22c55e',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await db.entities.Project.list('-lastModified', 6);
        setProjects(list);
      } catch (e) { setProjects([]); }
      setLoading(false);
    })();
  }, []);

  const stats = [
    { label: 'Total Projects', value: projects.length || '—', icon: FolderKanban, accent: 'cyan' },
    { label: 'Total Tracks', value: '28', icon: Layers, accent: 'purple' },
    { label: 'Storage Used', value: '4.2 GB', icon: HardDrive, accent: 'magenta' },
    { label: 'Hours Produced', value: '18', icon: Clock, accent: 'green' },
  ];

  const quickActions = [
    { name: 'Generate with AI', desc: 'Text-to-music in seconds', icon: Sparkles, path: '/ai-generation', color: 'cyan' },
    { name: 'Record Audio', desc: 'Capture mic input live', icon: Mic, path: '/studio', color: 'purple' },
    { name: 'Upload Audio', desc: 'Bring in your stems', icon: Upload, path: '/studio', color: 'magenta' },
    { name: 'Clone Voice', desc: 'Build a voice profile', icon: Mic, path: '/voice-lab', color: 'green' },
    { name: 'Write Lyrics', desc: 'AI songwriting assistant', icon: PenLine, path: '/lyrics', color: 'cyan' },
    { name: 'New Project', desc: 'Open a fresh DAW session', icon: Plus, path: '/studio', color: 'purple' },
  ];

  const colorMap = { cyan: 'border-neon-cyan/30 text-neon-cyan', purple: 'border-neon-purple/30 text-neon-purple', magenta: 'border-neon-magenta/30 text-neon-magenta', green: 'border-neon-green/30 text-neon-green' };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader
        icon={Music4}
        title="Welcome to NEXUS"
        subtitle="Your hybrid AI-DAW studio — local-first, cloud-ready"
        action={
          <button onClick={() => navigate('/studio')} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neon-cyan text-black font-medium text-sm hover:opacity-90 transition box-glow-cyan">
            <Plus size={16} /> New Project
          </button>
        }
      />

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl glass-strong p-6 lg:p-8 mb-6">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-neon-cyan/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-neon-purple/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-xs text-neon-cyan mb-3">
              <Sparkles size={12} /> Local Engine Active
            </span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight mb-2">
              Create. Clone. <span className="neon-cyan text-glow-cyan">Master.</span>
            </h2>
            <p className="text-muted-foreground max-w-md">One studio for AI music generation, voice cloning, multi-track recording, and pro mastering — all free.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/ai-generation')} className="px-5 py-3 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-semibold text-sm hover:scale-[1.03] transition">
              Generate with AI
            </button>
            <button onClick={() => navigate('/voice-lab')} className="px-5 py-3 rounded-xl glass border border-studio-border text-sm font-medium hover:border-neon-cyan/40 transition">
              Voice Lab
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass rounded-xl p-5 flex items-center gap-4">
              <div className={`w-11 h-11 grid place-items-center rounded-lg border ${colorMap[s.accent]}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-display font-bold">{loading ? '…' : s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <h3 className="font-display font-semibold text-lg mb-3">Quick Start</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.name}
              onClick={() => navigate(a.path)}
              className="group glass rounded-xl p-5 text-left hover:border-neon-cyan/30 transition relative overflow-hidden"
            >
              <div className={`w-10 h-10 grid place-items-center rounded-lg border ${colorMap[a.color]} mb-3`}>
                <Icon size={18} />
              </div>
              <p className="font-medium text-sm mb-0.5">{a.name}</p>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
              <ArrowRight size={16} className="absolute top-5 right-5 text-muted-foreground/40 group-hover:text-neon-cyan group-hover:translate-x-1 transition" />
            </button>
          );
        })}
      </div>

      {/* Recent projects */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-lg">Recent Projects</h3>
        <button onClick={() => navigate('/projects')} className="text-xs text-neon-cyan hover:underline">View all</button>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass rounded-xl h-48 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate('/studio')}
              className="group glass rounded-xl overflow-hidden text-left hover:border-neon-cyan/40 transition"
            >
              <div className="relative aspect-square overflow-hidden bg-studio-panel">
                {p.coverImage && <img src={p.coverImage} alt={p.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition" />}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium border" style={{ borderColor: `${STATUS_COLORS[p.status]}66`, color: STATUS_COLORS[p.status] }}>
                  {p.status}
                </div>
              </div>
              <div className="p-3">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.genre} · {p.bpm} BPM · {p.keySignature}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}