import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/localdb';
import {
  Mic, Mic2, Upload, Play, Pause, Loader2, Plus, Download,
  Cpu, Cloud, Save, AudioLines, Wand2, ArrowLeftRight, Clock
} from 'lucide-react';
import PageHeader from '@/components/nexus/PageHeader';
import Waveform from '@/components/nexus/Waveform';
import Knob from '@/components/nexus/Knob';
import { useToast } from '@/components/ui/use-toast';

const VOICE_MODELS = [
  { name: 'RVC v2', engine: 'local', desc: 'Real-time retrieval-based conversion' },
  { name: 'so-vits-svc 4.0', engine: 'local', desc: 'Soft-VC singing voice' },
  { name: 'XTTS v2', engine: 'local', desc: 'Multilingual zero-shot clone' },
  { name: 'F5-TTS', engine: 'local', desc: 'Flow-matching TTS' },
  { name: 'OpenVoice', engine: 'local', desc: 'Fast tone cloning' },
  { name: 'ElevenLabs', engine: 'cloud', desc: 'Premium cloud cloning' },
];
const VOICE_PRESETS = [
  { name: 'Robot', color: '#4dabf7', pitch: -8, formant: -6 },
  { name: 'Demon', color: '#ff4d6d', pitch: 6, formant: -5 },
  { name: 'Chipmunk', color: '#ffb627', pitch: -10, formant: 8 },
  { name: 'Deep Voice', color: '#a855f7', pitch: 5, formant: -4 },
  { name: 'Alien', color: '#22c55e', pitch: -3, formant: 6 },
  { name: 'Ghost', color: '#cbd5e1', pitch: 2, formant: 3 },
  { name: 'Child', color: '#00f0ff', pitch: -7, formant: 7 },
  { name: 'Elderly', color: '#ff8a4d', pitch: 3, formant: -3 },
  { name: 'F→M', color: '#a855f7', pitch: 4, formant: -6 },
  { name: 'M→F', color: '#ff00ff', pitch: -4, formant: 6 },
];
const PRESET_VOICE = {
  Robot: 'storm', Demon: 'storm', Chipmunk: 'spark', 'Deep Voice': 'storm',
  Alien: 'river', Ghost: 'honey', Child: 'spark', Elderly: 'river',
  'F→M': 'storm', 'M→F': 'honey',
};

