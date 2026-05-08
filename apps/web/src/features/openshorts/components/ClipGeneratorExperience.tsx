'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  analyzeClipGenerator,
  generateClipGenerator,
  getJobStatus,
  resolveArtifactUrl,
} from '@/features/openshorts/lib/openshortsApi';
import { Button } from '@/shared/components/ui/Button';

export function ClipGeneratorExperience() {
  const [file, setFile] = useState<File | null>(null);
  const [geminiKey, setGeminiKey] = useState('');
  const [platform, setPlatform] = useState<'youtube' | 'instagram' | 'tiktok'>('youtube');
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'queued' | 'processing' | 'complete' | 'failed'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [artifacts, setArtifacts] = useState<Array<{ name: string; url: string }>>([]);

  const isBusy = status === 'queued' || status === 'processing';

  async function handleAnalyze() {
    if (!file) {
      setError('Selecciona un video para iniciar.');
      return;
    }
    setError(null);
    const form = new FormData();
    form.append('file', file);
    form.append('target_platform', platform);
    const response = await analyzeClipGenerator(form, geminiKey || undefined);
    setJobId(response.job_id);
    setStatus('queued');
  }

  async function handleGenerate() {
    if (!jobId) return;
    setError(null);
    const response = await generateClipGenerator({ job_id: jobId, target_platform: platform }, geminiKey || undefined);
    setJobId(response.job_id);
    setStatus('queued');
  }

  useEffect(() => {
    if (!jobId || !isBusy) return;
    const interval = window.setInterval(async () => {
      try {
        const data = await getJobStatus<{
          clips?: Array<{ start: number; end: number }>;
          artifacts?: Array<{ name: string; url?: string; s3_url?: string; path?: string }>;
        }>(jobId);
        setStatus(data.status);
        setLogs(data.logs ?? []);
        if (data.status === 'complete' && data.result?.artifacts) {
          setArtifacts(
            data.result.artifacts.map((a) => ({
              name: a.name,
              url: resolveArtifactUrl(a.s3_url ?? a.url ?? a.path ?? ''),
            }))
          );
        }
        if (data.status === 'failed' && data.error) setError(data.error);
      } catch (err) {
        setStatus('failed');
        setError(err instanceof Error ? err.message : 'No se pudo consultar el job');
      }
    }, 1800);
    return () => window.clearInterval(interval);
  }, [jobId, isBusy]);

  const statusLabel = useMemo(() => {
    switch (status) {
      case 'queued':
        return 'En cola';
      case 'processing':
        return 'Procesando';
      case 'complete':
        return 'Completado';
      case 'failed':
        return 'Falló';
      default:
        return 'Idle';
    }
  }, [status]);

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-2xl border border-[#24314b] bg-[#0d1422] p-5">
          <h1 className="text-2xl font-semibold">Clip Generator</h1>
          <p className="mt-1 text-sm text-[#9fb0d6]">
            Sube video largo, analiza momentos virales y genera clips listos para Shorts.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-2xl border border-[#22304a] bg-[#0c1322] p-4 space-y-3">
            <label className="block text-xs text-[#9fb0d6]">Video source</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-[#2a3348] bg-[#101827] px-2 py-2 text-xs"
            />
            <label className="block text-xs text-[#9fb0d6]">Gemini API key (opcional)</label>
            <input
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full rounded-lg border border-[#2a3348] bg-[#101827] px-2 py-2 text-xs"
            />
            <div className="grid grid-cols-3 gap-2">
              {(['youtube', 'instagram', 'tiktok'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`rounded-lg border px-2 py-2 text-[11px] ${
                    platform === p
                      ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                      : 'border-[#2a3348] bg-[#111827] text-[#9fb0d6]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="primary" className="flex-1" onClick={() => void handleAnalyze()}>
                Analyze
              </Button>
              <Button type="button" variant="secondary" className="flex-1" onClick={() => void handleGenerate()} disabled={!jobId}>
                Generate Clips
              </Button>
            </div>
            {error ? <p className="text-xs text-red-300">{error}</p> : null}
          </section>

          <section className="rounded-2xl border border-[#22304a] bg-[#0c1322] p-4">
            <p className="text-xs text-[#9fb0d6]">Estado</p>
            <p className="mt-1 text-sm font-semibold">{statusLabel}</p>
            <div className="mt-3 h-64 overflow-auto rounded-lg border border-[#2a3348] bg-[#0a101c] p-2">
              {logs.length === 0 ? (
                <p className="text-xs text-[#7e8aa9]">Sin logs todavía.</p>
              ) : (
                <ul className="space-y-1">
                  {logs.map((line, idx) => (
                    <li key={`${line}-${idx}`} className="text-xs text-[#b9c7e6]">
                      {line}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {artifacts.length > 0 ? (
              <div className="mt-3 rounded-lg border border-[#2a3348] bg-[#0a101c] p-2 space-y-1">
                <p className="text-xs text-[#9fb0d6]">Artifacts</p>
                {artifacts.map((a) => (
                  <a key={`${a.name}-${a.url}`} className="block text-xs text-sky-300 hover:underline" href={a.url} target="_blank" rel="noreferrer">
                    {a.name}
                  </a>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
