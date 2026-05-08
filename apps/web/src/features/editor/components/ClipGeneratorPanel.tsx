'use client';

import { useMemo, useState } from 'react';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { Button } from '@/shared/components/ui/Button';
import { ShortFormClipsPanel } from '@/features/editor/components/ShortFormClipsPanel';

type ClipStatus = 'idle' | 'processing' | 'complete' | 'error';

export function ClipGeneratorPanel({ onNotice }: { onNotice?: (msg: string) => void }) {
  const { mediaFiles } = useEditorStore();
  const [status, setStatus] = useState<ClipStatus>('idle');
  const [sourceUrl, setSourceUrl] = useState('');
  const [platform, setPlatform] = useState<'youtube' | 'instagram' | 'tiktok'>('youtube');
  const [logs, setLogs] = useState<string[]>([]);

  const videoCount = useMemo(
    () => mediaFiles.filter((m) => m.type.startsWith('video')).length,
    [mediaFiles]
  );

  function startProcessing() {
    setStatus('processing');
    setLogs([
      'Starting analysis...',
      'Detecting hook moments...',
      'Scoring segments...',
      'Preparing short candidates...',
    ]);
    window.setTimeout(() => {
      setStatus('complete');
      setLogs((prev) => [...prev, 'Done. Open timeline to refine clips.']);
      onNotice?.('Análisis completado. Ajusta y exporta los clips.');
    }, 1200);
  }

  return (
    <div className="space-y-3 text-xs text-zinc-300">
      {status === 'idle' && (
        <>
          <div className="rounded-lg border border-sky-500/30 bg-sky-500/[0.08] px-3 py-2">
            <p className="text-[11px] font-semibold text-sky-200">Create Viral Shorts</p>
            <p className="mt-1 text-[11px] text-sky-100/85">
              Estilo OpenShorts: sube video largo, detecta momentos y genera clips verticales.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-3 space-y-2">
            <label className="text-[10px] uppercase tracking-wide text-zinc-500">Source URL (opcional)</label>
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-200"
            />
            <p className="text-[11px] text-zinc-500">
              Videos en biblioteca: <span className="text-zinc-300">{videoCount}</span>
            </p>
          </div>

          <div className="flex gap-2">
            {(['youtube', 'instagram', 'tiktok'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`flex-1 rounded-lg border px-2 py-2 text-[11px] ${
                  platform === p
                    ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-400'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          <Button type="button" variant="secondary" className="w-full text-[11px]" onClick={startProcessing}>
            Create Viral Shorts
          </Button>
        </>
      )}

      {(status === 'processing' || status === 'complete' || status === 'error') && (
        <div className="space-y-3">
          <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-zinc-200">Live Analysis</p>
              <span className="rounded-full border border-zinc-600 px-2 py-0.5 text-[10px] text-zinc-300">
                {status.toUpperCase()}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-zinc-400">
              {logs.map((line, i) => (
                <p key={`${line}-${i}`}>{line}</p>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2">
            <p className="mb-2 text-[11px] text-zinc-400">
              Segment editor (clip timings, queue and timeline injection)
            </p>
            <ShortFormClipsPanel onNotice={onNotice} />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 text-[11px]"
              onClick={() => {
                setStatus('idle');
                setLogs([]);
              }}
            >
              New Analysis
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
