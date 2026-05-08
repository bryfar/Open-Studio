'use client';

import { useCallback, useEffect, useState } from 'react';
import { useEditorStore } from '@/features/editor/store/editorStore';
import type { Clip, MediaCropRect } from '@/shared/types';
import { normalizeMediaCrop } from '@/features/editor/lib/clipPreviewStyle';
import { cn } from '@/shared/utils';

export type CanvasClipEditMode = 'transform' | 'crop';

type DragSession =
  | {
      kind: 'move';
      pointerId: number;
      startClientX: number;
      startClientY: number;
      startX: number;
      startY: number;
    }
  | {
      kind: 'scale-corner';
      pointerId: number;
      handle: 'nw' | 'ne' | 'sw' | 'se';
      startDist: number;
      startScaleX: number;
      startScaleY: number;
    }
  | {
      kind: 'scale-edge';
      pointerId: number;
      edge: 'n' | 's' | 'e' | 'w';
      startAxisDist: number;
      startScaleX: number;
      startScaleY: number;
    }
  | {
      kind: 'crop-edge';
      pointerId: number;
      edge: 'n' | 's' | 'e' | 'w';
      startCrop: MediaCropRect;
      startClientX: number;
      startClientY: number;
      outerW: number;
      outerH: number;
    };

const HANDLE_SZ = 10;
const EDGE_THICK = 8;

function dispatchClipUpdate(trackId: string, clipId: string, updater: (prev: Clip) => Clip) {
  const { project, dispatch } = useEditorStore.getState();
  if (!project) return;
  const track = project.tracks.find((t) => t.id === trackId);
  const prev = track?.clips.find((c) => c.id === clipId);
  if (!prev || !track) return;
  dispatch({ type: 'UPDATE_CLIP', payload: { trackId, clip: updater(prev) } });
}

/** Controles de recorte en coordenadas del contenedor del vídeo (debe ser hijo del mismo nodo que `cropOuterRef`). */
export function CanvasCropHandles({
  currentClip,
  selectedClipId,
  cropOuterRef,
}: {
  currentClip: Clip | null;
  selectedClipId: string | null;
  cropOuterRef: React.RefObject<HTMLDivElement | null>;
}) {
  const project = useEditorStore((s) => s.project);
  const [session, setSession] = useState<DragSession | null>(null);

  const trackId = (() => {
    if (!project || !currentClip) return null;
    const t = project.tracks.find((tr) => tr.clips.some((c) => c.id === currentClip.id));
    return t?.id ?? null;
  })();

  const trackLocked = (() => {
    if (!project || !currentClip) return true;
    const t = project.tracks.find((tr) => tr.clips.some((c) => c.id === currentClip.id));
    return t?.locked ?? true;
  })();

  const active =
    !!currentClip &&
    !!selectedClipId &&
    currentClip.id === selectedClipId &&
    currentClip.type === 'video' &&
    !!currentClip.mediaUrl &&
    !!trackId &&
    !trackLocked;

  const applyCrop = useCallback(
    (nextCrop: MediaCropRect) => {
      if (!currentClip || !trackId) return;
      dispatchClipUpdate(trackId, currentClip.id, (prev) => ({
        ...prev,
        mediaCrop: normalizeMediaCrop(nextCrop),
      }));
    },
    [currentClip, trackId]
  );

  useEffect(() => {
    if (!session || session.kind !== 'crop-edge') return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== session.pointerId) return;
      if (!currentClip || !trackId) return;

      if (session.kind === 'crop-edge') {
        const dx = e.clientX - session.startClientX;
        const dy = e.clientY - session.startClientY;
        const c = { ...session.startCrop };
        const px = dx / Math.max(1, session.outerW);
        const py = dy / Math.max(1, session.outerH);

        if (session.edge === 'w') {
          const d = px;
          const nx = Math.min(c.x + c.width - 0.05, Math.max(0, c.x + d));
          const nw = c.width - (nx - c.x);
          c.x = nx;
          c.width = nw;
        } else if (session.edge === 'e') {
          c.width = Math.max(0.05, Math.min(1 - c.x, c.width + px));
        } else if (session.edge === 'n') {
          const d = py;
          const ny = Math.min(c.y + c.height - 0.05, Math.max(0, c.y + d));
          const nh = c.height - (ny - c.y);
          c.y = ny;
          c.height = nh;
        } else if (session.edge === 's') {
          c.height = Math.max(0.05, Math.min(1 - c.y, c.height + py));
        }
        applyCrop(normalizeMediaCrop(c));
      }
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== session.pointerId) return;
      setSession(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [session, applyCrop, currentClip, trackId]);

  const startCropEdge = (e: React.PointerEvent, edge: 'n' | 's' | 'e' | 'w') => {
    e.stopPropagation();
    e.preventDefault();
    const outer = cropOuterRef.current;
    if (!outer || !currentClip) return;
    const r = outer.getBoundingClientRect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setSession({
      kind: 'crop-edge',
      pointerId: e.pointerId,
      edge,
      startCrop: normalizeMediaCrop(currentClip.mediaCrop),
      startClientX: e.clientX,
      startClientY: e.clientY,
      outerW: r.width,
      outerH: r.height,
    });
  };

  if (!active) return null;

  const c = normalizeMediaCrop(currentClip.mediaCrop);
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div
        className="pointer-events-auto absolute border-2 border-dashed border-amber-300/90 bg-amber-400/10"
        style={{
          left: `${c.x * 100}%`,
          top: `${c.y * 100}%`,
          width: `${c.width * 100}%`,
          height: `${c.height * 100}%`,
        }}
      >
        <div
          role="slider"
          aria-label="Recorte borde superior"
          aria-valuenow={Math.round(c.y * 100)}
          className={cn(
            'pointer-events-auto absolute left-0 right-0 cursor-ns-resize hover:bg-amber-200/40'
          )}
          style={{ height: EDGE_THICK, top: -EDGE_THICK / 2 }}
          onPointerDown={(e) => startCropEdge(e, 'n')}
        />
        <div
          role="slider"
          aria-label="Recorte borde inferior"
          aria-valuenow={Math.round((1 - (c.y + c.height)) * 100)}
          className="pointer-events-auto absolute left-0 right-0 cursor-ns-resize hover:bg-amber-200/40"
          style={{ height: EDGE_THICK, bottom: -EDGE_THICK / 2 }}
          onPointerDown={(e) => startCropEdge(e, 's')}
        />
        <div
          role="slider"
          aria-label="Recorte borde izquierdo"
          aria-valuenow={Math.round(c.x * 100)}
          className="pointer-events-auto absolute top-0 bottom-0 left-0 cursor-ew-resize hover:bg-amber-200/40"
          style={{ width: EDGE_THICK, left: -EDGE_THICK / 2 }}
          onPointerDown={(e) => startCropEdge(e, 'w')}
        />
        <div
          role="slider"
          aria-label="Recorte borde derecho"
          aria-valuenow={Math.round((1 - (c.x + c.width)) * 100)}
          className="pointer-events-auto absolute top-0 bottom-0 right-0 cursor-ew-resize hover:bg-amber-200/40"
          style={{ width: EDGE_THICK, right: -EDGE_THICK / 2 }}
          onPointerDown={(e) => startCropEdge(e, 'e')}
        />
      </div>
    </div>
  );
}

