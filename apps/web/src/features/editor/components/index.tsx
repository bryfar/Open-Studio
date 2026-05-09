'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from './Header';
import { Canvas } from './Canvas';
import { Timeline } from './Timeline';
import { PropertiesPanel } from './PropertiesPanel';
import { AssetLibrary } from './AssetLibrary';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { createBlankProject } from '@/features/editor/lib/projectFactory';
import { loadEditorState, loadProjectSnapshot, saveEditorState, saveProjectSnapshot } from '@/core/lib/storage';

interface EditorProps {
  projectId?: string;
  mode?: string;
}

const STORAGE_LIBRARY_PANEL = 'openstudio.editor.libraryPanelOpen';
const STORAGE_PROPERTIES_PANEL = 'openstudio.editor.propertiesPanelOpen';

function readPanelPreference(key: string, defaultOpen: boolean): boolean {
  if (typeof window === 'undefined') return defaultOpen;
  try {
    const raw = localStorage.getItem(key);
    if (raw === 'false') return false;
    if (raw === 'true') return true;
  } catch {
    /* ignore */
  }
  return defaultOpen;
}

function writePanelPreference(key: string, open: boolean) {
  try {
    localStorage.setItem(key, open ? 'true' : 'false');
  } catch {
    /* ignore */
  }
}

