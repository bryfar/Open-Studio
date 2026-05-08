'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { convertToMp4 } from '@/features/editor/lib/ffmpeg';
import { renderCompositedWebM } from '@/features/editor/lib/exportCompositor';
import type { Project } from '@/shared/types';

type RenderQueueItem = NonNullable<Project['renderQueue']>[number];

export function BatchRenderPanel({ onNotice }: { onNotice?: (msg: string) => void }) {
  const { project, dispatch, mediaFiles } = useEditorStore();
  const [preset, setPreset] = useState('tiktok-1080x1920');
  const [running, setRunning] = useState(false);
  const queue: RenderQueueItem[] = project?.renderQueue ?? [];

  const updateQueue = (next: RenderQueueItem[]) =>
    dispatch({ type: 'UPDATE_PROJECT', payload: { renderQueue: next } });

  const addCurrent = () => {
    if (!project) return;
    updateQueue([
      ...queue,
      {
        id: `${Date.now()}`,
        name: project.name,
        preset,
        status: 'queued',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);
    onNotice?.('Proyecto agregado a cola de render.');
  };

  const runQueue = async () => {
    if (!project || running) return;
    setRunning(true);
    try {
      let nextQueue = [...queue];
      for (const item of nextQueue) {
        if (item.status !== 'queued') continue;
        nextQueue = nextQueue.map((q) =>
          q.id === item.id ? { ...q, status: 'running', updatedAt: Date.now() } : q
        );
        updateQueue(nextQueue);
        try {
          const webm = await renderCompositedWebM(project, mediaFiles);
          if (!webm) throw new Error('No se pudo componer la timeline');
          const mp4 = await convertToMp4(webm);
          if (!mp4) throw new Error('No se pudo convertir a MP4');
          const outputUrl = URL.createObjectURL(mp4);
          nextQueue = nextQueue.map((q) =>
            q.id === item.id
              ? { ...q, status: 'success', outputUrl, updatedAt: Date.now() }
              : q
          );
          updateQueue(nextQueue);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error de render';
          nextQueue = nextQueue.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error', error: msg, updatedAt: Date.now() }
              : q
          );
          updateQueue(nextQueue);
        }
      }
      onNotice?.('Batch render finalizado.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-3 text-xs text-zinc-300">
      <select value={preset} onChange={(e) => setPreset(e.target.value)} className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-2">
        <option value="tiktok-1080x1920">TikTok 1080x1920</option>
        <option value="youtube-1920x1080">YouTube 1920x1080</option>
        <option value="instagram-1080x1350">Instagram 1080x1350</option>
      </select>
      <Button type="button" variant="secondary" className="w-full text-[11px]" onClick={addCurrent}>
        Add to render queue
      </Button>
      <Button type="button" variant="primary" className="w-full text-[11px]" onClick={() => void runQueue()} disabled={running || queue.length === 0}>
        {running ? 'Rendering...' : 'Run queue'}
      </Button>
      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2 space-y-1">
        <p className="text-[11px] text-zinc-400">Queue ({queue.length})</p>
        {queue.length === 0 ? (
          <p className="text-[11px] text-zinc-500">Empty</p>
        ) : (
          queue.map((item) => (
            <div key={item.id} className="text-[11px] text-zinc-300">
              {item.name} · {item.preset} · {item.status}
              {item.outputUrl ? (
                <a className="ml-2 text-sky-300 underline" href={item.outputUrl} target="_blank" rel="noreferrer">
                  Open
                </a>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