export function CanvasClipControls({
  mode,
  currentClip,
  selectedClipId,
  transformLayerRef,
}: {
  mode: CanvasClipEditMode;
  currentClip: Clip | null;
  selectedClipId: string | null;
  transformLayerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const project = useEditorStore((s) => s.project);
  const [session, setSession] = useState<DragSession | null>(null);

  const trackId = (() => {
    if (!project || !currentClip) return null;
    const t = project.tracks.find((tr) => tr.clips.some((c) => c.id === currentClip.id));
    return t?.id ?? null;
  })();

  const trackLocked = (() => {
    if (!project || !currentClip) return true;
    const t = project.tracks.find((tr) => tr.clips.some((c) => c.id === currentClip.id));
    return t?.locked ?? true;
  })();

  const active =
    !!currentClip &&
    !!selectedClipId &&
    currentClip.id === selectedClipId &&
    currentClip.type === 'video' &&
    !!currentClip.mediaUrl &&
    !!trackId &&
    !trackLocked;

  const applyTransform = useCallback(
    (partial: Partial<Clip['transform']>) => {
      if (!currentClip || !trackId) return;
      dispatchClipUpdate(trackId, currentClip.id, (prev) => ({
        ...prev,
        transform: { ...prev.transform, ...partial },
      }));
    },
    [currentClip, trackId]
  );

  useEffect(() => {
    if (!session) return;

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== session.pointerId) return;
      if (!currentClip || !trackId) return;

      const layer = transformLayerRef.current;
      if (!layer) return;

      if (session.kind === 'move') {
        const dx = e.clientX - session.startClientX;
        const dy = e.clientY - session.startClientY;
        applyTransform({
          x: session.startX + dx,
          y: session.startY + dy,
        });
        return;
      }

      if (session.kind === 'scale-corner') {
        const rect = layer.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
        if (session.startDist < 4) return;
        const factor = Math.max(0.15, Math.min(8, dist / session.startDist));
        const sx = Math.max(0.05, Math.min(8, session.startScaleX * factor));
        const sy = Math.max(0.05, Math.min(8, session.startScaleY * factor));
        applyTransform({ scaleX: sx, scaleY: sy });
        return;
      }

      if (session.kind === 'scale-edge') {
        const rect = layer.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let nx = session.startScaleX;
        let ny = session.startScaleY;
        if (session.edge === 'e' || session.edge === 'w') {
          const cur = Math.abs(e.clientX - cx);
          const ratio = cur / Math.max(4, session.startAxisDist);
          nx = Math.max(0.05, Math.min(8, session.startScaleX * ratio));
        }
        if (session.edge === 'n' || session.edge === 's') {
          const cur = Math.abs(e.clientY - cy);
          const ratio = cur / Math.max(4, session.startAxisDist);
          ny = Math.max(0.05, Math.min(8, session.startScaleY * ratio));
        }
        applyTransform({ scaleX: nx, scaleY: ny });
        return;
      }
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== session.pointerId) return;
      setSession(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [session, applyTransform, currentClip, trackId, transformLayerRef]);

  if (!active) return null;

  const handleCommon = 'absolute bg-white/95 border border-sky-500 shadow rounded-sm z-40 touch-none';

  const startScaleCorner = (
    e: React.PointerEvent,
    handle: 'nw' | 'ne' | 'sw' | 'se'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const layer = transformLayerRef.current;
    if (!layer || !currentClip) return;
    const rect = layer.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setSession({
      kind: 'scale-corner',
      pointerId: e.pointerId,
      handle,
      startDist: Math.max(4, dist),
      startScaleX: currentClip.transform.scaleX,
      startScaleY: currentClip.transform.scaleY,
    });
  };

  const startScaleEdge = (e: React.PointerEvent, edge: 'n' | 's' | 'e' | 'w') => {
    e.stopPropagation();
    e.preventDefault();
    const layer = transformLayerRef.current;
    if (!layer || !currentClip) return;
    const rect = layer.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const axisDist =
      edge === 'e' || edge === 'w'
        ? Math.abs(e.clientX - cx)
        : Math.abs(e.clientY - cy);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setSession({
      kind: 'scale-edge',
      pointerId: e.pointerId,
      edge,
      startAxisDist: Math.max(4, axisDist),
      startScaleX: currentClip.transform.scaleX,
      startScaleY: currentClip.transform.scaleY,
    });
  };

  const startMove = (e: React.PointerEvent) => {
    if (mode !== 'transform') return;
    e.stopPropagation();
    e.preventDefault();
    if (!currentClip) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setSession({
      kind: 'move',
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: currentClip.transform.x,
      startY: currentClip.transform.y,
    });
  };

  if (mode === 'crop') {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <button
        type="button"
        aria-label="Arrastrar clip en el lienzo"
        className="pointer-events-auto absolute inset-0 cursor-move bg-transparent"
        onPointerDown={startMove}
      />
      <div
        className={cn(handleCommon, '-translate-x-1/2 -translate-y-1/2 left-0 top-0 cursor-nwse-resize')}
        style={{ width: HANDLE_SZ, height: HANDLE_SZ }}
        onPointerDown={(e) => startScaleCorner(e, 'nw')}
      />
      <div
        className={cn(handleCommon, 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize')}
        style={{ width: HANDLE_SZ, height: HANDLE_SZ }}
        onPointerDown={(e) => startScaleEdge(e, 'n')}
      />
      <div
        className={cn(handleCommon, '-translate-y-1/2 right-0 top-0 translate-x-1/2 cursor-nesw-resize')}
        style={{ width: HANDLE_SZ, height: HANDLE_SZ }}
        onPointerDown={(e) => startScaleCorner(e, 'ne')}
      />
      <div
        className={cn(handleCommon, 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize')}
        style={{ width: HANDLE_SZ, height: HANDLE_SZ }}
        onPointerDown={(e) => startScaleEdge(e, 'w')}
      />
      <div
        className={cn(handleCommon, 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize')}
        style={{ width: HANDLE_SZ, height: HANDLE_SZ }}
        onPointerDown={(e) => startScaleEdge(e, 'e')}
      />
      <div
        className={cn(handleCommon, 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize')}
        style={{ width: HANDLE_SZ, height: HANDLE_SZ }}
        onPointerDown={(e) => startScaleCorner(e, 'sw')}
      />
      <div
        className={cn(handleCommon, 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize')}
        style={{ width: HANDLE_SZ, height: HANDLE_SZ }}
        onPointerDown={(e) => startScaleEdge(e, 's')}
      />
      <div
        className={cn(handleCommon, 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize')}
        style={{ width: HANDLE_SZ, height: HANDLE_SZ }}
        onPointerDown={(e) => startScaleCorner(e, 'se')}
      />
    </div>
  );
}