export function Editor({ projectId, mode }: EditorProps) {
  const {
    project,
    playbackState,
    currentTime,
    selectedClipId,
    selectedClipIds,
    mediaFiles,
    dispatch,
  } = useEditorStore();
  const animationRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const [timelineHeight, setTimelineHeight] = useState(288);
  const [timelineCompact, setTimelineCompact] = useState(false);
  const savedTimelineHeightRef = useRef(288);
  const timelineHeightRef = useRef(timelineHeight);

  useEffect(() => {
    timelineHeightRef.current = timelineHeight;
  }, [timelineHeight]);

  const handleToggleTimelineCompact = useCallback(() => {
    setTimelineCompact((prev) => {
      const next = !prev;
      if (next) {
        savedTimelineHeightRef.current = timelineHeightRef.current;
        setTimelineHeight(52);
      } else {
        setTimelineHeight(Math.max(180, savedTimelineHeightRef.current));
      }
      return next;
    });
  }, []);
  const [activeResize, setActiveResize] = useState<{
    type: 'timeline';
    startClientX: number;
    startClientY: number;
    startTimelineHeight: number;
  } | null>(null);
  const [libraryPanelOpen, setLibraryPanelOpen] = useState(() =>
    readPanelPreference(STORAGE_LIBRARY_PANEL, true)
  );
  const [propertiesPanelOpen, setPropertiesPanelOpen] = useState(() =>
    readPanelPreference(STORAGE_PROPERTIES_PANEL, true)
  );

  useEffect(() => {
    writePanelPreference(STORAGE_LIBRARY_PANEL, libraryPanelOpen);
  }, [libraryPanelOpen]);

  useEffect(() => {
    writePanelPreference(STORAGE_PROPERTIES_PANEL, propertiesPanelOpen);
  }, [propertiesPanelOpen]);

  // Carga / recarga al cambiar projectId o al montar (local o snapshot por URL)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    const loader = projectId ? loadProjectSnapshot(projectId) : loadEditorState();
    loader
      .then((saved) => {
        if (cancelled) return;
        if (projectId) {
          if (saved?.project) {
            dispatch({
              type: 'REPLACE_SNAPSHOT',
              payload: { project: saved.project, mediaFiles: saved.mediaFiles ?? [] },
            });
          } else {
            const blank = createBlankProject('Sin título', '16:9');
            blank.id = projectId;
            dispatch({
              type: 'REPLACE_SNAPSHOT',
              payload: { project: blank, mediaFiles: [] },
            });
          }
          return;
        }
        if (saved?.project) {
          dispatch({
            type: 'REPLACE_SNAPSHOT',
            payload: { project: saved.project, mediaFiles: saved.mediaFiles ?? [] },
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load project from storage', err);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, projectId]);

  useEffect(() => {
    if (playbackState !== 'playing' || !project) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let lastTimestamp = performance.now();
    const tick = (timestamp: number) => {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const state = useEditorStore.getState();
      const currentProject = state.project;
      if (!currentProject || state.playbackState !== 'playing') {
        return;
      }

      const nextTime = state.currentTime + delta;
      dispatch({
        type: 'SET_CURRENT_TIME',
        payload: nextTime >= currentProject.duration ? 0 : nextTime,
      });

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [playbackState, project, dispatch]);

  // Autosave suave cuando cambian proyecto o media
  useEffect(() => {
    if (!project) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      const saver = projectId
        ? saveProjectSnapshot(projectId, project, mediaFiles)
        : saveEditorState(project, mediaFiles);
      saver.catch((err) => console.error('Failed to save editor state', err));
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [project, mediaFiles, projectId]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!project) return;

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      try {
        switch (e.code) {
          case 'Space':
            e.preventDefault();
            dispatch({
              type: 'SET_PLAYBACK_STATE',
              payload: playbackState === 'playing' ? 'paused' : 'playing',
            });
            break;
          case 'ArrowLeft':
            e.preventDefault();
            dispatch({
              type: 'SET_CURRENT_TIME',
              payload: Math.max(0, currentTime - 1 / 30),
            });
            break;
          case 'ArrowRight':
            e.preventDefault();
            dispatch({
              type: 'SET_CURRENT_TIME',
              payload: Math.min(project.duration, currentTime + 1 / 30),
            });
            break;
          case 'KeyZ':
            if (e.metaKey || e.ctrlKey) {
              e.preventDefault();
              if (e.shiftKey) {
                dispatch({ type: 'REDO' });
              } else {
                dispatch({ type: 'UNDO' });
              }
            }
            break;
          case 'KeyS':
            if (e.ctrlKey || e.metaKey || e.altKey) break;
            e.preventDefault();
            dispatch({ type: 'SPLIT_AT_PLAYHEAD', payload: { time: currentTime } });
            break;
          case 'Delete':
          case 'Backspace': {
            const idsToDelete =
              selectedClipIds && selectedClipIds.length > 0
                ? selectedClipIds
                : selectedClipId
                ? [selectedClipId]
                : [];

            if (idsToDelete.length === 0) break;

            const trackByClipId = new Map<string, string>();
            for (const track of project.tracks) {
              for (const clip of track.clips) {
                if (idsToDelete.includes(clip.id)) {
                  trackByClipId.set(clip.id, track.id);
                }
              }
            }

            trackByClipId.forEach((trackId, clipId) => {
              dispatch({
                type: 'REMOVE_CLIP',
                payload: { trackId, clipId },
              });
            });

            dispatch({ type: 'SET_SELECTED_CLIP_IDS', payload: [] });
            break;
          }
        }
      } catch (err) {
        console.error('Keyboard handler error:', err);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackState, currentTime, project, selectedClipId, selectedClipIds, dispatch]);

  useEffect(() => {
    if (!activeResize) return;

    const handlePointerMove = (event: PointerEvent) => {
      if (!layoutRef.current) return;
      const layoutRect = layoutRef.current.getBoundingClientRect();
      const contentHeight = layoutRect.height;

      const clamp = (value: number, min: number, max: number) =>
        Math.min(max, Math.max(min, value));

      const verticalGap = 8;
      const minCanvasHeight = 320;
      const minTimelineHeight = 180;
      const maxTimeline = Math.max(
        minTimelineHeight,
        contentHeight - verticalGap - minCanvasHeight
      );
      const deltaY = event.clientY - activeResize.startClientY;
      const nextTimeline = clamp(
        activeResize.startTimelineHeight - deltaY,
        minTimelineHeight,
        maxTimeline
      );
      setTimelineHeight(nextTimeline);
    };

    const stopResize = () => {
      setActiveResize(null);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResize);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResize);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [activeResize]);

  useEffect(() => {
    if (timelineCompact) return;
    const clampLayoutToViewport = () => {
      if (!layoutRef.current) return;
      const layoutRect = layoutRef.current.getBoundingClientRect();
      const contentHeight = layoutRect.height;

      const verticalGap = 8;
      const minCanvasHeight = 320;
      const minTimelineHeight = 180;
      const maxTimeline = Math.max(
        minTimelineHeight,
        contentHeight - verticalGap - minCanvasHeight
      );
      const nextTimeline = Math.max(minTimelineHeight, Math.min(timelineHeight, maxTimeline));
      if (nextTimeline !== timelineHeight) setTimelineHeight(nextTimeline);
    };

    clampLayoutToViewport();
    window.addEventListener('resize', clampLayoutToViewport);
    return () => window.removeEventListener('resize', clampLayoutToViewport);
  }, [timelineHeight, timelineCompact]);

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
      <Header />
      <div
        ref={layoutRef}
        className="editor-workbench relative z-0 flex flex-1 min-h-0 gap-3 overflow-hidden px-3 pb-3 pt-2.5"
      >
        {libraryPanelOpen ? (
          <div className="relative h-full min-h-0 w-[356px] min-w-[356px] max-w-[356px] shrink-0">
            <div className="editor-side-panel h-full min-h-0 w-full overflow-hidden">
              <AssetLibrary mode={mode} />
            </div>
            <button
              type="button"
              className="absolute right-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--os-border-default)]/45 bg-[var(--os-media-card-bg)]/95 text-[var(--os-text-muted)] shadow-[0_2px_10px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-colors hover:border-[var(--os-border-accent)]/40 hover:text-[var(--os-text-primary)]"
              title="Ocultar biblioteca"
              aria-label="Ocultar panel de biblioteca"
              aria-expanded={true}
              onClick={() => setLibraryPanelOpen(false)}
            >
              <ChevronLeft size={15} strokeWidth={2} aria-hidden />
            </button>
          </div>
        ) : null}

        <div className="editor-stage-column relative z-0 min-h-0 min-w-0 flex-1">
          <Canvas />

          <button
            type="button"
            className={`editor-resize-handle group relative h-2 w-full shrink-0 transition-colors ${
              timelineCompact ? 'cursor-default opacity-40' : 'cursor-row-resize'
            }`}
            aria-label="Redimensionar timeline"
            onPointerDown={(event) => {
              if (timelineCompact) return;
              setActiveResize({
                type: 'timeline',
                startClientX: event.clientX,
                startClientY: event.clientY,
                startTimelineHeight: timelineHeight,
              });
            }}
          >
            <span
              className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center gap-1"
              aria-hidden
            >
              <span className="h-1 w-1 rounded-full bg-[var(--text-muted)] transition-colors group-hover:bg-[var(--accent-primary)]" />
              <span className="h-1 w-1 rounded-full bg-[var(--text-muted)] transition-colors group-hover:bg-[var(--accent-primary)]" />
              <span className="h-1 w-1 rounded-full bg-[var(--text-muted)] transition-colors group-hover:bg-[var(--accent-primary)]" />
            </span>
          </button>

          <div
            className="editor-timeline-shell relative z-20 min-h-0 overflow-hidden transition-[height] duration-300 ease-out"
            style={{ height: timelineHeight }}
          >
            <Timeline compact={timelineCompact} onToggleCompact={handleToggleTimelineCompact} />
          </div>
          {!libraryPanelOpen ? (
            <button
              type="button"
              className="pointer-events-auto absolute left-3 top-1/2 z-40 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--os-border-default)]/45 bg-[var(--os-bg-canvas)]/92 text-[var(--os-text-muted)] shadow-[0_2px_10px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-colors hover:border-[var(--os-border-accent)]/40 hover:text-[var(--os-text-primary)]"
              title="Mostrar biblioteca"
              aria-label="Mostrar panel de biblioteca"
              aria-expanded={false}
              onClick={() => setLibraryPanelOpen(true)}
            >
              <ChevronRight size={15} strokeWidth={2} aria-hidden />
            </button>
          ) : null}
          {!propertiesPanelOpen ? (
            <button
              type="button"
              className="pointer-events-auto absolute right-3 top-1/2 z-40 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--os-border-default)]/45 bg-[var(--os-bg-canvas)]/92 text-[var(--os-text-muted)] shadow-[0_2px_10px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-colors hover:border-[var(--os-border-accent)]/40 hover:text-[var(--os-text-primary)]"
              title="Mostrar propiedades"
              aria-label="Mostrar panel de propiedades"
              aria-expanded={false}
              onClick={() => setPropertiesPanelOpen(true)}
            >
              <ChevronLeft size={15} strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>

        {propertiesPanelOpen ? (
          <div className="relative h-full min-h-0 min-w-[300px] max-w-[420px] w-fit shrink-0">
            <div className="editor-side-panel h-full min-h-0 w-full min-w-[300px] max-w-[420px] overflow-hidden">
              <PropertiesPanel />
            </div>
            <button
              type="button"
              className="absolute left-2 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--os-border-default)]/45 bg-[var(--os-media-card-bg)]/95 text-[var(--os-text-muted)] shadow-[0_2px_10px_rgba(0,0,0,0.28)] backdrop-blur-sm transition-colors hover:border-[var(--os-border-accent)]/40 hover:text-[var(--os-text-primary)]"
              title="Ocultar propiedades"
              aria-label="Ocultar panel de propiedades"
              aria-expanded={true}
              onClick={() => setPropertiesPanelOpen(false)}
            >
              <ChevronRight size={15} strokeWidth={2} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}