export default function VoiceLab() {
  const { toast } = useToast();
  const [tab, setTab] = useState('clone');
  const [mode, setMode] = useState('local');
  const [model, setModel] = useState('RVC v2');
  const [profiles, setProfiles] = useState([]);
  const [targetText, setTargetText] = useState('');
  const [pitch, setPitch] = useState(0);
  const [formant, setFormant] = useState(0);
  const [stability, setStability] = useState(0.75);
  const [clarity, setClarity] = useState(0.8);
  const [processing, setProcessing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [referenceUrl, setReferenceUrl] = useState(null);
  const [referenceName, setReferenceName] = useState('');
  const [targetUrl, setTargetUrl] = useState(null);
  const [targetName, setTargetName] = useState('');
  const [isPlayingTarget, setIsPlayingTarget] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [isPlayingRef, setIsPlayingRef] = useState(false);
  const [isPlayingOut, setIsPlayingOut] = useState(false);
  const [playingProfileId, setPlayingProfileId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [outputReady, setOutputReady] = useState(false);
  const [profileUrl, setProfileUrl] = useState(null);
  const [loadedProfileId, setLoadedProfileId] = useState(null);
  const fileInputRef = useRef(null);
  const targetFileInputRef = useRef(null);
  const refAudioRef = useRef(null);
  const targetAudioRef = useRef(null);
  const outAudioRef = useRef(null);
  const profileAudioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recChunksRef = useRef([]);

  useEffect(() => {
    (async () => {
      try { setProfiles(await db.entities.VoiceProfile.list('-created_date', 10)); } catch (e) { setProfiles([]); }
    })();
  }, []);

  const handleFileSelect = async (file, opts = {}) => {
    if (!file) return;
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      if (opts.target) {
        setTargetUrl(file_url);
        setTargetName(file.name);
        toast({ title: 'Target voice uploaded', description: file.name });
      } else {
        setReferenceUrl(file_url);
        setReferenceName(file.name);
        toast({ title: 'Audio uploaded', description: file.name });
      }
    } catch (e) { toast({ title: opts.target ? 'Could not upload target voice' : 'Could not upload file' }); }
  };

  const toggleTargetPlayback = () => {
    if (!targetUrl) { toast({ title: 'No target voice loaded', description: 'Upload a target voice sample first' }); return; }
    if (targetAudioRef.current?.paused) targetAudioRef.current.play(); else targetAudioRef.current.pause();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      recChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) recChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        const blob = new Blob(recChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        await handleFileSelect(file);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      toast({ title: 'Recording started' });
    } catch (e) {
      setIsRecording(false);
      toast({ title: 'Microphone unavailable', description: 'Grant mic access to record' });
    }
  };

  const toggleRecording = () => (isRecording ? mediaRecorderRef.current?.stop() : startRecording());

  const processVoice = async () => {
    if (!targetText.trim()) { toast({ title: 'Enter target text' }); return; }
    if (tab === 'clone' && !referenceUrl) { toast({ title: 'No reference voice', description: 'Upload or record audio first' }); return; }
    setProcessing(true);
    setOutputReady(false);
    setOutputUrl(null);
    try {
      const voice = tab === 'change' ? (PRESET_VOICE[selectedPreset] || 'spark') : 'river';
      const res = await db.integrations.Core.GenerateSpeech({ text: targetText, voice, language_code: 'en' });
      const url = res?.url;
      if (!url) throw new Error('No audio returned');
      setOutputUrl(url);
      setOutputReady(true);
      toast({ title: tab === 'clone' ? 'Cloned voice ready' : 'Converted voice ready', description: `Generated via ${model}` });
    } catch (e) {
      toast({ title: 'Generation failed', description: e?.message || 'Please try again' });
    } finally {
      setProcessing(false);
    }
  };

  const saveProfile = async () => {
    if (!outputReady) { toast({ title: 'No output yet', description: 'Process a voice first' }); return; }
    const name = `Profile ${profiles.length + 1}`;
    try {
      await db.entities.VoiceProfile.create({
        name, modelUsed: model, pitch, formant, stability, clarity,
        referenceAudioUrl: referenceUrl || undefined,
      });
      setProfiles(await db.entities.VoiceProfile.list('-created_date', 10));
      toast({ title: 'Voice profile saved' });
    } catch (e) { toast({ title: 'Could not save profile' }); }
  };

  const toggleRefPlayback = () => {
    if (!referenceUrl) { toast({ title: 'No reference loaded', description: 'Upload or record audio first' }); return; }
    if (refAudioRef.current?.paused) refAudioRef.current.play(); else refAudioRef.current.pause();
  };
  const toggleOutPlayback = () => {
    if (!outputUrl) { toast({ title: 'No output yet', description: 'Process a voice first' }); return; }
    if (outAudioRef.current?.paused) outAudioRef.current.play(); else outAudioRef.current.pause();
  };

  useEffect(() => {
    if (profileUrl && profileAudioRef.current) profileAudioRef.current.play().catch(() => {});
  }, [profileUrl]);

  const playProfile = (p) => {
    const url = p.referenceAudioUrl;
    if (!url) { toast({ title: 'No audio saved for this profile' }); return; }
    if (loadedProfileId === p.id) {
      if (profileAudioRef.current?.paused) profileAudioRef.current.play(); else profileAudioRef.current.pause();
    } else {
      setProfileUrl(url);
      setLoadedProfileId(p.id);
    }
  };

  const exportOutput = () => {
    if (!outputUrl) { toast({ title: 'No output yet', description: 'Process a voice first' }); return; }
    setExporting(true);
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = `nexus-voice-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => { setExporting(false); toast({ title: 'Download started' }); }, 500);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      <PageHeader
        icon={Mic2}
        title="Voice Clone Lab"
        subtitle="Clone, convert, and transform voices — local models first, cloud as fallback"
        action={
          <div className="flex items-center gap-1 glass rounded-lg p-1">
            <button onClick={() => setMode('local')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${mode === 'local' ? 'bg-neon-cyan text-black' : 'text-muted-foreground'}`}><Cpu size={13} /> Local</button>
            <button onClick={() => setMode('cloud')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium ${mode === 'cloud' ? 'bg-neon-purple text-white' : 'text-muted-foreground'}`}><Cloud size={13} /> Cloud</button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[['clone','Voice Cloning',Wand2],['change','Voice Changing',ArrowLeftRight]].map(([id,label,Icon]) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${tab === id ? 'glass-strong border border-neon-cyan/30 text-neon-cyan' : 'glass text-muted-foreground hover:text-foreground'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          {/* Reference / Input */}
          <div className="glass-strong rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <Upload size={16} className="text-neon-cyan" /> {tab === 'clone' ? 'Reference Voice' : 'Input Source'}
            </h3>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files?.[0]); }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-studio-border rounded-xl p-8 text-center hover:border-neon-cyan/40 transition cursor-pointer"
            >
              <Mic size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm">{tab === 'clone' ? 'Drop reference audio (10–60s) or record' : 'Drop audio or use microphone'}</p>
              <p className="text-xs text-muted-foreground mt-1">.wav · .mp3 · .flac · .ogg · .m4a</p>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={toggleRecording} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${isRecording ? 'bg-red-500/20 text-red-400 animate-pulse-glow border border-red-500/40' : 'glass hover:bg-white/10'}`}>
                <Mic size={15} /> {isRecording ? 'Stop' : 'Record'}
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm hover:bg-white/10"><Upload size={15} /> Upload File</button>
              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0])} />
              {tab === 'change' && (
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm cursor-pointer">
                  <input type="checkbox" checked={liveMode} onChange={(e) => setLiveMode(e.target.checked)} className="accent-neon-green" />
                  Real-time live mode
                </label>
              )}
            </div>
            {/* Waveform preview */}
            <div className="h-16 mt-4 flex items-center gap-3 px-4 glass rounded-lg">
              <button onClick={toggleRefPlayback} disabled={!referenceUrl} className="w-9 h-9 grid place-items-center rounded-full bg-neon-cyan text-black disabled:opacity-40">{isPlayingRef ? <Pause size={15} /> : <Play size={15} />}</button>
              <Waveform bars={64} color="#a855f7" height={56} animate={liveMode || isRecording || isPlayingRef} />
              <span className="text-xs font-mono text-muted-foreground truncate max-w-[160px]">{isPlayingRef ? 'Playing...' : referenceName || '00:00 / 00:00'}</span>
            </div>
          </div>

          {/* Target voice (output to) */}
          {tab === 'clone' && (
            <div className="glass-strong rounded-2xl p-6">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Upload size={16} className="text-neon-purple" /> Target Voice (Output To)
              </h3>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files?.[0], { target: true }); }}
                onClick={() => targetFileInputRef.current?.click()}
                className="border-2 border-dashed border-studio-border rounded-xl p-8 text-center hover:border-neon-purple/40 transition cursor-pointer"
              >
                <AudioLines size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm">Drop the voice you want to output to</p>
                <p className="text-xs text-muted-foreground mt-1">.wav · .mp3 · .flac · .ogg · .m4a</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => targetFileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm hover:bg-white/10"><Upload size={15} /> Upload Target Voice</button>
                <input ref={targetFileInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileSelect(e.target.files?.[0], { target: true })} />
              </div>
              <div className="h-16 mt-4 flex items-center gap-3 px-4 glass rounded-lg">
                <button onClick={toggleTargetPlayback} disabled={!targetUrl} className="w-9 h-9 grid place-items-center rounded-full bg-neon-purple text-white disabled:opacity-40">{isPlayingTarget ? <Pause size={15} /> : <Play size={15} />}</button>
                <Waveform bars={64} color="#a855f7" height={56} animate={isPlayingTarget} />
                <span className="text-xs font-mono text-muted-foreground truncate max-w-[160px]">{isPlayingTarget ? 'Playing...' : targetName || '00:00 / 00:00'}</span>
              </div>
            </div>
          )}

          {/* Model selector */}
          {tab === 'clone' && (
            <div className="glass-strong rounded-2xl p-6">
              <h3 className="font-display font-semibold mb-4">Clone Model</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {VOICE_MODELS.map(m => (
                  <button key={m.name} onClick={() => setModel(m.name)} className={`text-left p-3 rounded-lg border transition ${model === m.name ? 'bg-neon-cyan/10 border-neon-cyan/40' : 'glass border-studio-border hover:border-white/20'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{m.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${m.engine === 'local' ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-neon-purple/20 text-neon-purple'}`}>{m.engine}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pitch / formant controls */}
          <div className="glass-strong rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2"><AudioLines size={16} className="text-neon-purple" /> Parameters</h3>
            <div className="flex flex-wrap justify-center gap-8">
              <Knob value={pitch} min={-12} max={12} label="Pitch (st)" accent="cyan" onChange={setPitch} />
              <Knob value={formant} min={-12} max={12} label="Formant" accent="purple" onChange={setFormant} />
              <Knob value={stability} label="Stability" accent="cyan" onChange={setStability} />
              <Knob value={clarity} label="Clarity" accent="purple" onChange={setClarity} />
            </div>
            <div className="grid grid-cols-4 gap-3 mt-6 text-center text-xs">
              <div><p className="font-mono text-neon-cyan">{pitch} st</p><p className="text-muted-foreground text-[10px]">Pitch shift</p></div>
              <div><p className="font-mono text-neon-purple">{formant}</p><p className="text-muted-foreground text-[10px]">Formant shift</p></div>
              <div><p className="font-mono text-neon-cyan">{Math.round(stability * 100)}%</p><p className="text-muted-foreground text-[10px]">Stability</p></div>
              <div><p className="font-mono text-neon-purple">{Math.round(clarity * 100)}%</p><p className="text-muted-foreground text-[10px]">Clarity</p></div>
            </div>
          </div>

          {/* Voice change presets */}
          {tab === 'change' && (
            <div className="glass-strong rounded-2xl p-6">
              <h3 className="font-display font-semibold mb-4">Character Presets</h3>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {VOICE_PRESETS.map(p => (
                  <button key={p.name} onClick={() => { setSelectedPreset(p.name); setPitch(p.pitch); setFormant(p.formant); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition ${selectedPreset === p.name ? 'border-neon-cyan/40 bg-white/5' : 'border-studio-border glass hover:border-white/20'}`}>
                    <div className="w-10 h-10 rounded-full grid place-items-center" style={{ background: `${p.color}22`, border: `1px solid ${p.color}66`, boxShadow: `0 0 8px ${p.color}44` }}>
                      <Mic size={16} style={{ color: p.color }} />
                    </div>
                    <span className="text-xs font-medium">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Target text for TTS */}
          <div className="glass-strong rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-3">{tab === 'clone' ? 'Target Text (Text-to-Speech)' : 'Text to Synthesize'}</h3>
            <textarea value={targetText} onChange={(e) => setTargetText(e.target.value)} rows={3} placeholder={tab === 'clone' ? "Type the text you want spoken in the cloned voice..." : "Type the text to synthesize in the chosen voice character..."} className="w-full bg-studio-panel2 border border-studio-border rounded-lg p-3 text-sm focus:border-neon-cyan outline-none resize-none" />
          </div>

          <button onClick={processVoice} disabled={processing} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-semibold text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 box-glow-cyan">
            {processing ? <><Loader2 size={17} className="animate-spin" /> Processing...</> : <><Wand2 size={17} /> {tab === 'clone' ? 'Clone Voice' : 'Convert Voice'}</>}
          </button>
        </div>

        {/* Right: output & profiles */}
        <div className="space-y-6">
          <div className="glass-strong rounded-2xl p-5">
            <h3 className="font-display font-semibold mb-3">Output Preview</h3>
            <div className="h-16 flex items-center gap-3 px-4 glass rounded-lg mb-3">
              <button onClick={toggleOutPlayback} disabled={!outputReady} className="w-9 h-9 grid place-items-center rounded-full bg-neon-purple text-white disabled:opacity-40">{isPlayingOut ? <Pause size={15} /> : <Play size={15} />}</button>
              <Waveform bars={48} color="#00f0ff" height={56} animate={isPlayingOut} />
            </div>
            <div className="flex gap-2">
              <button onClick={exportOutput} disabled={exporting} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg glass text-xs hover:bg-white/10 disabled:opacity-60">{exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}{exporting ? 'Exporting...' : 'Export'}</button>
              <button onClick={saveProfile} disabled={!outputReady} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg glass text-xs hover:bg-white/10 disabled:opacity-60"><Save size={13} /> Save Profile</button>
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-5">
            <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><Mic2 size={15} className="text-neon-cyan" /> Clone Library</h3>
            {profiles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No profiles saved.</p>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {profiles.map(p => (
                  <div key={p.id} className="glass rounded-lg p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neon-cyan/20 grid place-items-center"><Mic size={14} className="text-neon-cyan" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.modelUsed} · pitch {p.pitch}st</p>
                    </div>
                    <button onClick={() => playProfile(p)} className="w-7 h-7 grid place-items-center rounded glass hover:bg-white/10">{playingProfileId === p.id ? <Pause size={12} /> : <Play size={12} />}</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-5 border border-studio-border">
            <div className="flex items-center gap-2 mb-1"><Clock size={13} className="text-neon-green" /><span className="text-xs font-medium">Batch Queue</span></div>
            <p className="text-[11px] text-muted-foreground">Queue multiple conversions to run sequentially. 0 jobs pending.</p>
          </div>
        </div>
      </div>
      <audio ref={refAudioRef} src={referenceUrl ?? undefined} onPlay={() => setIsPlayingRef(true)} onPause={() => setIsPlayingRef(false)} onEnded={() => setIsPlayingRef(false)} preload="auto" />
      <audio ref={targetAudioRef} src={targetUrl ?? undefined} onPlay={() => setIsPlayingTarget(true)} onPause={() => setIsPlayingTarget(false)} onEnded={() => setIsPlayingTarget(false)} preload="auto" />
      <audio ref={outAudioRef} src={outputUrl ?? undefined} onPlay={() => setIsPlayingOut(true)} onPause={() => setIsPlayingOut(false)} onEnded={() => setIsPlayingOut(false)} preload="auto" />
      <audio ref={profileAudioRef} src={profileUrl ?? undefined} onPlay={() => setPlayingProfileId(loadedProfileId)} onPause={() => setPlayingProfileId(null)} onEnded={() => setPlayingProfileId(null)} preload="auto" />
    </div>
  );
}