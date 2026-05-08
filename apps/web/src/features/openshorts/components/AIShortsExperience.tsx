'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  analyzeAIShorts,
  generateAIShorts,
  getJobStatus,
  publishShort,
  resolveArtifactUrl,
} from '@/features/openshorts/lib/openshortsApi';
import { Button } from '@/shared/components/ui/Button';

export function AIShortsExperience() {
  const [geminiKey, setGeminiKey] = useState('');
  const [falKey, setFalKey] = useState('');
  const [elevenLabsKey, setElevenLabsKey] = useState('');
  const [uploadPostKey, setUploadPostKey] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('ugc');
  const [language, setLanguage] = useState('en');
  const [actorGender, setActorGender] = useState('female');
  const [numScripts, setNumScripts] = useState(3);
  const [videoMode, setVideoMode] = useState<'lowcost' | 'premium'>('lowcost');
  const [selectedScript, setSelectedScript] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'queued' | 'processing' | 'complete' | 'failed'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const isBusy = status === 'queued' || status === 'processing';

  async function handleAnalyze() {
    setError(null);
    const response = await analyzeAIShorts(
      {
        url: url.trim() || undefined,
        description: description.trim() || undefined,
        num_scripts: numScripts,
        style,
        language,
        actor_gender: actorGender,
      },
      geminiKey
    );
    setJobId(response.job_id);
    setStatus('queued');
  }

  async function handleGenerate() {
    if (!jobId) return;
    setError(null);
    const response = await generateAIShorts(
      {
        job_id: jobId,
        selected_script: selectedScript,
        video_mode: videoMode,
      },
      { falKey, elevenLabsKey }
    );
    setJobId(response.job_id);
    setStatus('queued');
  }

  async function handlePublish() {
    if (!jobId || !uploadPostKey) return;
    const res = await publishShort({ job_id: jobId, platforms: ['tiktok', 'instagram', 'youtube'] }, uploadPostKey);
    setPublishMsg(res.detail);
  }

  useEffect(() => {
    if (!jobId || !isBusy) return;
    const interval = window.setInterval(async () => {
      try {
        const data = await getJobStatus<{ video_url?: string; artifacts?: Array<{ s3_url?: string; url?: string; path?: string }> }>(jobId);
        setStatus(data.status);
        setLogs(data.logs ?? []);
        if (data.status === 'complete') {
          const artifact = data.result?.artifacts?.[0];
          const raw = data.result?.video_url ?? artifact?.s3_url ?? artifact?.url ?? artifact?.path;
          if (raw) setVideoUrl(resolveArtifactUrl(raw));
        }
        if (data.status === 'failed' && data.error) setError(data.error);
      } catch (err) {
        setStatus('failed');
        setError(err instanceof Error ? err.message : 'No se pudo consultar el job');
      }
    }, 1800);
    return () => window.clearInterval(interval);
  }, [jobId, isBusy]);

  const estimatedCost = useMemo(() => (videoMode === 'lowcost' ? '~$0.65' : '~$2.00'), [videoMode]);

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-2xl border border-[#24314b] bg-[#0d1422] p-5">
          <h1 className="text-2xl font-semibold">AI Shorts</h1>
          <p className="mt-1 text-sm text-[#9fb0d6]">Pipeline real: analyze, scripts, actor/video generation y publish.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
          <section className="rounded-2xl border border-[#22304a] bg-[#0c1322] p-4 space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="Gemini key" className="rounded-lg border border-[#2a3348] bg-[#101827] px-2 py-2 text-xs" />
              <input value={falKey} onChange={(e) => setFalKey(e.target.value)} placeholder="fal.ai key" className="rounded-lg border border-[#2a3348] bg-[#101827] px-2 py-2 text-xs" />
              <input value={elevenLabsKey} onChange={(e) => setElevenLabsKey(e.target.value)} placeholder="ElevenLabs key" className="rounded-lg border border-[#2a3348] bg-[#101827] px-2 py-2 text-xs" />
              <input value={uploadPostKey} onChange={(e) => setUploadPostKey(e.target.value)} placeholder="Upload-Post key" className="rounded-lg border border-[#2a3348] bg-[#101827] px-2 py-2 text-xs" />
            </div>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Website URL (optional)" className="w-full rounded-lg border border-[#2a3348] bg-[#101827] px-2 py-2 text-xs" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your product/business" rows={3} className="w-full rounded-lg border border-[#2a3348] bg-[#101827] px-2 py-2 text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="rounded-lg border border-[#2a3348] bg-[#101827] px-2 py-2 text-xs"><option value="ugc">UGC</option><option value="direct">Direct response</option><option value="story">Storytelling</option><option value="comparison">Before/After</option></select>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded-lg border border-[#2a3348] bg-[#101827] px-2 py-2 text-xs"><option value="en">English</option><option value="es">Espanol</option></select>
              <select value={actorGender} onChange={(e) => setActorGender(e.target.value)} className="rounded-lg border border-[#2a3348] bg-[#101827] px-2 py-2 text-xs"><option value="female">Female</option><option value="male">Male</option></select>
              <select value={numScripts} onChange={(e) => setNumScripts(Number(e.target.value))} className="rounded-lg border border-[#2a3348] bg-[#101827] px-2 py-2 text-xs"><option value={2}>2 scripts</option><option value={3}>3 scripts</option><option value={4}>4 scripts</option></select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setVideoMode('lowcost')} className={`rounded-lg border px-2 py-2 text-xs ${videoMode === 'lowcost' ? 'border-green-400 bg-green-500/20 text-green-100' : 'border-[#2a3348] bg-[#101827] text-[#9fb0d6]'}`}>Low Cost {estimatedCost}</button>
              <button type="button" onClick={() => setVideoMode('premium')} className={`rounded-lg border px-2 py-2 text-xs ${videoMode === 'premium' ? 'border-violet-400 bg-violet-500/20 text-violet-100' : 'border-[#2a3348] bg-[#101827] text-[#9fb0d6]'}`}>Premium {estimatedCost}</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="primary" onClick={() => void handleAnalyze()}>Analyze</Button>
              <Button type="button" variant="secondary" onClick={() => void handleGenerate()} disabled={!jobId}>Generate</Button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#9fb0d6]">Selected script</label>
              <input type="number" min={0} max={10} value={selectedScript} onChange={(e) => setSelectedScript(Number(e.target.value))} className="w-20 rounded border border-[#2a3348] bg-[#101827] px-2 py-1 text-xs" />
              <Button type="button" variant="ghost" onClick={() => void handlePublish()} disabled={!jobId || !uploadPostKey}>Publish</Button>
            </div>
            {error ? <p className="text-xs text-red-300">{error}</p> : null}
            {publishMsg ? <p className="text-xs text-emerald-300">{publishMsg}</p> : null}
          </section>

          <section className="rounded-2xl border border-[#22304a] bg-[#0c1322] p-4">
            <p className="text-xs text-[#9fb0d6]">Estado</p>
            <p className="mt-1 text-sm font-semibold">{status}</p>
            <div className="mt-3 h-72 overflow-auto rounded-lg border border-[#2a3348] bg-[#0a101c] p-2">
              {logs.length === 0 ? <p className="text-xs text-[#7e8aa9]">Sin logs todavía.</p> : logs.map((line, idx) => <p key={`${line}-${idx}`} className="text-xs text-[#b9c7e6]">{line}</p>)}
            </div>
            {videoUrl ? (
              <a href={videoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-sky-300 hover:underline">
                Open generated output
              </a>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
