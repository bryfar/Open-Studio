'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  analyzeClipGenerator,
  generateClipGenerator,
  getJobStatus,
  resolveArtifactUrl,
} from '@/features/openshorts/lib/openshortsApi';
import { Button } from '@/shared/components/ui/Button';
import { StudioShell } from '@/shared/components/StudioShell';
import {
  EmptyLogPlaceholder,
  FormField,
  SegmentedOption,
  controlClass,
  openshortsGridClass,
  openshortsHeroClass,
  openshortsPanelClass,
} from '@/features/openshorts/components/openshortsExperienceUi';

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
        return 'En espera';
    }
  }, [status]);

  const platformLabels: Record<typeof platform, string> = {
    youtube: 'YouTube',
    instagram: 'Instagram',
    tiktok: 'TikTok',
  };

  return (
    <StudioShell activeNav="clip-generator">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <section className="rounded-2xl border border-[var(--os-border-default)] bg-[var(--os-bg-app)] p-4 text-[var(--os-text-primary)] shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <header className={openshortsHeroClass}>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--os-text-primary)]">Clip Generator</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--os-text-secondary)]">
              Sube un video largo, analiza momentos virales y genera clips listos para Shorts.
            </p>
          </header>

          <div className={`mt-5 ${openshortsGridClass}`}>
            <section className={openshortsPanelClass}>
              <FormField label="Video">
                <label className="group flex cursor-pointer flex-col gap-2 rounded-[var(--os-input-radius)] border border-dashed border-[var(--os-border-default)] bg-[var(--os-surface-1)] px-4 py-4 transition-colors duration-[var(--os-duration-fast)] hover:border-[var(--os-border-accent)] hover:bg-[var(--os-bg-hover)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--os-text-primary)] group-hover:border-[var(--os-border-accent)]">
                      Elegir archivo
                    </span>
                    <span className="text-xs text-[var(--os-text-secondary)]">
                      {file ? file.name : 'Ningún archivo seleccionado'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--os-text-muted)]">MP4, MOV u otros formatos que acepte el navegador.</p>
                  <input
                    type="file"
                    accept="video/*"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </FormField>

              <FormField label="Gemini API key (opcional)">
                <input
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza…"
                  className={controlClass}
                  autoComplete="off"
                />
              </FormField>

              <FormField label="Plataforma objetivo">
                <div className="grid grid-cols-3 gap-2">
                  {(['youtube', 'instagram', 'tiktok'] as const).map((p) => (
                    <SegmentedOption key={p} active={platform === p} onClick={() => setPlatform(p)}>
                      {platformLabels[p]}
                    </SegmentedOption>
                  ))}
                </div>
              </FormField>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="button" variant="primary" className="w-full sm:col-span-1" onClick={() => void handleAnalyze()}>
                  Analizar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full sm:col-span-1"
                  onClick={() => void handleGenerate()}
                  disabled={!jobId}
                >
                  Generar clips
                </Button>
              </div>
              {error ? <p className="text-xs text-[var(--os-error)]">{error}</p> : null}
            </section>

            <section className={`${openshortsPanelClass} min-h-0 lg:min-h-[28rem]`}>
              <div>
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--os-text-muted)]">Estado</span>
                <p className="mt-2 text-lg font-semibold tracking-tight text-[var(--os-text-primary)]">{statusLabel}</p>
                {jobId ? (
                  <p className="mt-1.5 break-all font-mono text-[10px] leading-snug text-[var(--os-text-muted)]" title="Job ID">
                    Job · {jobId}
                  </p>
                ) : null}
              </div>
              <div className="flex min-h-[14rem] flex-1 flex-col overflow-hidden rounded-xl border border-[var(--os-border-default)] bg-[var(--os-bg-canvas)]">
                <div className="flex-1 overflow-auto p-3">
                  {logs.length === 0 ? (
                    <EmptyLogPlaceholder
                      title="Sin actividad todavía"
                      hint="Cuando ejecutes Analizar o Generar clips, el progreso del job aparecerá aquí."
                    />
                  ) : (
                    <ul className="space-y-1.5 font-mono text-[11px] leading-relaxed text-[var(--os-text-secondary)]">
                      {logs.map((line, idx) => (
                        <li key={`${line}-${idx}`} className="break-words">
                          {line}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {artifacts.length > 0 ? (
                <div className="space-y-2 rounded-xl border border-[var(--os-border-default)] bg-[var(--os-bg-canvas)] p-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--os-text-muted)]">Salidas</p>
                  <ul className="space-y-1">
                    {artifacts.map((a) => (
                      <li key={`${a.name}-${a.url}`}>
                        <a
                          className="text-xs text-[var(--os-accent-primary)] underline-offset-2 hover:underline"
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {a.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          </div>
        </section>
      </div>
    </StudioShell>
  );
}
