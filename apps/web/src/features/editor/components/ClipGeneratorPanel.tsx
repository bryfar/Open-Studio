'use client';

import { useMemo, useState } from 'react';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { Button } from '@/shared/components/ui/Button';
import { ShortFormClipsPanel } from '@/features/editor/components/ShortFormClipsPanel';
import { cn } from '@/shared/utils';
import { ep } from '@/features/editor/components/editorPanelUi';

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
    <div className={ep.root}>
      {status === 'idle' && (
        <>
          <div className={ep.card}>
            <label className={ep.label}>Source URL (opcional)</label>
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className={ep.field}
            />
            <p className="text-[11px] text-[var(--os-text-muted)]">
              Videos en biblioteca: <span className="text-[var(--os-text-primary)]">{videoCount}</span>
            </p>
          </div>

          <div className="flex gap-2">
            {(['youtube', 'instagram', 'tiktok'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={cn('flex-1 rounded-lg border px-2 py-2 text-[11px]', platform === p ? ep.segOn : ep.segOff)}
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
          <div className={ep.card}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-[var(--os-text-primary)]">Live Analysis</p>
              <span className="shrink-0 rounded-full border border-[var(--os-border-default)] px-2 py-0.5 text-[10px] text-[var(--os-text-secondary)]">
                {status.toUpperCase()}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-[11px] text-[var(--os-text-muted)]">
              {logs.map((line, i) => (
                <p key={`${line}-${i}`}>{line}</p>
              ))}
            </div>
          </div>

          <div className={ep.card}>
            <p className="mb-2 text-[11px] text-[var(--os-text-secondary)]">
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
