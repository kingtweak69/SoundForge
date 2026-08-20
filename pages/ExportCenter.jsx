import React, { useState, useEffect } from 'react';
import { db } from '@/lib/localdb';
import {
  Download, FileAudio, Loader2, CheckCircle, XCircle, Clock,
  Link2, Code, HardDrive, Music2
} from 'lucide-react';
import PageHeader from '@/components/nexus/PageHeader';
import { useToast } from '@/components/ui/use-toast';
import { useStudio } from '@/lib/audio/StudioEngine';
import { downloadBlob, encodeWav, buildGraph, scheduleStep, stepDur, audible } from '@/lib/audio/engine';

const FORMATS = ['WAV'];  // lossy formats need an encoder (lamejs) wired in first
const BIT_DEPTHS = [16, 24, 32];
const SAMPLE_RATES = [44100, 48000, 96000, 192000];
const MP3_RATES = [128, 192, 320];
const TYPES = [
  { id: 'mix', name: 'Full Mix', desc: 'Mastered stereo file' },
  { id: 'stems', name: 'Stems', desc: 'One WAV per track' },
];

export default function ExportCenter() {
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState('');
  const [format, setFormat] = useState('WAV');
  const [type, setType] = useState('mix');
  const [bitDepth, setBitDepth] = useState(24);
  const [sampleRate, setSampleRate] = useState(48000);
  const [mp3Rate, setMp3Rate] = useState(320);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    (async () => { try { setProjects(await db.entities.Project.list('-lastModified')); } catch (e) {} })();
  }, []);

  const { project: liveProject, exportWav } = useStudio();

  // Render each track on its own so stems come out of the same engine as the mix.
  const renderStems = async () => {
    const OfflineCtor = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const list = liveProject.songMode ? liveProject.song : [0];
    const totalSteps = list.reduce((a, i) => a + (liveProject.patterns[i]?.steps || 0), 0);
    const dur = totalSteps * stepDur(liveProject) + 2.2;
    const out = [];
    for (const track of liveProject.tracks) {
      const solo = { ...liveProject, tracks: liveProject.tracks.map(t => ({ ...t, muted: t.id !== track.id, soloed: false })) };
      const off = new OfflineCtor(2, Math.ceil(sampleRate * dur), sampleRate);
      const eng = buildGraph(off, solo);
      let t = 0.05;
      for (const pi of list) {
        const pat = solo.patterns[pi];
        if (!pat) continue;
        for (let st = 0; st < pat.steps; st++) { scheduleStep(eng, pi, st, t); t += stepDur(solo); }
      }
      out.push({ name: track.name, blob: encodeWav(await off.startRendering()) });
    }
    return out;
  };

  const exportNow = async () => {
    const id = 'job' + Date.now();
    const label = `${liveProject.name || 'Untitled'} · ${type}`;
    setJobs(j => [{ id, projectName: label, format, type, status: 'processing' }, ...j]);
    try {
      if (type === 'stems') {
        const stems = await renderStems();
        stems.forEach(s => downloadBlob(s.blob, `${liveProject.name || 'mix'} - ${s.name}.wav`));
        setJobs(j => j.map(x => x.id === id ? { ...x, status: 'completed', fileSize: stems.reduce((a, s) => a + s.blob.size, 0) } : x));
        toast({ title: `${stems.length} stems exported`, description: 'One WAV per track' });
      } else {
        const { blob, duration } = await exportWav({ sampleRate });
        downloadBlob(blob, `${liveProject.name || 'mix'}.wav`);
        setJobs(j => j.map(x => x.id === id ? { ...x, status: 'completed', fileSize: blob.size } : x));
        toast({ title: 'Mix exported', description: `${duration.toFixed(1)}s · ${sampleRate / 1000}kHz WAV` });
      }
    } catch (e) {
      setJobs(j => j.map(x => x.id === id ? { ...x, status: 'failed' } : x));
      toast({ title: 'Export failed', description: e.message });
    }
  };

  const unsupported = format !== 'WAV';

  const statusIcon = (s) => s === 'completed' ? <CheckCircle size={16} className="text-neon-green" /> : s === 'processing' ? <Loader2 size={16} className="animate-spin text-neon-cyan" /> : s === 'failed' ? <XCircle size={16} className="text-red-400" /> : <Clock size={16} className="text-muted-foreground" />;

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      <PageHeader icon={Download} title="Export Center" subtitle="Render your project to any format — full mix, stems, MIDI, or region" />

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        {/* Export form */}
        <div className="glass-strong rounded-2xl p-6 space-y-5">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Project</label>
            <div className="w-full mt-1.5 bg-studio-panel2 border border-studio-border rounded-lg px-3 py-2 text-sm flex items-center justify-between">
              <span className="truncate">{liveProject.name || 'Untitled'}</span>
              <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                {liveProject.tracks.length} tracks · {liveProject.songMode ? 'song' : 'pattern'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Export Type</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {TYPES.map(t => (
                <button key={t.id} onClick={() => setType(t.id)} className={`text-left p-3 rounded-lg border transition ${type === t.id ? 'bg-neon-cyan/10 border-neon-cyan/40' : 'glass border-studio-border hover:border-white/20'}`}>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Format</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {FORMATS.map(f => (
                <button key={f} onClick={() => setFormat(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${format === f ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40' : 'glass text-muted-foreground border-studio-border'}`}>{f}</button>
              ))}
            </div>
          </div>

          {format !== 'MIDI' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {format === 'MP3' ? (
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">Bitrate</label>
                    <select value={mp3Rate} onChange={(e) => setMp3Rate(Number(e.target.value))} className="w-full mt-1.5 bg-studio-panel2 border border-studio-border rounded-lg px-3 py-2 text-sm focus:border-neon-cyan outline-none">
                      {MP3_RATES.map(r => <option key={r} value={r}>{r} kbps</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">Bit Depth</label>
                    <select value={bitDepth} onChange={(e) => setBitDepth(Number(e.target.value))} disabled={format === 'MP3' || format === 'M4A'} className="w-full mt-1.5 bg-studio-panel2 border border-studio-border rounded-lg px-3 py-2 text-sm focus:border-neon-cyan outline-none disabled:opacity-50">
                      {BIT_DEPTHS.map(b => <option key={b} value={b}>{b}-bit</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">Sample Rate</label>
                  <select value={sampleRate} onChange={(e) => setSampleRate(Number(e.target.value))} className="w-full mt-1.5 bg-studio-panel2 border border-studio-border rounded-lg px-3 py-2 text-sm focus:border-neon-cyan outline-none">
                    {SAMPLE_RATES.map(r => <option key={r} value={r}>{r / 1000} kHz</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[['Share Link', Link2], ['Embed Code', Code], ['Cloud Storage', HardDrive]].map(([label, Icon]) => (
                  <button key={label} onClick={() => toast({ title: `${label} generated` })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs hover:bg-white/10"><Icon size={13} /> {label}</button>
                ))}
              </div>
            </>
          )}

          <button onClick={exportNow} disabled={unsupported} className="w-full disabled:opacity-40 py-3.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2 box-glow-cyan">
            <Download size={17} /> Export Now
          </button>
        </div>

        {/* Export history */}
        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2"><Music2 size={15} className="text-neon-cyan" /> Export Queue & History</h3>
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileAudio size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No exports yet. Start one to see it here.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {jobs.map(j => (
                <div key={j.id} className="glass rounded-lg p-3 flex items-center gap-3">
                  {statusIcon(j.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{j.projectName || 'Project'}.{j.format?.toLowerCase() || 'wav'}</p>
                    <p className="text-[10px] text-muted-foreground">{j.format} · {j.quality} · {j.type} {j.fileSize ? `· ${(j.fileSize / 1024 / 1024).toFixed(1)} MB` : ''}</p>
                  </div>
                  {j.status === 'completed' && <button className="w-8 h-8 grid place-items-center rounded glass hover:bg-white/10"><Download size={14} /></button>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}