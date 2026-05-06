'use client';

import type { CSSProperties } from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { icons } from '@/components/icons';
import { Button } from '@/components/ui/Button';

const PREVIEW_ZOOM_PRESETS = [50, 75, 100, 125, 150, 200] as const;
const ZOOM_FIT = 'fit' as const;
export function Canvas() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const { project, currentTime, playbackState, dispatch } = useEditorStore();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [zoomSelect, setZoomSelect] = useState<string>(ZOOM_FIT);
  const [fitWidthPx, setFitWidthPx] = useState<number | null>(null);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  const isPlaybackPlaying = playbackState === 'playing';

  const videoClips =
    project?.tracks
      ?.filter((t) => t.type === 'video' && t.visible)
      ?.flatMap((t) => t.clips) ?? [];

  const currentClip =
    videoClips.find(
      (c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration
    ) ?? videoClips[0];

  const canPlayVideo = Boolean(currentClip?.mediaUrl && currentClip.mediaType?.startsWith('video'));

  useEffect(() => {
    setVideoReady(false);
    setHasError(false);
    setIsLoading(false);
  }, [currentClip?.id]);

  useEffect(() => {
    if (!videoRef.current || !canPlayVideo) return;

    if (isPlaybackPlaying && videoReady) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          videoRef.current!.muted = true;
          videoRef.current!.play().catch(() => {});
        });
      }
    } else {
      videoRef.current.pause();
    }
  }, [isPlaybackPlaying, canPlayVideo, videoReady]);

  useEffect(() => {
    if (videoRef.current && currentClip?.mediaUrl && videoReady) {
      const clipStartTime = currentClip.startTime;
      const relTime = currentTime - clipStartTime;
      const targetTime = Math.max(0, Math.min(relTime, videoRef.current.duration || 0));

      if (videoRef.current.duration && Math.abs(videoRef.current.currentTime - targetTime) > 0.05) {
        videoRef.current.currentTime = targetTime;
      }
    }
  }, [currentTime, currentClip, videoReady]);

  const handleLoadedMetadata = useCallback(() => {
    setVideoReady(true);
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    setVideoReady(false);
  }, []);

  const handleEnded = useCallback(() => {
    dispatch({ type: 'SET_PLAYBACK_STATE', payload: 'paused' });
  }, [dispatch]);

  useEffect(() => {
    if (zoomSelect !== ZOOM_FIT || !project) return;
    const areaEl = previewAreaRef.current;
    if (!areaEl) return;
    const compute = () => {
      const cw = Math.max(0, areaEl.clientWidth);
      const ch = Math.max(0, areaEl.clientHeight);
      const pw = project.width;
      const ph = project.height;
      if (cw === 0 || ch === 0 || pw === 0 || ph === 0) {
        setFitWidthPx(null);
        return;
      }
      const scale = Math.min(cw / pw, ch / ph);
      setFitWidthPx(pw * scale);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(areaEl);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [zoomSelect, project?.width, project?.height, project?.id]);

  const getFullscreenElement = () =>
    document.fullscreenElement ??
    (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement ??
    null;

  useEffect(() => {
    const syncFs = () => {
      const el = containerRef.current;
      const fs = getFullscreenElement();
      setIsPreviewFullscreen(!!el && fs === el);
    };
    document.addEventListener('fullscreenchange', syncFs);
    document.addEventListener('webkitfullscreenchange', syncFs as EventListener);
    return () => {
      document.removeEventListener('fullscreenchange', syncFs);
      document.removeEventListener('webkitfullscreenchange', syncFs as EventListener);
    };
  }, []);

  const togglePreviewFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    const fs = getFullscreenElement();
    try {
      if (fs === el) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else
          await (
            document as Document & { webkitExitFullscreen?: () => Promise<void> }
          ).webkitExitFullscreen?.();
      } else {
        if (el.requestFullscreen) await el.requestFullscreen();
        else
          (el as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.();
      }
    } catch {
      /* ignore */
    }
  };

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-muted)]">No project loaded</p>
      </div>
    );
  }

  const previewBoxStyle: CSSProperties =
    zoomSelect === ZOOM_FIT
      ? {
          aspectRatio: `${project.width}/${project.height}`,
          width: fitWidthPx != null ? `${fitWidthPx}px` : '100%',
          maxWidth: '100%',
        }
      : {
          aspectRatio: `${project.width}/${project.height}`,
          width: `${Number(zoomSelect)}%`,
          maxWidth: Number(zoomSelect) <= 100 ? '100%' : undefined,
        };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--bg-primary)]">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
        <div
          ref={containerRef}
          className="editor-preview-chrome flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-hidden"
        >
          <div
            ref={previewAreaRef}
            className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center overflow-auto"
          >
          <div className="relative mx-auto w-full min-w-0 max-w-full" style={previewBoxStyle}>
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: '#000',
              zIndex: 0,
            }}
          />

          {canPlayVideo && currentClip?.mediaUrl ? (
            <video
              key={currentClip.id}
              ref={videoRef}
              src={currentClip.mediaUrl}
              className="absolute inset-0 h-full w-full object-contain"
              style={{ zIndex: 1 }}
              muted={false}
              playsInline
              preload="auto"
              onLoadStart={handleLoadStart}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleError}
              onEnded={handleEnded}
            />
          ) : null}

          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
                <span className="text-xs text-[var(--text-secondary)]">Cargando…</span>
              </div>
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
              <div className="text-center">
                <icons.video className="mx-auto mb-2 text-red-500" size={32} />
                <p className="text-sm text-red-400">No se pudo cargar el vídeo</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{currentClip?.mediaUrl}</p>
              </div>
            </div>
          )}

          {!canPlayVideo && !isLoading && !hasError && (
            <div className="absolute inset-0 z-[5] flex items-center justify-center bg-[var(--bg-tertiary)]">
              {videoClips.length === 0 ? (
                <div className="text-center">
                  <icons.video className="mx-auto mb-3 text-[var(--text-muted)]" size={48} />
                  <p className="text-sm font-medium text-[var(--text-muted)]">
                    Añade clips de vídeo a la línea de tiempo
                  </p>
                  <p className="mt-2 max-w-xs text-xs text-[var(--text-muted)]">
                    Arrastra medios a la biblioteca y haz clic para añadirlos al timeline
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-[var(--text-muted)]">
                    No hay clip de vídeo en esta posición del cabezal
                  </p>
                </div>
              )}
            </div>
          )}
          </div>
          </div>

          <div className="flex w-full min-w-0 shrink-0 items-center justify-end gap-2 border-t border-[#283046] bg-gradient-to-r from-[#0c1018] to-[#080b11] px-3 py-2">
            <label htmlFor="preview-zoom" className="sr-only">
              Zoom de vista previa
            </label>
            <select
              id="preview-zoom"
              className="box-border h-9 min-w-0 cursor-pointer rounded-lg border border-[#2c3548] bg-[#141c2a] px-3 pr-9 text-[12px] font-medium text-[#e4ebff] shadow-inner shadow-black/20 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/45"
              style={{ width: 'fit-content', maxWidth: 'min(100%, 11rem)' }}
              value={zoomSelect}
              onChange={(e) => setZoomSelect(e.target.value)}
              title="Zoom de vista previa"
            >
              <option value={ZOOM_FIT}>Fit content</option>
              {PREVIEW_ZOOM_PRESETS.map((pct) => (
                <option key={pct} value={String(pct)}>
                  {pct}%
                </option>
              ))}
            </select>
            <div className="h-6 w-px shrink-0 bg-[#283046]" aria-hidden />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-lg border border-transparent text-[#b8c5e8] hover:border-[#3d4f6a] hover:bg-[#1a2438]"
              title={isPreviewFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              onClick={() => void togglePreviewFullscreen()}
            >
              {isPreviewFullscreen ? <icons.minimize size={18} /> : <icons.maximize size={18} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
