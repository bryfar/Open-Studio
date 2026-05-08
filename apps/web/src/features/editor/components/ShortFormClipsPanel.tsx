'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useEditorStore, createTrack } from '@/features/editor/store/editorStore';
import { Button } from '@/shared/components/ui/Button';
import { generateId } from '@/shared/utils';
import type { Clip, MediaFile, Project } from '@/shared/types';
import {
  createVideoSegmentClip,
  formatShortTimecode,
  SHORT_FORM_DURATION_PRESETS,
  SHORT_FORM_TIMELINE_GAP_SEC,
} from '@/features/editor/lib/shortFormClips';

type SourceMode = 'library' | 'timeline';

type QueuedSegment = { id: string; startSec: number; durationSec: number };

function findVideoClipContext(
  project: Project,
  selectedClipId: string | null,
  time: number
): { trackId: string; clip: Clip } | null {
  if (selectedClipId) {
    for (const track of project.tracks) {
      const clip = track.clips.find((c) => c.id === selectedClipId);
      if (clip && clip.type === 'video' && clip.mediaUrl) {
        return { trackId: track.id, clip };
      }
    }
  }
  for (const track of project.tracks) {
    if (track.type !== 'video') continue;
    const at = track.clips.find(
      (c) =>
        c.type === 'video' &&
        c.mediaUrl &&
        time >= c.startTime &&
        time < c.startTime + c.duration
    );
    if (at) return { trackId: track.id, clip: at };
  }
  return null;
}

function resolveLibraryVideo(
  mediaFiles: MediaFile[],
  selectedMediaId: string | null
): MediaFile | null {
  const vids = mediaFiles.filter((m) => m.type.startsWith('video'));
  if (vids.length === 0) return null;
  if (selectedMediaId) {
    const hit = vids.find((m) => m.id === selectedMediaId);
    if (hit) return hit;
  }
  return vids[0];
}

