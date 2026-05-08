'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useEditorStore, createTrack, createClip } from '@/features/editor/store/editorStore';
import { createBackgroundClip, defaultProjectBackground } from '@/features/editor/lib/sceneTimeline';
import { icons } from '@/shared/components/icons';
import { Button } from '@/shared/components/ui/Button';
import { Slider } from '@/shared/components/ui/Slider';
import { timelineColors, cn, formatTime, generateId } from '@/shared/utils';
import {
  Track,
  Clip,
  Project,
  MediaFile,
  DEFAULT_MEDIA_CROP,
  MediaCropRect,
  TimelineMarker,
} from '@/shared/types';
import { interpolateCamera } from '@/features/editor/lib/animation';

const SNAP_PX = 10;
const TRACK_LABEL_WIDTH = 192;
const MIN_CLIP_DURATION = 0.1;

type ClipWithOptionalMediaDuration = Clip & { mediaDuration?: number };

function getClipTrackColor(clip: Clip): string {
  if (clip.type === 'background') {
    const s = clip.sceneBackground;
    if (!s || s.type === 'none') return timelineColors.background;
    if (s.type === 'solid') return s.color;
    if (s.type === 'gradient') return s.gradientFrom ?? '#6366f1';
    if (s.type === 'image') return '#3182ce';
    return timelineColors.background;
  }
  return timelineColors[clip.type];
}

/** Color por clip: misma familia por tipo pero matiz distinto según id. */
const TYPE_HUE_ANCHOR: Record<Exclude<Clip['type'], 'background'>, number> = {
  video: 203,
  audio: 258,
  text: 277,
  image: 156,
};

function hueOffsetFromId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (Math.abs(h) % 40) - 20;
}

function getClipChromeColor(clip: Clip): string {
  if (clip.type === 'background') {
    return getClipTrackColor(clip);
  }
  const anchor = TYPE_HUE_ANCHOR[clip.type] ?? 200;
  const hue = (anchor + hueOffsetFromId(clip.id) + 360) % 360;
  const sat = clip.type === 'audio' ? '58%' : clip.type === 'text' ? '56%' : '60%';
  const light = clip.type === 'text' ? '49%' : '44%';
  return `hsl(${hue} ${sat} ${light})`;
}

function formatTimelineTimecode(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const m = Math.floor(clamped / 60);
  const s = Math.floor(clamped % 60);
  const cs = Math.min(99, Math.floor((clamped % 1) * 100));
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
}

