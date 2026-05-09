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
import { StudioShell } from '@/shared/components/StudioShell';
import {
  EmptyLogPlaceholder,
  FormField,
  SegmentedOption,
  controlClass,
  openshortsGridClass,
  openshortsHeroClass,
  openshortsPanelClass,
  selectClass,
  textareaClass,
} from '@/features/openshorts/components/openshortsExperienceUi';

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

  const statusLabel = useMemo(() => {
    switch (status) {
      case 'queued':
        return 'Queued';
      case 'processing':
        return 'Processing';
      case 'complete':
        return 'Complete';
      case 'failed':
        return 'Failed';
      default:
        return 'Idle';
    }
  }, [status]);

  return (
    <StudioShell activeNav="ai-shorts">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <section className="rounded-2xl border border-[var(--os-border-default)] bg-[var(--os-bg-app)] p-4 text-[var(--os-text-primary)] shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <header className={openshortsHeroClass}>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--os-text-primary)]">AI Shorts</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--os-text-secondary)]">
              Pipeline: analyze → scripts → actor / video generation → publish.
            </p>
            <ol className="mt-3 flex flex-wrap gap-2 text-[11px] text-[var(--os-text-muted)] sm:gap-3">
              <li className="rounded-md border border-[var(--os-border-default)] bg-[var(--os-surface-1)] px-2.5 py-1.5 font-medium text-[var(--os-text-secondary)]">
                <span className="text-[var(--os-text-muted)]">1 ·</span> Analyze
              </li>
              <li className="rounded-md border border-[var(--os-border-default)] bg-[var(--os-surface-1)] px-2.5 py-1.5 font-medium text-[var(--os-text-secondary)]">
                <span className="text-[var(--os-text-muted)]">2 ·</span> Generate
              </li>
              <li className="rounded-md border border-[var(--os-border-default)] bg-[var(--os-surface-1)] px-2.5 py-1.5 font-medium text-[var(--os-text-secondary)]">
                <span className="text-[var(--os-text-muted)]">3 ·</span> Publish
              </li>
            </ol>
          </header>

          <div className={`mt-5 ${openshortsGridClass}`}>
          <section className={openshortsPanelClass}>
            <div className="space-y-3 rounded-xl border border-[var(--os-border-default)] bg-[var(--os-surface-1)]/40 p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--os-text-muted)]">API keys</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Gemini">
                  <input value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} className={controlClass} autoComplete="off" />
                </FormField>
                <FormField label="fal.ai">
                  <input value={falKey} onChange={(e) => setFalKey(e.target.value)} className={controlClass} autoComplete="off" />
                </FormField>
                <FormField label="ElevenLabs">
                  <input value={elevenLabsKey} onChange={(e) => setElevenLabsKey(e.target.value)} className={controlClass} autoComplete="off" />
                </FormField>
                <FormField label="Upload-Post">
                  <input value={uploadPostKey} onChange={(e) => setUploadPostKey(e.target.value)} className={controlClass} autoComplete="off" />
                </FormField>
              </div>
            </div>

            <FormField label="Website URL (optional)">
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={controlClass} />
            </FormField>

            <FormField label="Product or business">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What should the scripts emphasize?"
                rows={4}
                className={textareaClass}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Style">
                <select value={style} onChange={(e) => setStyle(e.target.value)} className={selectClass}>
                  <option value="ugc">UGC</option>
                  <option value="direct">Direct response</option>
                  <option value="story">Storytelling</option>
                  <option value="comparison">Before / after</option>
                </select>
              </FormField>
              <FormField label="Language">
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className={selectClass}>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </FormField>
              <FormField label="Actor voice">
                <select value={actorGender} onChange={(e) => setActorGender(e.target.value)} className={selectClass}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </FormField>
              <FormField label="Scripts">
                <select value={numScripts} onChange={(e) => setNumScripts(Number(e.target.value))} className={selectClass}>
                  <option value={2}>2 scripts</option>
                  <option value={3}>3 scripts</option>
                  <option value={4}>4 scripts</option>
                </select>
              </FormField>
            </div>

            <FormField label="Video cost profile">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <SegmentedOption active={videoMode === 'lowcost'} onClick={() => setVideoMode('lowcost')}>
                  Low cost · ~$0.65
                </SegmentedOption>
                <SegmentedOption active={videoMode === 'premium'} onClick={() => setVideoMode('premium')}>
                  Premium · ~$2.00
                </SegmentedOption>
              </div>
            </FormField>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="primary" className="w-full" onClick={() => void handleAnalyze()}>
                Analyze
              </Button>
              <Button type="button" variant="secondary" className="w-full" onClick={() => void handleGenerate()} disabled={!jobId}>
                Generate
              </Button>
            </div>

            <div className="space-y-3 rounded-xl border border-[var(--os-border-default)] bg-[var(--os-surface-1)]/40 p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--os-text-muted)]">Publish</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <FormField label="Selected script index" className="min-w-0 flex-1 sm:max-w-[10rem]">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={selectedScript}
                    onChange={(e) => setSelectedScript(Number(e.target.value))}
                    className={controlClass}
                  />
                </FormField>
                <Button type="button" variant="ghost" className="w-full shrink-0 sm:w-auto" onClick={() => void handlePublish()} disabled={!jobId || !uploadPostKey}>
                  Publish
                </Button>
              </div>
            </div>

            {error ? <p className="text-xs text-[var(--os-error)]">{error}</p> : null}
            {publishMsg ? <p className="text-xs text-[var(--os-success)]">{publishMsg}</p> : null}
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
                    title="No logs yet"
                    hint="Run Analyze or Generate to stream job output here."
                  />
                ) : (
                  <div className="space-y-1.5 font-mono text-[11px] leading-relaxed text-[var(--os-text-secondary)]">
                    {logs.map((line, idx) => (
                      <p key={`${line}-${idx}`} className="break-words">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {videoUrl ? (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-xs font-medium text-[var(--os-accent-primary)] underline-offset-2 hover:underline"
              >
                Open generated output
              </a>
            ) : null}
          </section>
          </div>
        </section>
      </div>
    </StudioShell>
  );
}