export function ShortFormClipsPanel({ onNotice }: { onNotice?: (msg: string) => void }) {
  const { project, mediaFiles, dispatch, currentTime, selectedClipId } = useEditorStore();

  const [sourceMode, setSourceMode] = useState<SourceMode>('library');
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [startSec, setStartSec] = useState('0');
  const [durationSec, setDurationSec] = useState('30');
  const [chainOnTimeline, setChainOnTimeline] = useState(true);
  const [placementCursor, setPlacementCursor] = useState<number | null>(null);
  const [queue, setQueue] = useState<QueuedSegment[]>([]);

  const videoLibrary = useMemo(
    () => mediaFiles.filter((m) => m.type.startsWith('video')),
    [mediaFiles]
  );

  const timelineCtx = useMemo(
    () => (project ? findVideoClipContext(project, selectedClipId, currentTime) : null),
    [project, selectedClipId, currentTime]
  );

  const librarySource = useMemo(
    () => resolveLibraryVideo(videoLibrary, selectedMediaId),
    [videoLibrary, selectedMediaId]
  );

  useEffect(() => {
    if (videoLibrary.length === 0) return;
    if (!selectedMediaId || !videoLibrary.some((m) => m.id === selectedMediaId)) {
      queueMicrotask(() => setSelectedMediaId(videoLibrary[0].id));
    }
  }, [videoLibrary, selectedMediaId]);

  const resolved = useMemo(() => {
    if (sourceMode === 'library') {
      if (!librarySource) return null;
      return {
        url: librarySource.url,
        mime: librarySource.type,
        name: librarySource.name,
        fullDuration: librarySource.duration,
      };
    }
    if (!timelineCtx) return null;
    const { clip } = timelineCtx;
    const mf = mediaFiles.find((m) => m.url === clip.mediaUrl);
    return {
      url: clip.mediaUrl!,
      mime: clip.mediaType ?? mf?.type ?? 'video/mp4',
      name: clip.name,
      fullDuration: mf?.duration,
    };
  }, [sourceMode, librarySource, timelineCtx, mediaFiles]);

  const syncPlayheadToStart = useCallback(() => {
    if (!project || !timelineCtx) {
      onNotice?.(
        'Selecciona un clip de vídeo en el timeline y coloca el playhead donde empieza el corte.'
      );
      return;
    }
    const { clip } = timelineCtx;
    const inFile = (clip.mediaStart ?? 0) + (currentTime - clip.startTime);
    setStartSec(String(Math.max(0, inFile)));
    onNotice?.(`Inicio en archivo: ${formatShortTimecode(inFile)}`);
  }, [project, timelineCtx, currentTime, onNotice]);

  const parseStart = () => Math.max(0, parseFloat(startSec.replace(',', '.')) || 0);
  const parseDur = () => Math.max(0.05, parseFloat(durationSec.replace(',', '.')) || 0.05);

  const validateSegment = (start: number, dur: number): string | null => {
    if (resolved?.fullDuration != null && start + dur > resolved.fullDuration + 0.05) {
      return `El segmento supera la duración del vídeo (~${formatShortTimecode(resolved.fullDuration)}).`;
    }
    return null;
  };

  const getOrCreateVideoTrackId = (): string | null => {
    const st = useEditorStore.getState();
    const p = st.project;
    if (!p) return null;
    let track = p.tracks.find((t) => t.type === 'video' && t.visible);
    if (!track) {
      track = createTrack('Video Track', 'video');
      st.dispatch({ type: 'ADD_TRACK', payload: track });
    }
    return track.id;
  };

  const timelineStartForNextClip = (): number => {
    if (!chainOnTimeline) return currentTime;
    return placementCursor ?? currentTime;
  };

  const addOneToTimeline = (start: number, dur: number): boolean => {
    const err = validateSegment(start, dur);
    if (err) {
      onNotice?.(err);
      return false;
    }
    if (!resolved) {
      onNotice?.('No hay fuente de vídeo válida.');
      return false;
    }
    const trackId = getOrCreateVideoTrackId();
    if (!trackId) {
      onNotice?.('No hay proyecto abierto.');
      return false;
    }
    const t0 = timelineStartForNextClip();
    const clip = createVideoSegmentClip(
      trackId,
      resolved.name,
      t0,
      dur,
      resolved.url,
      resolved.mime,
      start
    );
    dispatch({ type: 'ADD_CLIP', payload: { trackId, clip } });
    dispatch({ type: 'SET_SELECTED_CLIP', payload: clip.id });
    dispatch({ type: 'SET_CURRENT_TIME', payload: t0 });
    dispatch({ type: 'SET_PLAYBACK_STATE', payload: 'paused' });
    if (chainOnTimeline) {
      setPlacementCursor(t0 + dur + SHORT_FORM_TIMELINE_GAP_SEC);
    }
    onNotice?.(`Clip añadido: ${clip.name}`);
    return true;
  };

  const handleAddNow = () => addOneToTimeline(parseStart(), parseDur());

  const handleQueueAdd = () => {
    const start = parseStart();
    const dur = parseDur();
    const err = validateSegment(start, dur);
    if (err) {
      onNotice?.(err);
      return;
    }
    setQueue((q) => [...q, { id: generateId(), startSec: start, durationSec: dur }]);
    onNotice?.('Segmento en cola.');
  };

  const handleFlushQueue = () => {
    if (queue.length === 0) {
      onNotice?.('La cola está vacía.');
      return;
    }
    let ok = 0;
    for (const seg of queue) {
      if (!addOneToTimeline(seg.startSec, seg.durationSec)) break;
      ok++;
    }
    setQueue([]);
    onNotice?.(`Añadidos ${ok} clips al timeline.`);
  };

  const handleQuickGrid = (count: number, eachDur: number, fromStart: number) => {
    if (!resolved) return;
    const maxD = resolved.fullDuration;
    const segs: QueuedSegment[] = [];
    let t = fromStart;
    for (let i = 0; i < count; i++) {
      if (maxD != null && t + eachDur > maxD + 0.05) break;
      segs.push({ id: generateId(), startSec: t, durationSec: eachDur });
      t += eachDur;
    }
    setQueue((q) => [...q, ...segs]);
    onNotice?.(`${segs.length} segmentos encolados (${eachDur}s).`);
  };

  if (!project) {
    return <p className="text-xs text-zinc-500">Abre un proyecto para crear clips cortos.</p>;
  }

  return (
    <div className="space-y-3 text-xs text-zinc-300">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-[11px] leading-snug text-amber-100/90">
        <strong className="text-amber-200">YouTube y enlaces web:</strong> el navegador no puede recortar
        vídeo directo desde youtube.com. Importa el archivo de vídeo (descarga legal) con Upload o Videos.
        Aquí defines <em>trozos del mismo archivo</em> para TikTok, Reels o Shorts.
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wide text-zinc-500">Fuente</label>
        <select
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-zinc-200"
          value={sourceMode}
          onChange={(e) => setSourceMode(e.target.value as SourceMode)}
        >
          <option value="library">Vídeo de la biblioteca</option>
          <option value="timeline">Clip de vídeo en el timeline</option>
        </select>
      </div>

      {sourceMode === 'library' && (
        <div>
          <label className="text-[10px] uppercase tracking-wide text-zinc-500">Archivo</label>
          <select
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2 text-zinc-200"
            value={selectedMediaId ?? ''}
            onChange={(e) => setSelectedMediaId(e.target.value || null)}
          >
            {videoLibrary.length === 0 ? (
              <option value="">— Sube un vídeo en «Videos» —</option>
            ) : (
              videoLibrary.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.duration != null && m.duration > 0
                    ? ` (${Math.round(m.duration)}s)`
                    : ''}
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {sourceMode === 'timeline' && (
        <p className="text-[11px] text-zinc-500">
          {timelineCtx
            ? `Usando «${timelineCtx.clip.name}». Coloca el playhead y pulsa sincronizar para fijar el inicio en el archivo.`
            : 'Selecciona un clip de vídeo o coloca el playhead sobre uno.'}
        </p>
      )}

      {resolved && (
        <p className="text-[11px] text-zinc-500">
          Duración conocida del archivo:{' '}
          {resolved.fullDuration != null && resolved.fullDuration > 0
            ? `${Math.round(resolved.fullDuration)} s`
            : 'desconocida (se detecta al subir el vídeo)'}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wide text-zinc-500">Inicio en archivo (s)</label>
          <input
            type="text"
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-200"
            value={startSec}
            onChange={(e) => setStartSec(e.target.value)}
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wide text-zinc-500">Duración (s)</label>
          <input
            type="text"
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-zinc-200"
            value={durationSec}
            onChange={(e) => setDurationSec(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {SHORT_FORM_DURATION_PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className="rounded-md border border-zinc-600 bg-zinc-800 px-2 py-1 text-[10px] text-zinc-200 hover:bg-zinc-700"
            onClick={() => setDurationSec(String(p))}
          >
            {p}s
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" variant="secondary" className="w-full text-[11px]" onClick={syncPlayheadToStart}>
          Sincronizar inicio con playhead (clip actual)
        </Button>
        <label className="flex items-center gap-2 text-[11px] text-zinc-400">
          <input
            type="checkbox"
            checked={chainOnTimeline}
            onChange={(e) => {
              setChainOnTimeline(e.target.checked);
              setPlacementCursor(null);
            }}
          />
          Encadenar clips en el timeline (sin solapar)
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" className="flex-1 text-[11px]" onClick={handleAddNow}>
          Añadir al timeline
        </Button>
        <Button type="button" variant="ghost" className="flex-1 text-[11px]" onClick={handleQueueAdd}>
          Encolar segmento
        </Button>
      </div>

      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2">
        <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-2">Cola ({queue.length})</p>
        {queue.length === 0 ? (
          <p className="text-[11px] text-zinc-600">Vacía</p>
        ) : (
          <ul className="max-h-28 space-y-1 overflow-y-auto text-[11px] text-zinc-400">
            {queue.map((seg) => (
              <li key={seg.id} className="flex justify-between gap-2">
                <span>
                  {formatShortTimecode(seg.startSec)} → {seg.durationSec}s
                </span>
                <button
                  type="button"
                  className="text-rose-400 hover:underline"
                  onClick={() => setQueue((q) => q.filter((x) => x.id !== seg.id))}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="secondary"
          className="mt-2 w-full text-[11px]"
          disabled={queue.length === 0}
          onClick={handleFlushQueue}
        >
          Volcar cola al timeline
        </Button>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Rápido: varios cortes iguales</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-lg border border-zinc-700 bg-zinc-800 py-2 text-[10px] text-zinc-200 hover:bg-zinc-700"
            onClick={() => handleQuickGrid(3, 30, 0)}
          >
            3 × 30 s desde 0:00
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-700 bg-zinc-800 py-2 text-[10px] text-zinc-200 hover:bg-zinc-700"
            onClick={() => handleQuickGrid(5, 15, parseStart())}
          >
            5 × 15 s desde inicio actual
          </button>
        </div>
      </div>
    </div>
  );
}