function ClipFilmstripLayer({
  clip,
  mediaFiles,
  tileCount,
}: {
  clip: Clip;
  mediaFiles: MediaFile[];
  tileCount: number;
}) {
  const asset = clip.mediaUrl ? mediaFiles.find((m) => m.url === clip.mediaUrl) : undefined;
  const bgUrl = asset?.thumbnail;
  const tiles = Math.max(2, Math.min(14, tileCount));
  return (
    <div className="absolute inset-0 flex gap-px overflow-hidden rounded-md">
      {Array.from({ length: tiles }).map((_, i) => (
        <div
          key={`${clip.id}-t-${i}`}
          className="h-full min-w-[32px] flex-1 bg-[var(--bg-tertiary)]/90"
          style={
            bgUrl
              ? {
                  backgroundImage: `url(${bgUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: `${tiles <= 1 ? 50 : (i / (tiles - 1)) * 100}% center`,
                }
              : {
                  background: `linear-gradient(115deg, hsl(${(i * 47 + clip.id.length * 7) % 360} 32% 28%), hsl(${(i * 47 + 22) % 360} 26% 20%))`,
                }
          }
        />
      ))}
    </div>
  );
}

function AudioWaveformLayer({ clipId, widthPx }: { clipId: string; widthPx: number }) {
  let seed = clipId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 7);
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const n = Math.max(16, Math.min(120, Math.floor(widthPx / 4)));
  return (
    <div className="absolute inset-0 flex items-end gap-[1px] overflow-hidden px-1 pb-1 pt-1">
      {Array.from({ length: n }).map((_, i) => {
        const h = 18 + next() * 82;
        return (
          <div
            key={`${clipId}-w-${i}`}
            className="min-w-[2px] flex-1 rounded-[1px] bg-white/30"
            style={{ height: `${h}%`, maxHeight: '100%' }}
          />
        );
      })}
    </div>
  );
}

function buildSnapPoints(
  project: Project,
  excludeClipId: string | null,
  snapConfig?: {
    snapToMarkers?: boolean;
    snapToClipEdges?: boolean;
    snapToRegions?: boolean;
  }
): number[] {
  const set = new Set<number>([0, project.duration]);
  if (snapConfig?.snapToMarkers ?? true) {
    for (const marker of project.markers ?? []) {
      set.add(marker.time);
    }
  }
  if (snapConfig?.snapToClipEdges ?? true) {
    for (const track of project.tracks) {
      for (const clip of track.clips) {
        if (excludeClipId && clip.id === excludeClipId) continue;
        set.add(clip.startTime);
        set.add(clip.startTime + clip.duration);
      }
    }
  }
  if (snapConfig?.snapToRegions ?? true) {
    for (const region of project.regions ?? []) {
      set.add(region.start);
      set.add(region.end);
    }
  }
  return [...set];
}

function snapScalar(value: number, points: number[], threshold: number): number {
  let best = value;
  let bestDist = threshold;
  for (const p of points) {
    const d = Math.abs(value - p);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

function snapClipStart(start: number, duration: number, points: number[], threshold: number): number {
  let best = start;
  let bestDist = threshold;
  const tryCand = (cand: number) => {
    if (cand < 0) return;
    const d = Math.abs(cand - start);
    if (d < bestDist) {
      bestDist = d;
      best = cand;
    }
  };
  for (const p of points) {
    tryCand(p);
    tryCand(p - duration);
  }
  return best;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isTrackEditable(track: Track | undefined): track is Track {
  return Boolean(track && !track.locked && track.visible && !track.muted);
}

export function Timeline({
  compact = false,
  onToggleCompact,
}: {
  compact?: boolean;
  onToggleCompact?: () => void;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const [draggingClip, setDraggingClip] = useState<{
    trackId: string;
    clipId: string;
    startX: number;
    originalStart: number;
  } | null>(null);
  const [trimmingClip, setTrimmingClip] = useState<{
    trackId: string;
    clipId: string;
    edge: 'start' | 'end';
    startClientX: number;
    originalStart: number;
    originalDuration: number;
    originalMediaStart: number;
  } | null>(null);
  const [snappingEnabled, setSnappingEnabled] = useState(true);
  const [showCropPanel, setShowCropPanel] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showMaskPanel, setShowMaskPanel] = useState(false);
  const [cropAspect, setCropAspect] = useState<'free' | '16:9' | '9:16' | '1:1' | '4:5'>('free');
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  const {
    project,
    currentTime,
    zoom,
    selectedClipIds,
    dispatch,
    selectedTrackId,
    playbackState,
    selectedClipId,
    mediaFiles,
  } = useEditorStore();
  const timelinePro = project?.timelinePro;
  const slipModeEnabled = Boolean(timelinePro?.slipMode);
  const slideModeEnabled = Boolean(timelinePro?.slideMode);
  const rippleEditingEnabled = Boolean(timelinePro?.rippleEdit);
  const snapConfig = useMemo(
    () => ({
      snapToMarkers: timelinePro?.snapToMarkers ?? true,
      snapToClipEdges: timelinePro?.snapToClipEdges ?? true,
      snapToRegions: timelinePro?.snapToRegions ?? true,
    }),
    [timelinePro?.snapToMarkers, timelinePro?.snapToClipEdges, timelinePro?.snapToRegions]
  );
  const sortedMarkers = useMemo(
    () => [...(project?.markers ?? [])].sort((a, b) => a.time - b.time),
    [project?.markers]
  );

  const selectedClipContext = (() => {
    if (!project || !selectedClipId) return null;
    for (const track of project.tracks) {
      const clip = track.clips.find((c) => c.id === selectedClipId);
      if (clip) return { track, clip };
    }
    return null;
  })();

  /** Escala horizontal; zoom mínimo global 25% evita pistas ilegibles. */
  const pixelsPerSecond = (zoom / 100) * 50;

  useEffect(() => {
    if (!timelineRef.current) return;
    const target = timelineRef.current;
    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      setViewportWidth(nextWidth);
    });
    observer.observe(target);
    setViewportWidth(target.clientWidth);
    return () => observer.disconnect();
  }, []);

  const resolveTimelineX = useCallback((clientX: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const xInViewport = clientX - rect.left;
    return xInViewport + timelineRef.current.scrollLeft;
  }, []);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (!timelineRef.current || isDraggingPlayhead || !project) return;

      const x = resolveTimelineX(e.clientX);
      const rawTime = Math.max(0, x / pixelsPerSecond);
      const thresholdSec = SNAP_PX / pixelsPerSecond;
      const points = buildSnapPoints(project, null, snapConfig);
      const snapped = snappingEnabled ? snapScalar(rawTime, points, thresholdSec) : rawTime;
      dispatch({ type: 'SET_CURRENT_TIME', payload: Math.min(snapped, project.duration) });
    },
    [dispatch, pixelsPerSecond, project, isDraggingPlayhead, resolveTimelineX, snappingEnabled, snapConfig]
  );

  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingPlayhead(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const thresholdSec = SNAP_PX / pixelsPerSecond;

      if (isDraggingPlayhead && timelineRef.current && project) {
        const x = resolveTimelineX(e.clientX);
        const rawTime = Math.max(0, x / pixelsPerSecond);
        const points = buildSnapPoints(project, null, snapConfig);
        const snapped = snappingEnabled ? snapScalar(rawTime, points, thresholdSec) : rawTime;
        dispatch({
          type: 'SET_CURRENT_TIME',
          payload: Math.min(snapped, project.duration),
        });
      }

      if (draggingClip && timelineRef.current && project) {
        const x = resolveTimelineX(e.clientX);
        const rawStart = Math.max(
          0,
          (x - draggingClip.startX) / pixelsPerSecond + draggingClip.originalStart
        );
        const track = project.tracks.find((t) => t.id === draggingClip.trackId);
        if (!isTrackEditable(track)) return;
        const clip = track?.clips.find((c) => c.id === draggingClip.clipId);
        if (clip) {
          const points = buildSnapPoints(project, draggingClip.clipId, snapConfig);
          const newStart = snappingEnabled
            ? snapClipStart(rawStart, clip.duration, points, thresholdSec)
            : rawStart;
          const sorted = [...track.clips].sort((a, b) => a.startTime - b.startTime);
          const currentIdx = sorted.findIndex((c) => c.id === clip.id);
          const previousClip = currentIdx > 0 ? sorted[currentIdx - 1] : null;
          const nextClip = currentIdx >= 0 ? sorted[currentIdx + 1] : null;
          const minStart = previousClip ? previousClip.startTime + previousClip.duration : 0;
          const maxStart = Math.max(
            minStart,
            Math.min(project.duration - clip.duration, nextClip ? nextClip.startTime - clip.duration : Number.POSITIVE_INFINITY)
          );
          const clampedStart = clamp(newStart, minStart, maxStart);
          if (slipModeEnabled) {
            const delta = clampedStart - draggingClip.originalStart;
            const sourceClip = clip as ClipWithOptionalMediaDuration;
            const nextMediaStart = Math.max(0, (clip.mediaStart ?? 0) + delta);
            const mediaDuration = sourceClip.mediaDuration;
            const maxMediaStart =
              typeof mediaDuration === 'number' && Number.isFinite(mediaDuration)
                ? Math.max(0, mediaDuration - clip.duration)
                : Number.POSITIVE_INFINITY;
            dispatch({
              type: 'UPDATE_CLIP',
              payload: {
                trackId: draggingClip.trackId,
                clip: { ...clip, mediaStart: Math.min(nextMediaStart, maxMediaStart) },
              },
            });
          } else if (slideModeEnabled) {
            const previousStart = clip.startTime;
            const delta = clampedStart - previousStart;
            dispatch({
              type: 'UPDATE_PROJECT',
              payload: {
                tracks: project.tracks.map((t) => {
                  if (t.id !== draggingClip.trackId) return t;
                  return {
                    ...t,
                    clips: t.clips.map((c) => {
                      if (c.id === clip.id) return { ...c, startTime: clampedStart };
                      if (nextClip && c.id === nextClip.id) {
                        const nextStart = Math.max(
                          clampedStart + clip.duration,
                          Math.min(project.duration - c.duration, c.startTime - delta)
                        );
                        return { ...c, startTime: nextStart };
                      }
                      return c;
                    }),
                  };
                }),
              },
            });
          } else if (rippleEditingEnabled) {
            const originalStart = draggingClip.originalStart;
            const originalEnd = originalStart + clip.duration;
            const delta = clampedStart - originalStart;
            dispatch({
              type: 'UPDATE_PROJECT',
              payload: {
                tracks: project.tracks.map((t) => {
                  if (t.id !== draggingClip.trackId) return t;
                  return {
                    ...t,
                    clips: t.clips.map((c) => {
                      if (c.id === clip.id) return { ...c, startTime: clampedStart };
                      if (c.startTime >= originalEnd) {
                        return { ...c, startTime: Math.max(0, c.startTime + delta) };
                      }
                      return c;
                    }),
                  };
                }),
              },
            });
          } else {
            dispatch({
              type: 'UPDATE_CLIP',
              payload: {
                trackId: draggingClip.trackId,
                clip: { ...clip, startTime: clampedStart },
              },
            });
          }
        }
      }

      if (trimmingClip && timelineRef.current && project) {
        const deltaSeconds = (e.clientX - trimmingClip.startClientX) / pixelsPerSecond;
        const track = project.tracks.find((t) => t.id === trimmingClip.trackId);
        if (!isTrackEditable(track)) return;
        const clip = track?.clips.find((c) => c.id === trimmingClip.clipId);
        if (!clip) return;
          const points = buildSnapPoints(project, trimmingClip.clipId, snapConfig);

        if (trimmingClip.edge === 'end') {
          const rawEnd = trimmingClip.originalStart + trimmingClip.originalDuration + deltaSeconds;
          const snappedEnd = snappingEnabled ? snapScalar(rawEnd, points, thresholdSec) : rawEnd;
          const sorted = [...track.clips].sort((a, b) => a.startTime - b.startTime);
          const currentIdx = sorted.findIndex((c) => c.id === clip.id);
          const nextClip = currentIdx >= 0 ? sorted[currentIdx + 1] : null;
          const maxEnd = nextClip ? nextClip.startTime : project.duration;
          const nextDuration = Math.max(MIN_CLIP_DURATION, Math.min(maxEnd - clip.startTime, snappedEnd - clip.startTime));
          if (rippleEditingEnabled) {
            const originalEnd = trimmingClip.originalStart + trimmingClip.originalDuration;
            const delta = nextDuration - trimmingClip.originalDuration;
            dispatch({
              type: 'UPDATE_PROJECT',
              payload: {
                tracks: project.tracks.map((t) => {
                  if (t.id !== trimmingClip.trackId) return t;
                  return {
                    ...t,
                    clips: t.clips.map((c) => {
                      if (c.id === clip.id) return { ...c, duration: nextDuration };
                      if (c.startTime >= originalEnd) {
                        return { ...c, startTime: Math.max(0, c.startTime + delta) };
                      }
                      return c;
                    }),
                  };
                }),
              },
            });
          } else {
            dispatch({
              type: 'UPDATE_CLIP',
              payload: {
                trackId: trimmingClip.trackId,
                clip: { ...clip, duration: nextDuration },
              },
            });
          }
          return;
        }

        const proposedStart = trimmingClip.originalStart + deltaSeconds;
        const sorted = [...track.clips].sort((a, b) => a.startTime - b.startTime);
        const currentIdx = sorted.findIndex((c) => c.id === clip.id);
        const previousClip = currentIdx > 0 ? sorted[currentIdx - 1] : null;
        const minTrimStart = previousClip ? previousClip.startTime + previousClip.duration : 0;
        const safeStart = Math.max(minTrimStart, proposedStart);
        const snappedStart = snappingEnabled ? snapScalar(safeStart, points, thresholdSec) : safeStart;
        const deltaStart = snappedStart - trimmingClip.originalStart;
        const nextDuration = Math.max(MIN_CLIP_DURATION, trimmingClip.originalDuration - deltaStart);
        const adjustedStart = trimmingClip.originalStart + (trimmingClip.originalDuration - nextDuration);
        const trimDelta = adjustedStart - trimmingClip.originalStart;
        const usesMedia =
          clip.type === 'video' || clip.type === 'audio' || clip.type === 'image';
        const nextMediaStart = usesMedia
          ? Math.max(0, trimmingClip.originalMediaStart + trimDelta)
          : clip.mediaStart;

        dispatch({
          type: 'UPDATE_CLIP',
          payload: {
            trackId: trimmingClip.trackId,
            clip: {
              ...clip,
              startTime: adjustedStart,
              duration: nextDuration,
              ...(usesMedia ? { mediaStart: nextMediaStart } : {}),
            },
          },
        });
      }
    },
    [
      isDraggingPlayhead,
      draggingClip,
      trimmingClip,
      pixelsPerSecond,
      dispatch,
      project,
      resolveTimelineX,
      snappingEnabled,
      rippleEditingEnabled,
      slipModeEnabled,
      slideModeEnabled,
      snapConfig,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDraggingPlayhead(false);
    setDraggingClip(null);
    setTrimmingClip(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (!showToolsDropdown) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !toolsMenuRef.current) return;
      if (!toolsMenuRef.current.contains(target)) {
        setShowToolsDropdown(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [showToolsDropdown]);

  const handleClipClick = (e: React.MouseEvent, trackId: string, clipId: string) => {
    e.stopPropagation();
    const isMultiModifier = e.metaKey || e.ctrlKey;

    if (isMultiModifier) {
      const current = selectedClipIds || [];
      const exists = current.includes(clipId);
      const next = exists ? current.filter((id) => id !== clipId) : [...current, clipId];
      dispatch({ type: 'SET_SELECTED_CLIP_IDS', payload: next });
      return;
    }

    dispatch({ type: 'SET_SELECTED_CLIP', payload: clipId });
  };

  const handleClipDragStart = (e: React.MouseEvent, track: Track, clip: Clip) => {
    if (!isTrackEditable(track)) return;
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDraggingClip({
      trackId: track.id,
      clipId: clip.id,
      startX: e.clientX - rect.left,
      originalStart: clip.startTime,
    });
  };

  const handleTrimStart = (
    e: React.MouseEvent,
    track: Track,
    clip: Clip,
    edge: 'start' | 'end'
  ) => {
    if (!isTrackEditable(track)) return;
    e.stopPropagation();
    setTrimmingClip({
      trackId: track.id,
      clipId: clip.id,
      edge,
      startClientX: e.clientX,
      originalStart: clip.startTime,
      originalDuration: clip.duration,
      originalMediaStart: clip.mediaStart ?? 0,
    });
  };

  const handleZoomChange = (value: number) => {
    dispatch({ type: 'SET_ZOOM', payload: value });
  };

  const deleteSelectedClips = useCallback(() => {
    const st = useEditorStore.getState();
    if (!st.project) return;
    const ids =
      st.selectedClipIds.length > 0
        ? [...st.selectedClipIds]
        : st.selectedClipId
          ? [st.selectedClipId]
          : [];
    if (ids.length === 0) return;
    const selectedSet = new Set(ids);
    if (rippleEditingEnabled) {
      st.dispatch({
        type: 'UPDATE_PROJECT',
        payload: {
          tracks: st.project.tracks.map((track) => {
            if (!isTrackEditable(track)) return track;
            const selectedClips = track.clips
              .filter((clip) => selectedSet.has(clip.id))
              .sort((a, b) => a.startTime - b.startTime);
            if (selectedClips.length === 0) return track;

            const deleteWindowStart = selectedClips[0].startTime;
            const deleteWindowEnd = Math.max(...selectedClips.map((c) => c.startTime + c.duration));
            const rippleDelta = deleteWindowEnd - deleteWindowStart;

            return {
              ...track,
              clips: track.clips
                .filter((clip) => !selectedSet.has(clip.id))
                .map((clip) =>
                  clip.startTime >= deleteWindowEnd
                    ? { ...clip, startTime: Math.max(0, clip.startTime - rippleDelta) }
                    : clip
                ),
            };
          }),
        },
      });
    } else {
      for (const clipId of ids) {
        const tr = st.project.tracks.find((t) => t.clips.some((c) => c.id === clipId));
        if (!isTrackEditable(tr)) continue;
        st.dispatch({ type: 'REMOVE_CLIP', payload: { trackId: tr.id, clipId } });
      }
    }
    st.dispatch({ type: 'SET_SELECTED_CLIP_IDS', payload: [] });
    st.dispatch({ type: 'SET_SELECTED_CLIP', payload: null });
  }, [rippleEditingEnabled]);

  const toggleMuteTargetTrack = useCallback(() => {
    const st = useEditorStore.getState();
    if (!st.project) return;
    let tid = st.selectedTrackId;
    if (!tid) {
      const atPlayhead = st.project.tracks.find((t) =>
        t.clips.some(
          (c) =>
            c.type === 'audio' &&
            st.currentTime >= c.startTime &&
            st.currentTime < c.startTime + c.duration
        )
      );
      tid = atPlayhead?.id ?? st.project.tracks.find((t) => t.type === 'audio')?.id ?? null;
    }
    if (!tid) return;
    st.dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        tracks: st.project.tracks.map((t) =>
          t.id === tid ? { ...t, muted: !t.muted } : t
        ),
      },
    });
  }, []);

  const nudgeFrame = useCallback(
    (dir: -1 | 1) => {
      if (!project) return;
      const fps = project.fps || 30;
      const dt = dir / fps;
      dispatch({
        type: 'SET_CURRENT_TIME',
        payload: Math.max(0, Math.min(project.duration, currentTime + dt)),
      });
    },
    [project, currentTime, dispatch]
  );

  const togglePlayback = useCallback(() => {
    dispatch({
      type: 'SET_PLAYBACK_STATE',
      payload: playbackState === 'playing' ? 'paused' : 'playing',
    });
  }, [dispatch, playbackState]);

  const zoomByStep = useCallback(
    (dir: -1 | 1) => {
      dispatch({ type: 'SET_ZOOM', payload: Math.max(25, Math.min(400, zoom + dir * 25)) });
    },
    [dispatch, zoom]
  );

  const timelineDurationSec = useMemo(() => {
    if (!project) return 0;
    const clipEnds = project.tracks.flatMap((track) => track.clips.map((clip) => clip.startTime + clip.duration));
    const maxClipEnd = clipEnds.length > 0 ? Math.max(...clipEnds) : 0;
    const baseDuration = clipEnds.length > 0 ? maxClipEnd : project.duration;
    const frame = project.fps > 0 ? 1 / project.fps : 0.001;
    // Alinea al frame para mantener lectura exacta en la regla.
    return Math.ceil(baseDuration / frame) * frame;
  }, [project]);

  const tickStepSec = useMemo(() => {
    const targetPxPerTick = 78;
    const targetSec = targetPxPerTick / Math.max(1, pixelsPerSecond);
    const steps = [
      0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600,
    ];
    return steps.find((s) => s >= targetSec) ?? 3600;
  }, [pixelsPerSecond]);

  const majorTickStepSec = useMemo(() => {
    if (tickStepSec < 1) return tickStepSec * 5;
    if (tickStepSec < 10) return tickStepSec * 5;
    if (tickStepSec < 60) return tickStepSec * 3;
    return tickStepSec * 2;
  }, [tickStepSec]);

  const rulerTicks = useMemo(() => {
    if (!project) return [] as Array<{ sec: number; isMajor: boolean }>;
    const safeDuration = Math.max(0.01, timelineDurationSec);
    const n = Math.max(1, Math.ceil(safeDuration / tickStepSec) + 1);
    const ticks: Array<{ sec: number; isMajor: boolean }> = [];
    for (let i = 0; i < n; i++) {
      const rawSec = Math.min(safeDuration, i * tickStepSec);
      const sec = Number(rawSec.toFixed(4));
      const majorRatio = sec / majorTickStepSec;
      const isMajor =
        i === 0 ||
        Math.abs(majorRatio - Math.round(majorRatio)) < 1e-3 ||
        Math.abs(sec - safeDuration) < 1e-3;
      ticks.push({ sec, isMajor });
    }
    return ticks;
  }, [project, tickStepSec, majorTickStepSec, timelineDurationSec]);

  const handleSplitAtPlayhead = useCallback(() => {
    dispatch({ type: 'SPLIT_AT_PLAYHEAD', payload: { time: currentTime } });
  }, [dispatch, currentTime]);

  const addMarkerAtPlayhead = useCallback(() => {
    if (!project) return;
    const safeTime = Math.max(0, Math.min(project.duration, currentTime));
    const markerCount = project.markers?.length ?? 0;
    const marker: TimelineMarker = {
      id: generateId(),
      time: safeTime,
      label: `Marker ${markerCount + 1}`,
    };
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        markers: [...(project.markers ?? []), marker].sort((a, b) => a.time - b.time),
      },
    });
  }, [project, currentTime, dispatch]);

  const addClipMarkerAtPlayhead = useCallback(() => {
    if (!project || !selectedClipContext) return;
    const safeTime = Math.max(
      selectedClipContext.clip.startTime,
      Math.min(
        selectedClipContext.clip.startTime + selectedClipContext.clip.duration,
        currentTime
      )
    );
    const markerCount = project.markers?.length ?? 0;
    const marker: TimelineMarker = {
      id: generateId(),
      time: safeTime,
      label: `Clip M${markerCount + 1}`,
      color: '#38bdf8',
      clipId: selectedClipContext.clip.id,
    };
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        markers: [...(project.markers ?? []), marker].sort((a, b) => a.time - b.time),
      },
    });
  }, [project, selectedClipContext, currentTime, dispatch]);

  const addRegionFromSelectedClip = useCallback(() => {
    if (!project || !selectedClipContext) return;
    const clip = selectedClipContext.clip;
    const regionCount = project.regions?.length ?? 0;
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        regions: [
          ...(project.regions ?? []),
          {
            id: generateId(),
            start: clip.startTime,
            end: clip.startTime + clip.duration,
            label: `Region ${regionCount + 1}`,
            color: '#a78bfa',
          },
        ],
      },
    });
  }, [project, selectedClipContext, dispatch]);

  const goToAdjacentMarker = useCallback(
    (direction: 'prev' | 'next') => {
      if (!project || sortedMarkers.length === 0) return;
      const epsilon = 1e-4;
      if (direction === 'next') {
        const next = sortedMarkers.find((marker) => marker.time > currentTime + epsilon) ?? sortedMarkers[0];
        dispatch({ type: 'SET_CURRENT_TIME', payload: next.time });
        return;
      }
      const previous = [...sortedMarkers].reverse().find((marker) => marker.time < currentTime - epsilon);
      const target = previous ?? sortedMarkers[sortedMarkers.length - 1];
      dispatch({ type: 'SET_CURRENT_TIME', payload: target.time });
    },
    [project, sortedMarkers, currentTime, dispatch]
  );

  const removeMarkerNearPlayhead = useCallback(() => {
    if (!project || sortedMarkers.length === 0) return;
    const threshold = Math.max(0.12, SNAP_PX / pixelsPerSecond);
    const hit = sortedMarkers.reduce<{ marker: TimelineMarker | null; distance: number }>(
      (best, marker) => {
        const distance = Math.abs(marker.time - currentTime);
        if (distance < best.distance) {
          return { marker, distance };
        }
        return best;
      },
      { marker: null, distance: Number.POSITIVE_INFINITY }
    );
    if (!hit.marker || hit.distance > threshold) return;
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        markers: sortedMarkers.filter((marker) => marker.id !== hit.marker?.id),
      },
    });
  }, [project, sortedMarkers, currentTime, pixelsPerSecond, dispatch]);

  const duplicateSelectedClips = useCallback(() => {
    const st = useEditorStore.getState();
    if (!st.project) return;
    const ids =
      st.selectedClipIds.length > 0
        ? [...st.selectedClipIds]
        : st.selectedClipId
          ? [st.selectedClipId]
          : [];
    if (ids.length === 0) return;

    const head = st.currentTime;
    for (const clipId of ids) {
      const tr = st.project.tracks.find((t) => t.clips.some((c) => c.id === clipId));
      const src = tr?.clips.find((c) => c.id === clipId);
      if (!tr || !src) continue;
      const copy: Clip = {
        ...src,
        id: generateId(),
        startTime: Math.min(Math.max(0, head), Math.max(0, st.project.duration - src.duration)),
      };
      st.dispatch({ type: 'ADD_CLIP', payload: { trackId: tr.id, clip: copy } });
      st.dispatch({ type: 'SET_SELECTED_CLIP', payload: copy.id });
    }
  }, []);

  const toggleSnapping = useCallback(() => {
    setSnappingEnabled((prev) => !prev);
  }, []);

  const toggleRippleEditing = useCallback(() => {
    const next = !rippleEditingEnabled;
    if (!project) return;
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        timelinePro: {
          ...(project.timelinePro ?? {
            rippleEdit: true,
            slipMode: false,
            slideMode: false,
            snapStrength: 0.8,
            trackTargeting: { video: true, audio: true, text: true },
            snapToMarkers: true,
            snapToClipEdges: true,
            snapToRegions: true,
          }),
          rippleEdit: next,
        },
      },
    });
  }, [dispatch, project, rippleEditingEnabled]);

  const handleAddTrack = (type: Track['type'], event?: React.MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();

    const { project: liveProject, currentTime: t, dispatch: d, mediaFiles, selectedTrackId: selTrack } =
      useEditorStore.getState();
    if (!liveProject) return;

    if (type === 'background') {
      const existing = liveProject.tracks.find((tr) => tr.type === 'background');
      if (existing) {
        d({ type: 'SET_SELECTED_TRACK', payload: existing.id });
        const first = existing.clips[0];
        if (first) d({ type: 'SET_SELECTED_CLIP', payload: first.id });
        return;
      }
      const track = createTrack('Background', 'background');
      const clip = createBackgroundClip(
        track.id,
        0,
        liveProject.duration,
        liveProject.background ?? defaultProjectBackground()
      );
      d({ type: 'ADD_TRACK', payload: { ...track, clips: [clip] } });
      d({ type: 'SET_SELECTED_TRACK', payload: track.id });
      d({ type: 'SET_SELECTED_CLIP', payload: clip.id });
      return;
    }

    const head = Math.max(0, Math.min(t, Math.max(0, liveProject.duration - 0.25)));
    const room = Math.max(0, liveProject.duration - head);
    const dur = Math.max(1, Math.min(8, room > 0 ? Math.min(8, room) : 4));

    const selectedTrack = selTrack
      ? liveProject.tracks.find((tr) => tr.id === selTrack)
      : null;
    const targetTrack =
      selectedTrack && selectedTrack.type === type && !selectedTrack.locked
        ? selectedTrack
        : liveProject.tracks.find((tr) => tr.type === type && !tr.locked) ?? null;

    let clipToSelect: string | null = null;
    let trackIdForClip: string;

    if (targetTrack) {
      trackIdForClip = targetTrack.id;
    } else {
      const sameTypeCount = liveProject.tracks.filter((tr) => tr.type === type).length;
      const track = createTrack(
        `${type.charAt(0).toUpperCase() + type.slice(1)} ${sameTypeCount + 1}`,
        type
      );
      d({ type: 'ADD_TRACK', payload: track });
      trackIdForClip = track.id;
    }

    if (type === 'text') {
      const clip = createClip(trackIdForClip, 'text', 'Texto', head, dur);
      clip.text = 'Tu texto';
      clip.fontSize = 42;
      clip.fontFamily = 'Inter';
      clip.color = '#ffffff';
      d({ type: 'ADD_CLIP', payload: { trackId: trackIdForClip, clip } });
      clipToSelect = clip.id;
    } else if (type === 'video') {
      const clip = createClip(trackIdForClip, 'video', 'Vídeo', head, dur);
      const first = mediaFiles.find((f) => f.type?.startsWith('video'));
      if (first?.url) {
        clip.mediaUrl = first.url;
        clip.mediaType = first.type;
        clip.name = first.name.length > 28 ? `${first.name.slice(0, 25)}…` : first.name;
      }
      d({ type: 'ADD_CLIP', payload: { trackId: trackIdForClip, clip } });
      clipToSelect = clip.id;
    } else if (type === 'audio') {
      const clip = createClip(trackIdForClip, 'audio', 'Audio', head, dur);
      const first = mediaFiles.find((f) => f.type?.startsWith('audio'));
      if (first?.url) {
        clip.mediaUrl = first.url;
        clip.mediaType = first.type;
        clip.name = first.name.length > 28 ? `${first.name.slice(0, 25)}…` : first.name;
      }
      d({ type: 'ADD_CLIP', payload: { trackId: trackIdForClip, clip } });
      clipToSelect = clip.id;
    }

    d({ type: 'SET_SELECTED_TRACK', payload: trackIdForClip });
    if (clipToSelect) {
      d({ type: 'SET_SELECTED_CLIP', payload: clipToSelect });
    }
  };

  const toggleTrackVisible = (trackId: string) => {
    if (!project) return;
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        tracks: project.tracks.map((t) =>
          t.id === trackId ? { ...t, visible: !t.visible } : t
        ),
      },
    });
  };

  const toggleTrackLocked = (trackId: string) => {
    if (!project) return;
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        tracks: project.tracks.map((t) =>
          t.id === trackId ? { ...t, locked: !t.locked } : t
        ),
      },
    });
  };

  const handleAddCameraKeyframe = (event?: React.MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();

    const { project: liveProject, currentTime: t, dispatch: d } = useEditorStore.getState();
    if (!liveProject) return;

    const camera = liveProject.camera ?? {
      keyframes: [],
      defaultZoom: 1,
      defaultTiltX: 0,
      defaultTiltY: 0,
    };
    const { zoom: z, tiltX, tiltY } = interpolateCamera(camera, t);
    const nextKeyframe = {
      id: generateId(),
      time: t,
      zoom: z,
      tiltX,
      tiltY,
    };
    const withoutNear = camera.keyframes.filter((k) => Math.abs(k.time - t) > 0.04);
    d({
      type: 'UPDATE_PROJECT',
      payload: {
        camera: {
          ...camera,
          keyframes: [...withoutNear, nextKeyframe].sort((a, b) => a.time - b.time),
        },
      },
    });
  };

  const addQuickTitleClip = useCallback(
    (kind: 'intro' | 'outro') => {
      const st = useEditorStore.getState();
      const liveProject = st.project;
      if (!liveProject) return;

      let track = liveProject.tracks.find((t) => t.type === 'text');
      if (!track) {
        const sameTypeCount = liveProject.tracks.filter((tr) => tr.type === 'text').length;
        track = createTrack(`Texto ${sameTypeCount + 1}`, 'text');
        st.dispatch({ type: 'ADD_TRACK', payload: track });
      }
      if (!track) return;

      const defaultDuration = Math.min(3, Math.max(1.5, liveProject.duration * 0.12));
      const startTime =
        kind === 'intro'
          ? 0
          : Math.max(0, Math.min(liveProject.duration - defaultDuration, liveProject.duration - 0.1));

      const clip = createClip(
        track.id,
        'text',
        kind === 'intro' ? 'Introducción' : 'Cierre',
        startTime,
        defaultDuration
      );
      clip.text = kind === 'intro' ? 'Introducción' : 'Gracias por ver';
      clip.fontSize = 56;
      clip.fontFamily = 'Inter';
      clip.color = '#ffffff';

      st.dispatch({ type: 'ADD_CLIP', payload: { trackId: track.id, clip } });
      st.dispatch({ type: 'SET_SELECTED_TRACK', payload: track.id });
      st.dispatch({ type: 'SET_SELECTED_CLIP', payload: clip.id });
      st.dispatch({ type: 'SET_CURRENT_TIME', payload: clip.startTime });
    },
    []
  );

  const buildAspectCrop = useCallback(
    (aspect: 'free' | '16:9' | '9:16' | '1:1' | '4:5'): MediaCropRect => {
      if (aspect === 'free') return { ...DEFAULT_MEDIA_CROP };
      const [wRaw, hRaw] = aspect.split(':').map(Number);
      const ratio = wRaw / hRaw;
      if (!Number.isFinite(ratio) || ratio <= 0) return { ...DEFAULT_MEDIA_CROP };
      const baseW = 1;
      const baseH = 1;
      let width = baseW;
      let height = baseW / ratio;
      if (height > 1) {
        height = baseH;
        width = baseH * ratio;
      }
      const x = (1 - width) / 2;
      const y = (1 - height) / 2;
      return { x, y, width, height };
    },
    []
  );

  const openCropInCanvas = useCallback(() => {
    const st = useEditorStore.getState();
    const p = st.project;
    const clipId = st.selectedClipId;
    if (!p || !clipId) return;
    const hit = p.tracks
      .flatMap((track) => track.clips.map((clip) => ({ track, clip })))
      .find((entry) => entry.clip.id === clipId);
    if (!hit) return;
    if (!['video', 'image'].includes(hit.clip.type)) return;
    st.dispatch({ type: 'SET_CURRENT_TIME', payload: hit.clip.startTime + 0.01 });
    window.dispatchEvent(
      new CustomEvent('opencut:set-canvas-edit-mode', {
        detail: { mode: 'crop' },
      })
    );
  }, []);

  const applyCropToSelectedClip = useCallback(() => {
    if (!selectedClipContext) return;
    const { track, clip } = selectedClipContext;
    if (!['video', 'image'].includes(clip.type)) return;
    dispatch({
      type: 'UPDATE_CLIP',
      payload: {
        trackId: track.id,
        clip: {
          ...clip,
          mediaCrop: buildAspectCrop(cropAspect),
        },
      },
    });
    openCropInCanvas();
    setShowCropPanel(false);
  }, [selectedClipContext, dispatch, buildAspectCrop, cropAspect, openCropInCanvas]);

  const resetCropToDefault = useCallback(() => {
    if (!selectedClipContext) return;
    const { track, clip } = selectedClipContext;
    dispatch({
      type: 'UPDATE_CLIP',
      payload: {
        trackId: track.id,
        clip: {
          ...clip,
          mediaCrop: { ...DEFAULT_MEDIA_CROP },
        },
      },
    });
    openCropInCanvas();
  }, [selectedClipContext, dispatch, openCropInCanvas]);

  const updateMaskEdge = useCallback(
    (edge: 'top' | 'right' | 'bottom' | 'left', value: number) => {
      if (!selectedClipContext) return;
      const { track, clip } = selectedClipContext;
      if (!['video', 'image'].includes(clip.type)) return;
      const next = Math.max(0, Math.min(0.9, value));
      const current = clip.mediaMask ?? { top: 0, right: 0, bottom: 0, left: 0 };
      dispatch({
        type: 'UPDATE_CLIP',
        payload: {
          trackId: track.id,
          clip: {
            ...clip,
            mediaMask: { ...current, [edge]: next },
          },
        },
      });
    },
    [selectedClipContext, dispatch]
  );

  const moveSelectedClipLayer = useCallback(
    (direction: 'up' | 'down') => {
      if (!selectedClipContext || !project) return;
      const { track, clip } = selectedClipContext;
      const idx = track.clips.findIndex((c) => c.id === clip.id);
      if (idx < 0) return;
      const nextIndex =
        direction === 'up' ? Math.min(track.clips.length - 1, idx + 1) : Math.max(0, idx - 1);
      if (nextIndex === idx) return;
      const nextClips = track.clips.slice();
      const [moved] = nextClips.splice(idx, 1);
      nextClips.splice(nextIndex, 0, moved);
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: {
          tracks: project.tracks.map((t) => (t.id === track.id ? { ...t, clips: nextClips } : t)),
        },
      });
    },
    [selectedClipContext, project, dispatch]
  );

  const totalWidth = timelineDurationSec * pixelsPerSecond;
  const contentWidth = Math.max(totalWidth, viewportWidth);
  const contentMinHeight = 36 + (project?.tracks.length ?? 0) * 56;
  const isZoomMin = zoom <= 25;
  const isZoomMax = zoom >= 400;

  const formatRulerLabel = (sec: number) => {
    if (tickStepSec < 1) {
      return formatTimelineTimecode(sec);
    }
    const whole = Math.max(0, Math.floor(sec));
    const h = Math.floor(whole / 3600);
    const m = Math.floor((whole % 3600) / 60);
    const s = whole % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const muteTargetMuted = useMemo(() => {
    if (!project) return false;
    let tid = selectedTrackId;
    if (!tid) {
      const atPlayhead = project.tracks.find((t) =>
        t.clips.some(
          (c) =>
            c.type === 'audio' &&
            currentTime >= c.startTime &&
            currentTime < c.startTime + c.duration
        )
      );
      tid = atPlayhead?.id ?? project.tracks.find((t) => t.type === 'audio')?.id ?? null;
    }
    const tr = tid ? project.tracks.find((t) => t.id === tid) : null;
    return tr?.muted ?? false;
  }, [project, selectedTrackId, currentTime]);

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.target as HTMLElement | null)?.closest('[contenteditable="true"]')) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayback();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          nudgeFrame(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          nudgeFrame(1);
          break;
        case 'KeyT':
          e.preventDefault();
          onToggleCompact?.();
          break;
        case 'KeyM':
          if (e.shiftKey) {
            e.preventDefault();
            addMarkerAtPlayhead();
            break;
          }
          e.preventDefault();
          toggleMuteTargetTrack();
          break;
        case 'Equal':
        case 'NumpadAdd':
          e.preventDefault();
          zoomByStep(1);
          break;
        case 'Minus':
        case 'NumpadSubtract':
          e.preventDefault();
          zoomByStep(-1);
          break;
        case 'KeyI':
          e.preventDefault();
          addQuickTitleClip('intro');
          break;
        case 'KeyO':
          e.preventDefault();
          addQuickTitleClip('outro');
          break;
        case 'KeyK':
          e.preventDefault();
          dispatch({ type: 'SET_PLAYBACK_STATE', payload: 'stopped' });
          dispatch({ type: 'SET_CURRENT_TIME', payload: 0 });
          break;
        case 'KeyS':
          e.preventDefault();
          handleSplitAtPlayhead();
          break;
        case 'KeyR':
          e.preventDefault();
          duplicateSelectedClips();
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          deleteSelectedClips();
          break;
        case 'KeyN':
          e.preventDefault();
          toggleSnapping();
          break;
        case 'KeyE':
          e.preventDefault();
          toggleRippleEditing();
          break;
      }
    };
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [
    addQuickTitleClip,
    addMarkerAtPlayhead,
    deleteSelectedClips,
    dispatch,
    duplicateSelectedClips,
    handleSplitAtPlayhead,
    nudgeFrame,
    onToggleCompact,
    togglePlayback,
    toggleMuteTargetTrack,
    toggleRippleEditing,
    toggleSnapping,
    zoomByStep,
  ]);

  if (!project) return null;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-transparent text-[var(--text-primary)]">
      <div
        className="flex shrink-0 flex-col border-b border-[var(--border-default)] bg-gradient-to-b from-[#0f1522] to-[#0c111c]"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[#1a2438]/80"
              title="Ocultar/mostrar línea de tiempo (T)"
              onClick={() => onToggleCompact?.()}
            >
              {compact ? (
                <icons.chevronUp size={14} className="text-[var(--text-muted)]" />
              ) : (
                <icons.chevronDown size={14} className="text-[var(--text-muted)]" />
              )}
            </button>
            <div className="mx-1 h-5 w-px bg-[var(--border-default)]" />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[var(--text-secondary)] hover:bg-[#1a2438]/80"
              title="Dividir en el cabezal (S)"
              onClick={(e) => {
                e.stopPropagation();
                handleSplitAtPlayhead();
              }}
            >
              <icons.cut size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[var(--text-secondary)] hover:bg-[#1a2438]/80"
              title="Duplicar clips seleccionados (R)"
              onClick={(e) => {
                e.stopPropagation();
                duplicateSelectedClips();
              }}
            >
              <icons.copy size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[var(--text-secondary)] hover:bg-[#1a2438]/80"
              title="Eliminar clips seleccionados (Supr / Retroceso)"
              onClick={(e) => {
                e.stopPropagation();
                deleteSelectedClips();
              }}
            >
              <icons.trash size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2 hover:bg-[#1a2438]/80',
                muteTargetMuted ? 'text-amber-400/90' : 'text-[var(--text-secondary)]'
              )}
              title="Silenciar / activar pista de audio (seleccionada o bajo el cabezal)"
              onClick={(e) => {
                e.stopPropagation();
                toggleMuteTargetTrack();
              }}
            >
              {muteTargetMuted ? <icons.volumeMute size={16} /> : <icons.volume size={16} />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[var(--text-secondary)] hover:bg-[#1a2438]/80"
              title="Agregar marcador en cabezal (Shift+M)"
              onClick={(e) => {
                e.stopPropagation();
                addMarkerAtPlayhead();
              }}
            >
              <icons.flag size={14} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[var(--text-secondary)] hover:bg-[#1a2438]/80"
              title="Agregar marcador de clip en cabezal"
              disabled={!selectedClipContext}
              onClick={(e) => {
                e.stopPropagation();
                addClipMarkerAtPlayhead();
              }}
            >
              <icons.flag size={14} />
              <icons.layers size={12} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[var(--text-secondary)] hover:bg-[#1a2438]/80"
              title="Crear región desde clip seleccionado"
              disabled={!selectedClipContext}
              onClick={(e) => {
                e.stopPropagation();
                addRegionFromSelectedClip();
              }}
            >
              <icons.maximize size={14} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[var(--text-secondary)] hover:bg-[#1a2438]/80"
              title="Ir al marcador anterior"
              onClick={(e) => {
                e.stopPropagation();
                goToAdjacentMarker('prev');
              }}
            >
              <icons.skipBack size={14} />
              <icons.flag size={12} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[var(--text-secondary)] hover:bg-[#1a2438]/80"
              title="Ir al marcador siguiente"
              onClick={(e) => {
                e.stopPropagation();
                goToAdjacentMarker('next');
              }}
            >
              <icons.flag size={12} />
              <icons.skipForward size={14} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[var(--text-secondary)] hover:bg-[#1a2438]/80"
              title="Eliminar marcador cercano al cabezal"
              onClick={(e) => {
                e.stopPropagation();
                removeMarkerNearPlayhead();
              }}
            >
              <icons.trash size={14} />
              <icons.flag size={12} />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:bg-[#1a2438]/80"
              title="Fotograma anterior (←)"
              onClick={(e) => {
                e.stopPropagation();
                nudgeFrame(-1);
              }}
            >
              <icons.skipBack size={16} />
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="h-9 w-9 rounded-full p-0 shadow-md"
              title={playbackState === 'playing' ? 'Pausa' : 'Reproducir'}
              onClick={(e) => {
                e.stopPropagation();
                togglePlayback();
              }}
            >
              {playbackState === 'playing' ? (
                <icons.pause size={18} className="text-white" />
              ) : (
                <icons.play size={18} className="ml-0.5 text-white" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:bg-[#1a2438]/80"
              title="Detener (K)"
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'SET_PLAYBACK_STATE', payload: 'stopped' });
                dispatch({ type: 'SET_CURRENT_TIME', payload: 0 });
              }}
            >
              <icons.stop size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:bg-[#1a2438]/80"
              title="Fotograma siguiente (→)"
              onClick={(e) => {
                e.stopPropagation();
                nudgeFrame(1);
              }}
            >
              <icons.skipForward size={16} />
            </Button>
            <div className="ml-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-1 font-mono text-[11px] tabular-nums text-[var(--text-primary)]">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1.5 text-[var(--text-muted)]">/</span>
              <span className="text-[var(--text-secondary)]">{formatTime(project.duration)}</span>
            </div>
          </div>

          <div className="ml-auto flex items-center justify-end gap-1">
            <div className="relative" ref={toolsMenuRef}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 px-2',
                  snappingEnabled || rippleEditingEnabled || showCropPanel || showLayersPanel
                    ? 'text-sky-300 bg-[#16243b]'
                    : 'text-[var(--text-secondary)]'
                )}
                title="Herramientas de timeline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowToolsDropdown((prev) => !prev);
                }}
              >
                <icons.workflow size={14} />
                <icons.chevronDown size={12} className="ml-1" />
              </Button>
              {showToolsDropdown && (
                <div className="absolute bottom-9 right-0 z-dropdown min-w-[190px] rounded-lg border border-[#2a3348] bg-[#0f1522] p-1.5 shadow-xl">
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-[#17233a]',
                      snappingEnabled ? 'text-sky-300' : 'text-[var(--text-secondary)]'
                    )}
                    onClick={() => toggleSnapping()}
                  >
                    <icons.magnet size={14} />
                    Snap
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-[#17233a]',
                      rippleEditingEnabled ? 'text-emerald-300' : 'text-[var(--text-secondary)]'
                    )}
                    onClick={() => toggleRippleEditing()}
                  >
                    <icons.waveform size={14} />
                    Ripple
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-[#17233a]',
                      showCropPanel ? 'text-sky-300' : 'text-[var(--text-secondary)]'
                    )}
                    onClick={() => {
                      setShowCropPanel((prev) => !prev);
                      setShowLayersPanel(false);
                      setShowMaskPanel(false);
                      openCropInCanvas();
                    }}
                  >
                    <icons.crop size={14} />
                    Crop
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-[#17233a]',
                      showLayersPanel ? 'text-sky-300' : 'text-[var(--text-secondary)]'
                    )}
                    onClick={() => {
                      setShowLayersPanel((prev) => !prev);
                      setShowCropPanel(false);
                      setShowMaskPanel(false);
                    }}
                  >
                    <icons.layers size={14} />
                    Layers
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-[#17233a]',
                      showMaskPanel ? 'text-sky-300' : 'text-[var(--text-secondary)]'
                    )}
                    onClick={() => {
                      setShowMaskPanel((prev) => !prev);
                      setShowCropPanel(false);
                      setShowLayersPanel(false);
                    }}
                  >
                    <icons.maximize size={14} />
                    Mask
                  </button>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:bg-[#1a2438]/80"
              title="Alejar zoom (-)"
              disabled={isZoomMin}
              onClick={(e) => {
                e.stopPropagation();
                zoomByStep(-1);
              }}
            >
              <icons.zoomOut size={16} />
            </Button>
            <div className="w-32 min-w-[6rem]">
              <Slider
                value={zoom}
                min={25}
                max={400}
                step={5}
                onChange={handleZoomChange}
                showValue={false}
                className="[&_input]:accent-[var(--accent-primary)]"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-[var(--text-secondary)] hover:bg-[#1a2438]/80"
              title="Acercar zoom (+)"
              disabled={isZoomMax}
              onClick={(e) => {
                e.stopPropagation();
                zoomByStep(1);
              }}
            >
              <icons.zoomIn size={16} />
            </Button>
          </div>
        </div>

        {!compact && (
          <div className="flex items-center gap-1 overflow-x-auto border-t border-[var(--border-default)] px-3 py-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-[var(--text-muted)]"
              title="Keyframe de cámara"
              onClick={(e) => handleAddCameraKeyframe(e)}
            >
              <icons.plus size={12} />
              <span className="ml-1">Cam KF</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-[var(--text-muted)]"
              title="Agregar introducción (I)"
              onClick={(e) => {
                e.stopPropagation();
                addQuickTitleClip('intro');
              }}
            >
              <icons.workflow size={12} />
              <span className="ml-1">+ Intro</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-[var(--text-muted)]"
              title="Agregar cierre (O)"
              onClick={(e) => {
                e.stopPropagation();
                addQuickTitleClip('outro');
              }}
            >
              <icons.workflow size={12} />
              <span className="ml-1">+ Cierre</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-[var(--text-muted)]"
              title="Agregar clip de vídeo"
              onClick={(e) => handleAddTrack('video', e)}
            >
              <icons.video size={12} />
              <span className="ml-1">Vídeo</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-[var(--text-muted)]"
              title="Agregar clip de audio"
              onClick={(e) => handleAddTrack('audio', e)}
            >
              <icons.audio size={12} />
              <span className="ml-1">Audio</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-[var(--text-muted)]"
              title="Agregar clip de texto"
              onClick={(e) => handleAddTrack('text', e)}
            >
              <icons.text size={12} />
              <span className="ml-1">Texto</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-[var(--text-muted)]"
              onClick={(e) => handleAddTrack('background', e)}
            >
              <icons.layers size={12} />
              <span className="ml-1">Fondo</span>
            </Button>
          </div>
        )}
      </div>

      {!compact && (
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div
          className="flex-shrink-0 border-r border-[var(--border-default)] bg-[#121827]"
          style={{ width: TRACK_LABEL_WIDTH }}
        >
          <div className="h-9 border-b border-[var(--border-default)] bg-[#0f1522]" />
          {project.tracks.map((track) => (
            <div
              key={track.id}
              className={cn(
                'flex h-14 cursor-pointer items-center gap-2 border-b border-[var(--border-default)] px-2',
                selectedTrackId === track.id ? 'bg-[#1a2438]/95' : '',
                !track.visible ? 'opacity-50' : '',
                track.muted ? 'opacity-70' : ''
              )}
              onClick={() =>
                dispatch({
                  type: 'SET_SELECTED_TRACK',
                  payload: selectedTrackId === track.id ? null : track.id,
                })
              }
            >
              <button
                className="p-1 rounded hover:bg-[#1a2438]"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTrackVisible(track.id);
                }}
                title={track.visible ? 'Ocultar pista' : 'Mostrar pista'}
              >
                {track.visible ? (
                  <icons.eye size={14} className="text-[var(--text-secondary)]" />
                ) : (
                  <icons.eyeOff size={14} className="text-[var(--text-muted)]" />
                )}
              </button>
              <button
                className="p-1 rounded hover:bg-[#1a2438]"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTrackLocked(track.id);
                }}
                title={track.locked ? 'Desbloquear pista' : 'Bloquear pista'}
              >
                {track.locked ? (
                  <icons.lock size={14} className="text-[var(--text-secondary)]" />
                ) : (
                  <icons.unlock size={14} className="text-[var(--text-muted)]" />
                )}
              </button>
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    track.type === 'background'
                      ? timelineColors.background
                      : timelineColors[track.type],
                }}
                aria-hidden
              />
              <span className="flex-1 truncate text-xs text-[var(--text-secondary)]">{track.name}</span>
            </div>
          ))}
        </div>

        <div
          ref={timelineRef}
          className="relative min-h-0 flex-1 cursor-pointer overflow-x-auto overflow-y-auto bg-[var(--bg-primary)]"
          onClick={handleTimelineClick}
        >
          <div
            className="relative"
            style={{ width: contentWidth, minHeight: Math.max(contentMinHeight, 100) }}
          >
            <div className="relative h-9 border-b border-[var(--border-default)] bg-[#0f1522]">
              {rulerTicks.map(({ sec, isMajor }, idx) => (
                <div
                  key={`tick-${idx}-${sec}`}
                  className={cn(
                    'absolute bottom-0 border-l',
                    isMajor
                      ? 'top-0 border-[var(--border-default)]/80'
                      : 'top-4 border-[var(--border-default)]/45'
                  )}
                  style={{ left: sec * pixelsPerSecond }}
                >
                  {isMajor ? (
                    <span className="absolute left-1 top-1 text-[10px] font-medium tabular-nums text-[var(--text-muted)]">
                      {formatRulerLabel(sec)}
                    </span>
                  ) : null}
                </div>
              ))}
              {(project.regions ?? []).map((region) => (
                <div
                  key={region.id}
                  className="absolute top-0 h-full border-x border-violet-300/40 bg-violet-300/15"
                  style={{
                    left: region.start * pixelsPerSecond,
                    width: Math.max(2, (region.end - region.start) * pixelsPerSecond),
                  }}
                  title={`${region.label} (${formatTimelineTimecode(region.start)} - ${formatTimelineTimecode(region.end)})`}
                />
              ))}
              {sortedMarkers.map((marker) => (
                <button
                  key={marker.id}
                  type="button"
                  className="absolute top-0 z-20 h-full w-3 -translate-x-1/2"
                  style={{ left: marker.time * pixelsPerSecond }}
                  title={`${marker.label} (${formatTimelineTimecode(marker.time)})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'SET_CURRENT_TIME', payload: marker.time });
                  }}
                >
                  <span
                    className="absolute left-1/2 top-0 h-0 w-0 -translate-x-1/2 border-l-[5px] border-r-[5px] border-t-[8px] border-l-transparent border-r-transparent"
                    style={{ borderTopColor: marker.color ?? '#fbbf24' }}
                  />
                </button>
              ))}
            </div>

            {project.tracks.map((track, trackIndex) => (
              <div
                key={track.id}
                className={cn(
                  'relative h-14 border-b border-[var(--border-default)]',
                  trackIndex % 2 === 0 ? 'bg-[#121827]' : 'bg-[#0d111a]',
                  !track.visible ? 'opacity-40' : '',
                  track.muted && track.type === 'audio' ? 'opacity-[0.65]' : ''
                )}
              >
                {track.visible && track.clips.map((clip) => {
                  const clipW = Math.max(8, clip.duration * pixelsPerSecond);
                  const clipChrome = getClipChromeColor(clip);
                  const clipAccent = getClipTrackColor(clip);
                  return (
                  <div
                    key={clip.id}
                    className={cn(
                      'absolute top-1 h-12 overflow-hidden rounded-md select-none ring-1 ring-black/40',
                      track.locked ? 'cursor-not-allowed' : 'cursor-move',
                      selectedClipIds?.includes(clip.id)
                        ? 'ring-2 ring-[var(--accent-primary)]'
                        : 'hover:ring-[var(--border-active)]/45'
                    )}
                    style={{
                      left: clip.startTime * pixelsPerSecond,
                      width: clipW,
                      backgroundColor: clipChrome,
                      borderLeft: `3px solid ${clipAccent}`,
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                    }}
                    onClick={(e) => handleClipClick(e, track.id, clip.id)}
                    onMouseDown={(e) => handleClipDragStart(e, track, clip)}
                  >
                    {clip.type === 'video' && clip.mediaUrl ? (
                      <ClipFilmstripLayer
                        clip={clip}
                        mediaFiles={mediaFiles}
                        tileCount={Math.ceil(clipW / 44)}
                      />
                    ) : null}
                    {clip.type === 'audio' ? (
                      <AudioWaveformLayer clipId={clip.id} widthPx={clipW} />
                    ) : null}
                    <div
                      className={cn(
                        'absolute left-0 top-0 h-full w-2 bg-black/35 hover:bg-white/20',
                        track.locked ? 'cursor-not-allowed' : 'cursor-ew-resize'
                      )}
                      onMouseDown={(e) => handleTrimStart(e, track, clip, 'start')}
                    />
                    <div
                      className={cn(
                        'absolute right-0 top-0 h-full w-2 bg-black/35 hover:bg-white/20',
                        track.locked ? 'cursor-not-allowed' : 'cursor-ew-resize'
                      )}
                      onMouseDown={(e) => handleTrimStart(e, track, clip, 'end')}
                    />
                    <div className="relative z-[1] flex h-full flex-col justify-end overflow-hidden bg-gradient-to-t from-black/65 via-black/20 to-transparent px-2 pb-1 pt-3">
                      <span className="block truncate text-[11px] font-medium text-white drop-shadow">
                        {clip.name}
                      </span>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {(clip.speed ?? 1) !== 1 && (
                          <span className="rounded bg-black/35 px-1 text-[9px] text-white/95">
                            {(clip.speed ?? 1).toFixed(2)}x
                          </span>
                        )}
                        {clip.reverse && (
                          <span className="rounded bg-black/35 px-1 text-[9px] text-white/95">REV</span>
                        )}
                      </div>
                    </div>
                    {clip.type !== 'background' && clip.inTransition && (
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-white/30 pointer-events-none"
                        style={{
                          width: `${Math.max(4, clip.inTransition.duration * pixelsPerSecond)}px`,
                        }}
                        title={`In: ${clip.inTransition.name}`}
                      />
                    )}
                    {clip.type !== 'background' && clip.outTransition && (
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-white/30 pointer-events-none"
                        style={{
                          width: `${Math.max(4, clip.outTransition.duration * pixelsPerSecond)}px`,
                        }}
                        title={`Out: ${clip.outTransition.name}`}
                      />
                    )}
                  </div>
                  );
                })}
              </div>
            ))}

            <div
              className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-[var(--accent-primary)] shadow-[0_0_12px_rgba(49,180,243,0.55)]"
              style={{ left: currentTime * pixelsPerSecond }}
            >
              <div
                className="pointer-events-auto absolute left-1/2 top-0 z-20 h-2.5 w-4 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border border-[#d9edff] bg-[var(--accent-primary)] shadow-md"
                onMouseDown={handlePlayheadMouseDown}
                aria-label="Arrastrar cabezal de reproducción"
              />
            </div>
          </div>
        </div>
      </div>
      )}

      {showCropPanel && (
        <div className="absolute right-3 top-12 z-popover w-[280px] rounded-xl border border-[#2a3348] bg-[#0f1522] p-3 shadow-xl">
          <p className="text-xs font-semibold text-[#e5edff]">Crop</p>
          <p className="mt-1 text-[11px] text-[#9fb0d6]">
            {selectedClipContext && ['video', 'image'].includes(selectedClipContext.clip.type)
              ? `Clip: ${selectedClipContext.clip.name}`
              : 'Selecciona un clip de video o imagen'}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(['free', '16:9', '9:16', '1:1', '4:5'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                className={cn(
                  'rounded-md border px-2 py-1.5 text-[11px]',
                  cropAspect === opt
                    ? 'border-sky-400 bg-sky-400/15 text-white'
                    : 'border-[#2a3348] bg-[#121827] text-[#9fb0d6]'
                )}
                onClick={() => setCropAspect(opt)}
              >
                {opt === 'free' ? 'Libre' : opt}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={resetCropToDefault}>
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={applyCropToSelectedClip}
              disabled={!selectedClipContext || !['video', 'image'].includes(selectedClipContext.clip.type)}
            >
              Apply crop
            </Button>
          </div>
        </div>
      )}

      {showLayersPanel && (
        <div className="absolute right-3 top-12 z-popover w-[260px] rounded-xl border border-[#2a3348] bg-[#0f1522] p-3 shadow-xl">
          <p className="text-xs font-semibold text-[#e5edff]">Layers</p>
          <p className="mt-1 text-[11px] text-[#9fb0d6]">
            {selectedClipContext ? `Clip: ${selectedClipContext.clip.name}` : 'Selecciona un clip'}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => moveSelectedClipLayer('down')}
              disabled={!selectedClipContext}
            >
              Bajar capa
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => moveSelectedClipLayer('up')}
              disabled={!selectedClipContext}
            >
              Subir capa
            </Button>
          </div>
        </div>
      )}

      {showMaskPanel && (
        <div className="absolute right-3 top-12 z-popover w-[320px] rounded-xl border border-[#2a3348] bg-[#0f1522] p-3 shadow-xl">
          <p className="text-xs font-semibold text-[#e5edff]">Mask Effects</p>
          <p className="mt-1 text-[11px] text-[#9fb0d6]">
            {selectedClipContext && ['video', 'image'].includes(selectedClipContext.clip.type)
              ? `Clip: ${selectedClipContext.clip.name}`
              : 'Selecciona un clip de video o imagen'}
          </p>
          <div className="mt-3 space-y-2 text-xs">
            {(['top', 'bottom', 'left', 'right'] as const).map((edge) => {
              const value = selectedClipContext?.clip.mediaMask?.[edge] ?? 0;
              return (
                <div key={edge} className="rounded-md border border-[#2a3348] bg-[#121827] px-2 py-1.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="capitalize text-[#d4e0fa]">{edge}</span>
                    <span className="text-[#8fa3cf]">{(value * 100).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.8}
                    step={0.01}
                    value={value}
                    className="w-full"
                    disabled={!selectedClipContext || !['video', 'image'].includes(selectedClipContext.clip.type)}
                    onChange={(e) => updateMaskEdge(edge, Number(e.target.value))}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}