'use client';

import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEditorStore, createClip, createTrack } from '@/features/editor/store/editorStore';
import { Button } from '@/shared/components/ui/Button';
import { Slider } from '@/shared/components/ui/Slider';
import { icons } from '@/shared/components/icons';
import { cn, generateId } from '@/shared/utils';
import type { BackgroundStyle, Clip, Effect, MediaFile, Track } from '@/shared/types';
import { BUILTIN_TEMPLATES } from '@/core/lib/templates';
import {
  STUDIO_GRADIENT_PRESETS,
  STUDIO_MOCKUP_PRESETS,
  STUDIO_SOLID_COLORS,
  STUDIO_WALLPAPER_CATEGORIES,
  STUDIO_WALLPAPERS,
  StudioWallpaperCategoryId,
  studioMockupCategoryBackground,
} from '@/core/lib/studioCatalog';
import { EFFECT_PRESETS, FILTER_PRESETS, TRANSITION_PRESETS } from '@/core/lib/motionCatalog';
import {
  applyMotionPresetToClip,
  MOTION_DESIGN_PRESETS,
} from '@/core/lib/motionDesignCatalog';
import {
  defaultProjectBackground,
  findBackgroundEditTarget,
  resolveBackgroundAtTime,
} from '@/features/editor/lib/sceneTimeline';
import { ProjectZoomCursorSections } from '@/features/editor/components/ProjectZoomCursorSections';
import { AIShortsPanel } from '@/features/editor/components/AIShortsPanel';
import { ClipGeneratorPanel } from '@/features/editor/components/ClipGeneratorPanel';
import { AudioProPanel } from '@/features/editor/components/AudioProPanel';
import { TimelineProPanel } from '@/features/editor/components/TimelineProPanel';
import { KeyframesGraphPanel } from '@/features/editor/components/KeyframesGraphPanel';
import { ScopesPanel } from '@/features/editor/components/ScopesPanel';
import { MulticamProxyPanel } from '@/features/editor/components/MulticamProxyPanel';
import { BatchRenderPanel } from '@/features/editor/components/BatchRenderPanel';
import { SubtitleTrackPanel } from '@/features/editor/components/SubtitleTrackPanel';
import { TranscriptionPanel } from '@/features/editor/components/TranscriptionPanel';
import { scheduleMediaFileMetadataProbe } from '@/features/editor/lib/scheduleMediaProbe';

type SectionType =
  | 'workflow'
  | 'ai-shorts'
  | 'audio-pro'
  | 'timeline-pro'
  | 'keyframes-pro'
  | 'scopes'
  | 'multicam-proxy'
  | 'batch-render'
  | 'multimedia'
  | 'templates'
  | 'background'
  | 'mockup'
  | 'videos'
  | 'shorts'
  | 'elements'
  | 'audio'
  | 'text'
  | 'subtitles'
  | 'transcribe'
  | 'effects'
  | 'motion'
  | 'lienzo'
  | 'transitions'
  | 'filters'
  | 'brandkit'
  | 'record'
  | 'upload';

type LibraryNavItem = [SectionType, string, keyof typeof icons];

/** Navegación lateral agrupada: menos desorden y mejor lectura en pantalla. */
const LIBRARY_SIDE_GROUPS: { label: string; ariaLabel: string; sections: LibraryNavItem[] }[] = [
  {
    label: 'Estudio',
    ariaLabel: 'Estudio y flujo de trabajo',
    sections: [
      ['workflow', 'Estudio', 'workflow'],
      ['ai-shorts', 'AI Shorts', 'workflow'],
      ['audio-pro', 'Audio Pro', 'audio'],
      ['timeline-pro', 'Timeline Pro', 'move'],
      ['keyframes-pro', 'Graph', 'keyframe'],
      ['scopes', 'Scopes', 'eye'],
      ['multicam-proxy', 'Multicam', 'video'],
      ['batch-render', 'Batch', 'repeat'],
    ],
  },
  {
    label: 'Medios',
    ariaLabel: 'Medios y texto',
    sections: [
      ['templates', 'Plantillas', 'video'],
      ['elements', 'Elementos', 'layers'],
      ['videos', 'Videos', 'video'],
      ['shorts', 'Shorts', 'cut'],
      ['audio', 'Audio', 'audio'],
      ['text', 'Texto', 'text'],
      ['subtitles', 'Subtítulos', 'text'],
      ['transcribe', 'Transcribir', 'audio'],
    ],
  },
  {
    label: 'Estilo',
    ariaLabel: 'Estilo y lienzo',
    sections: [
      ['effects', 'Efectos', 'layers'],
      ['motion', 'Motion', 'layers'],
      ['lienzo', 'Zoom/Cursor', 'screen'],
      ['transitions', 'Transiciones', 'move'],
      ['filters', 'Filtros', 'eye'],
      ['brandkit', 'Kit marca', 'layers'],
      ['background', 'Background', 'layers'],
      ['mockup', 'Mockup', 'maximize'],
    ],
  },
  {
    label: 'Entrada',
    ariaLabel: 'Captura e importación',
    sections: [
      ['record', 'Record', 'screen'],
      ['upload', 'Upload', 'upload'],
    ],
  },
];

const SECTION_LABELS: Record<SectionType, string> = {
  workflow: 'Estudio · flujo rápido',
  'ai-shorts': 'AI Shorts · UGC pipeline',
  'audio-pro': 'Audio Pro',
  'timeline-pro': 'Timeline Pro',
  'keyframes-pro': 'Keyframes · Graph',
  scopes: 'Scopes de color',
  'multicam-proxy': 'Multicam + Proxy',
  'batch-render': 'Batch Render',
  multimedia: 'Biblioteca',
  templates: 'Plantillas',
  background: 'Fondo',
  mockup: 'Mockup',
  videos: 'Videos',
  shorts: 'Shorts virales',
  elements: 'Elementos',
  audio: 'Audio',
  text: 'Texto',
  subtitles: 'Subtítulos',
  transcribe: 'Transcripción',
  effects: 'Efectos',
  motion: 'Motion',
  lienzo: 'Zoom / cursor',
  transitions: 'Transiciones',
  filters: 'Filtros',
  brandkit: 'Kit de marca',
  record: 'Grabación',
  upload: 'Subir archivos',
};

export function AssetLibrary({ mode }: { mode?: string }) {
  const initialSection: SectionType =
    mode === 'clip-generator' ? 'shorts' : mode === 'ai-shorts' ? 'ai-shorts' : 'multimedia';
  const [activeSection, setActiveSection] = useState<SectionType>(initialSection);
  const [backgroundTab, setBackgroundTab] = useState<'wallpaper' | 'color' | 'image'>('wallpaper');
  const [wallpaperCategory, setWallpaperCategory] = useState<StudioWallpaperCategoryId>(
    STUDIO_WALLPAPER_CATEGORIES[0]?.id ?? 'gradient'
  );
  const [templateSourceFilter, setTemplateSourceFilter] = useState<
    'all' | 'native' | 'jitter' | 'hera'
  >('all');
  const [resourceNotice, setResourceNotice] = useState<string | null>(null);
  const [transitionEdgeTab, setTransitionEdgeTab] = useState<'in' | 'out'>('in');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundImageInputRef = useRef<HTMLInputElement>(null);
  const elementImageInputRef = useRef<HTMLInputElement>(null);
  const railScrollRef = useRef<HTMLDivElement>(null);
  const [railScrollEdges, setRailScrollEdges] = useState({ canUp: false, canDown: false });
  const { mediaFiles, project, dispatch, selectedClipId, currentTime } = useEditorStore();

  const syncRailScrollEdges = useCallback(() => {
    const el = railScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const canUp = scrollTop > 2;
    const canDown = scrollTop + clientHeight < scrollHeight - 2;
    setRailScrollEdges((prev) =>
      prev.canUp === canUp && prev.canDown === canDown ? prev : { canUp, canDown }
    );
  }, []);

  useLayoutEffect(() => {
    syncRailScrollEdges();
  }, [syncRailScrollEdges]);

  useEffect(() => {
    const el = railScrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => syncRailScrollEdges());
    ro.observe(el);
    el.addEventListener('scroll', syncRailScrollEdges, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', syncRailScrollEdges);
    };
  }, [syncRailScrollEdges]);

  const scrollRailBy = useCallback((direction: -1 | 1) => {
    const el = railScrollRef.current;
    if (!el) return;
    const step = Math.max(72, Math.round(el.clientHeight * 0.35));
    el.scrollBy({ top: direction * step, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      const el = railScrollRef.current;
      if (!el) return;
      const pressed = el.querySelector('button[aria-pressed="true"]');
      if (pressed instanceof HTMLElement) {
        pressed.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      syncRailScrollEdges();
    });
    return () => window.cancelAnimationFrame(id);
  }, [activeSection, syncRailScrollEdges]);

  const updateProjectStyle = useCallback((patch: Record<string, unknown>) => {
    if (!project) return;
    dispatch({ type: 'UPDATE_PROJECT', payload: patch });
  }, [project, dispatch]);

  const getTargetClipContext = () => {
    if (!project) return null;
    if (selectedClipId) {
      for (const track of project.tracks) {
        const clip = track.clips.find((c) => c.id === selectedClipId);
        if (clip) return { track, clip };
      }
    }
    const videoTrack = project.tracks.find((t) => t.type === 'video' && t.visible);
    if (videoTrack) {
      const atPlayhead = videoTrack.clips.find(
        (c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration
      );
      if (atPlayhead) return { track: videoTrack, clip: atPlayhead };
      const sorted = [...videoTrack.clips].sort((a, b) => a.startTime - b.startTime);
      if (sorted.length > 0) return { track: videoTrack, clip: sorted[0] };
    }
    for (const track of project.tracks) {
      const active = track.clips.find(
        (c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration
      );
      if (active) return { track, clip: active };
    }
    for (const track of project.tracks) {
      if (track.clips.length > 0) return { track, clip: track.clips[0] };
    }
    return null;
  };

  const withTargetClip = (
    fn: (ctx: { track: Track; clip: Clip }) => void,
    messageWhenMissing: string
  ) => {
    const ctx = getTargetClipContext();
    if (!ctx) {
      setResourceNotice(messageWhenMissing);
      return;
    }
    dispatch({ type: 'SET_SELECTED_CLIP', payload: ctx.clip.id });
    fn(ctx);
    setResourceNotice(`Aplicado a: ${ctx.clip.name}`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => {
        const url = URL.createObjectURL(file);
        const payload: MediaFile = {
          id: Math.random().toString(36).substring(2, 15),
          name: file.name,
          type: file.type,
          url,
          thumbnail: url,
        };
        dispatch({ type: 'ADD_MEDIA_FILE', payload });
        scheduleMediaFileMetadataProbe(dispatch, payload);
      });
    },
    [dispatch]
  );

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const payload: MediaFile = {
        id: Math.random().toString(36).substring(2, 15),
        name: file.name,
        type: file.type,
        url,
        thumbnail: url,
      };
      dispatch({ type: 'ADD_MEDIA_FILE', payload });
      scheduleMediaFileMetadataProbe(dispatch, payload);
    });

    e.target.value = '';
  };

  const handleAddToTimeline = (media: MediaFile) => {
    const currentProject = useEditorStore.getState().project;
    if (!currentProject) return;

    const type = media.type.startsWith('video')
      ? 'video'
      : media.type.startsWith('audio')
      ? 'audio'
      : media.type.startsWith('image')
      ? 'image'
      : 'video';

    let resolvedTrack = currentProject.tracks.find((t) => t.type === type);
    if (!resolvedTrack) {
      const newTrack = createTrack(`${type.charAt(0).toUpperCase() + type.slice(1)} Track`, type);
      dispatch({
        type: 'ADD_TRACK',
        payload: newTrack,
      });
      resolvedTrack = newTrack;
    }

    if (!resolvedTrack) return;

    const clip = createClip(
      resolvedTrack.id,
      type,
      media.name,
      0,
      media.duration || 5,
      media.url,
      media.type
    );

    dispatch({
      type: 'ADD_CLIP',
      payload: { trackId: resolvedTrack.id, clip },
    });
    dispatch({ type: 'SET_SELECTED_CLIP', payload: clip.id });
    dispatch({ type: 'SET_CURRENT_TIME', payload: clip.startTime });
    dispatch({ type: 'SET_PLAYBACK_STATE', payload: 'paused' });
    setResourceNotice(`Recurso agregado: ${clip.name}`);
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = BUILTIN_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    dispatch({ type: 'SET_PROJECT', payload: template.buildProject() });
    dispatch({ type: 'SET_SELECTED_CLIP', payload: null });
    dispatch({ type: 'SET_SELECTED_CLIP_IDS', payload: [] });
    setResourceNotice(`Plantilla aplicada: ${template.name}`);
  };

  const handleAddText = () => {
    const currentProject = useEditorStore.getState().project;
    if (!currentProject) return;

    let track = currentProject.tracks.find((t) => t.type === 'text');
    if (!track) {
      track = createTrack('Text Track 1', 'text');
      dispatch({
        type: 'ADD_TRACK',
        payload: track,
      });
    }
    if (!track) return;

    const clip = createClip(track.id, 'text', 'Text', 0, 10);
    clip.text = 'New Text';
    clip.fontSize = 48;
    clip.color = '#ffffff';

    dispatch({
      type: 'ADD_CLIP',
      payload: { trackId: track.id, clip },
    });
  };

  const handleAddShape = (shape: 'rectangle' | 'circle' | 'triangle') => {
    const currentProject = useEditorStore.getState().project;
    if (!currentProject) return;
    let textTrack = currentProject.tracks.find((t) => t.type === 'text');
    if (!textTrack) {
      textTrack = createTrack('Elements Track', 'text');
      dispatch({ type: 'ADD_TRACK', payload: textTrack });
    }

    const glyph = shape === 'circle' ? '●' : shape === 'triangle' ? '▲' : '■';
    const clip = createClip(textTrack.id, 'text', `Shape ${shape}`, 0, 8);
    clip.text = glyph;
    clip.fontSize = 72;
    clip.color = '#ffffff';

    dispatch({
      type: 'ADD_CLIP',
      payload: { trackId: textTrack.id, clip },
    });
  };

  const quickAddTextTemplate = (text: string, size: number, color: string) => {
    const currentProject = useEditorStore.getState().project;
    if (!currentProject) return;
    let track = currentProject.tracks.find((t) => t.type === 'text');
    if (!track) {
      track = createTrack('Text Track', 'text');
      dispatch({ type: 'ADD_TRACK', payload: track });
    }
    const clip = createClip(track.id, 'text', text, 0, 8);
    clip.text = text;
    clip.fontSize = size;
    clip.color = color;
    dispatch({ type: 'ADD_CLIP', payload: { trackId: track.id, clip } });
  };

  /** Subtítulo en el cabezal actual (estilo cortos / ostions). */
  const quickAddCaptionAtPlayhead = (
    text: string,
    size: number,
    color: string,
    withShadow: boolean
  ) => {
    const currentProject = useEditorStore.getState().project;
    if (!currentProject) return;
    let track = currentProject.tracks.find((t) => t.type === 'text');
    if (!track) {
      track = createTrack('Text Track', 'text');
      dispatch({ type: 'ADD_TRACK', payload: track });
    }
    const clip = createClip(track.id, 'text', text.slice(0, 28), currentTime, 4.5);
    clip.text = text;
    clip.fontSize = size;
    clip.color = color;
    if (withShadow) {
      clip.effects = [
        {
          id: generateId(),
          type: 'shadow',
          value: 14,
          enabled: true,
        },
      ];
    }
    dispatch({ type: 'ADD_CLIP', payload: { trackId: track.id, clip } });
    setResourceNotice(`Texto añadido en ${currentTime.toFixed(2)}s`);
  };

  const insertWorkflowTimestamp = () => {
    if (!project) return;
    const t = currentTime;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const cs = Math.floor((t % 1) * 100);
    const stamp = `[${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}] `;
    const prev = project.textWorkflowNotes ?? '';
    const sep = prev.length > 0 && !prev.endsWith('\n') ? '\n' : '';
    updateProjectStyle({ textWorkflowNotes: prev + sep + stamp });
  };

  const CATALOG_EFFECT_DEFAULTS: Partial<Record<Effect['type'], number>> = {
    blur: 20,
    brightness: 18,
    contrast: 18,
    shadow: 8,
    shake: 18,
    'chromatic-aberration': 16,
    glow: 24,
    'motion-blur': 22,
    grayscale: 72,
    sepia: 58,
    saturate: 118,
    'hue-rotate': 28,
    invert: 22,
  };

  const applyCatalogEffect = (effectId: string) => {
    withTargetClip((ctx) => {
      const effectType = effectId as Effect['type'];
      const valid: Effect['type'][] = [
        'blur',
        'brightness',
        'contrast',
        'shadow',
        'shake',
        'chromatic-aberration',
        'glow',
        'motion-blur',
        'grayscale',
        'sepia',
        'saturate',
        'hue-rotate',
        'invert',
      ];
      if (!valid.includes(effectType)) return;
      const defaultValue = CATALOG_EFFECT_DEFAULTS[effectType] ?? 20;
      const exists = ctx.clip.effects.some((e) => e.type === effectType);
      const nextEffects = exists
        ? ctx.clip.effects.map((e) => (e.type === effectType ? { ...e, enabled: true } : e))
        : [
            ...ctx.clip.effects,
            {
              id: generateId(),
              type: effectType,
              value: defaultValue,
              enabled: true,
            },
          ];
      dispatch({
        type: 'UPDATE_CLIP',
        payload: { trackId: ctx.track.id, clip: { ...ctx.clip, effects: nextEffects } },
      });
    }, 'No hay clips en la línea de tiempo. Añade un video o clip primero.');
  };

  const applyCatalogFilter = (filterId: string) => {
    withTargetClip((ctx) => {
      const presets: Record<string, Array<{ type: Effect['type']; value: number }>> = {
        cinematic: [
          { type: 'contrast', value: 28 },
          { type: 'brightness', value: -8 },
        ],
        vivid: [
          { type: 'contrast', value: 22 },
          { type: 'brightness', value: 10 },
          { type: 'saturate', value: 118 },
        ],
        warm: [{ type: 'brightness', value: 6 }, { type: 'sepia', value: 18 }],
        cool: [{ type: 'contrast', value: 10 }, { type: 'hue-rotate', value: 195 }],
        mono: [{ type: 'grayscale', value: 72 }, { type: 'contrast', value: 22 }],
        retro: [
          { type: 'contrast', value: 14 },
          { type: 'shadow', value: 6 },
          { type: 'sepia', value: 26 },
        ],
        bleach: [
          { type: 'brightness', value: 24 },
          { type: 'contrast', value: -8 },
          { type: 'saturate', value: 78 },
        ],
        noir: [
          { type: 'contrast', value: 42 },
          { type: 'grayscale', value: 58 },
        ],
        pastel: [
          { type: 'brightness', value: 10 },
          { type: 'saturate', value: 82 },
          { type: 'contrast', value: -14 },
        ],
      };
      const nextEffects = [...ctx.clip.effects];
      for (const p of presets[filterId] ?? []) {
        const idx = nextEffects.findIndex((e) => e.type === p.type);
        if (idx >= 0) nextEffects[idx] = { ...nextEffects[idx], value: p.value, enabled: true };
        else nextEffects.push({ id: generateId(), type: p.type, value: p.value, enabled: true });
      }
      dispatch({
        type: 'UPDATE_CLIP',
        payload: { trackId: ctx.track.id, clip: { ...ctx.clip, effects: nextEffects } },
      });
    }, 'No hay clips en la línea de tiempo. Añade un video o clip primero.');
  };

  const applyCatalogTransition = (transitionId: string, edge: 'in' | 'out') => {
    withTargetClip((ctx) => {
      const preset = TRANSITION_PRESETS.find((p) => p.id === transitionId);
      if (!preset) return;
      dispatch({
        type: edge === 'in' ? 'SET_CLIP_TRANSITION_IN' : 'SET_CLIP_TRANSITION_OUT',
        payload: {
          trackId: ctx.track.id,
          clipId: ctx.clip.id,
          transition:
            transitionId === 'cut'
              ? null
              : { id: preset.id, name: preset.name, duration: preset.duration ?? 0.35 },
        },
      });
    }, 'No hay clips en la línea de tiempo. Añade un video o clip primero.');
  };

  const applyMotionDesignPreset = (presetId: string) => {
    withTargetClip((ctx) => {
      dispatch({
        type: 'UPDATE_CLIP',
        payload: {
          trackId: ctx.track.id,
          clip: applyMotionPresetToClip(ctx.clip, presetId),
        },
      });
    }, 'No hay clips en la línea de tiempo. Añade un video o clip primero.');
  };

  const applyAudioMixPreset = (volume: number, label: string) => {
    withTargetClip((ctx) => {
      dispatch({
        type: 'UPDATE_CLIP',
        payload: {
          trackId: ctx.track.id,
          clip: { ...ctx.clip, volume },
        },
      });
      setResourceNotice(`Volumen (${label}): ${Math.round(volume * 100)} %`);
    }, 'No hay clips en la línea de tiempo. Añade audio o vídeo primero.');
  };

  const handleAddElementImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentProject = useEditorStore.getState().project;
    if (!currentProject || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    dispatch({
      type: 'ADD_MEDIA_FILE',
      payload: {
        id: Math.random().toString(36).substring(2, 15),
        name: file.name,
        type: file.type,
        url,
        thumbnail: url,
      },
    });
    let imageTrack = currentProject.tracks.find((t) => t.type === 'image');
    if (!imageTrack) {
      imageTrack = createTrack('Image Overlay Track', 'image');
      dispatch({ type: 'ADD_TRACK', payload: imageTrack });
    }
    const clip = createClip(imageTrack.id, 'image', file.name, 0, 8, url, file.type);
    dispatch({ type: 'ADD_CLIP', payload: { trackId: imageTrack.id, clip } });
    e.target.value = '';
  };

  const updateBackground = (patch: Partial<BackgroundStyle>) => {
    const currentProject = useEditorStore.getState().project;
    if (!currentProject) return;
    const target = findBackgroundEditTarget(currentProject, currentTime);
    const prev =
      target?.clip.sceneBackground ??
      currentProject.background ??
      defaultProjectBackground();
    const next: BackgroundStyle = { ...prev, ...patch };
    dispatch({ type: 'UPDATE_PROJECT', payload: { background: next } });
    if (target) {
      dispatch({
        type: 'UPDATE_CLIP',
        payload: {
          trackId: target.track.id,
          clip: { ...target.clip, sceneBackground: next },
        },
      });
    }
  };

  const clearSceneBackground = () => {
    const currentProject = useEditorStore.getState().project;
    if (!currentProject) return;
    const target = findBackgroundEditTarget(currentProject, currentTime);
    const prev =
      target?.clip.sceneBackground ??
      currentProject.background ??
      defaultProjectBackground();
    const next: BackgroundStyle = { ...prev, type: 'none' };
    dispatch({ type: 'UPDATE_PROJECT', payload: { background: next } });
    if (target) {
      dispatch({
        type: 'UPDATE_CLIP',
        payload: {
          trackId: target.track.id,
          clip: { ...target.clip, sceneBackground: next },
        },
      });
    }
    setResourceNotice(
      'Fondo transparente en este segmento. Puedes borrar el clip «Background» en la línea de tiempo.'
    );
  };

  const handleBackgroundImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentProject = useEditorStore.getState().project;
    if (!currentProject || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const url = URL.createObjectURL(file);
    updateBackground({ type: 'image', imageUrl: url });
    e.target.value = '';
  };

  const wallpaperCategories = STUDIO_WALLPAPER_CATEGORIES;
  const safeWallpaperCategory = wallpaperCategories.some((category) => category.id === wallpaperCategory)
    ? wallpaperCategory
    : (wallpaperCategories[0]?.id ?? 'gradient');

  const visibleTemplates = BUILTIN_TEMPLATES.filter((template) =>
    templateSourceFilter === 'all' ? true : template.source === templateSourceFilter
  );
  const visibleWallpapers = STUDIO_WALLPAPERS.filter(
    (wallpaper) => wallpaper.category === safeWallpaperCategory
  );
  const wallpaperTiles =
    visibleWallpapers.length > 0 ? visibleWallpapers.slice(0, 24) : STUDIO_WALLPAPERS.slice(0, 24);

  const resolvedSceneBackground = project
    ? resolveBackgroundAtTime(project, currentTime).style ??
      project.background ??
      defaultProjectBackground()
    : null;

  const applyMockupPreset = (presetId: string) => {
    const currentProject = useEditorStore.getState().project;
    if (!currentProject) return;
    const preset = STUDIO_MOCKUP_PRESETS.find((m) => m.id === presetId);
    if (!preset) return;
    const nextBg: BackgroundStyle = {
      ...(currentProject.background ?? defaultProjectBackground()),
      padding: preset.padding,
      radius: preset.radius,
      shadow: preset.shadow,
    };
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        deviceFrame: {
          ...(currentProject.deviceFrame ?? {
            enabled: false,
            type: 'none',
            padding: 24,
            radius: 16,
            shadow: 24,
          }),
          enabled: preset.deviceType !== 'none',
          type: preset.deviceType,
          padding: preset.padding,
          radius: preset.radius,
          shadow: preset.shadow,
        },
        background: nextBg,
      },
    });
    const target = findBackgroundEditTarget(currentProject, currentTime);
    if (target) {
      dispatch({
        type: 'UPDATE_CLIP',
        payload: {
          trackId: target.track.id,
          clip: { ...target.clip, sceneBackground: nextBg },
        },
      });
    }
  };

  useEffect(() => {
    if (mode === 'clip-generator') {
      queueMicrotask(() => setActiveSection('shorts'));
      return;
    }
    if (mode === 'ai-shorts') {
      queueMicrotask(() => setActiveSection('ai-shorts'));
      return;
    }
  }, [mode]);

  return (
    <div className="editor-panel-fill w-full flex-row overflow-hidden">
      <div className="flex h-full min-h-0 w-[88px] shrink-0 flex-col self-stretch border-r border-[var(--os-border-default)] bg-[var(--os-bg-canvas)]">
        <div className="shrink-0 border-b border-[var(--os-border-default)] px-1 pb-2 pt-2">
          <button
            type="button"
            className={cn(
              'flex w-full flex-col items-center gap-1 rounded-xl border py-2 text-[10px] font-medium leading-tight transition-all',
              activeSection === 'multimedia'
                ? 'text-[var(--os-text-primary)] bg-[var(--os-bg-active)] border-[var(--os-border-accent)] shadow-[inset_0_0_0_1px_rgba(125,160,220,0.22)]'
                : 'border-transparent text-[var(--os-text-muted)] hover:bg-[var(--os-bg-hover)] hover:text-[var(--os-text-primary)]'
            )}
            onClick={() => setActiveSection('multimedia')}
            aria-pressed={activeSection === 'multimedia'}
            title="Biblioteca: vídeos, audio e imágenes del proyecto"
            aria-label="Biblioteca multimedia"
          >
            <icons.folder size={14} className="shrink-0" aria-hidden />
            <span className="max-w-full px-0.5 text-center">Multimedia</span>
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <button
            type="button"
            className="flex h-8 w-full shrink-0 items-center justify-center border-b border-[var(--os-border-default)]/50 text-[var(--os-text-muted)] transition-colors hover:bg-[var(--os-bg-hover)] hover:text-[var(--os-text-primary)] disabled:pointer-events-none disabled:opacity-30"
            aria-label="Subir en la lista de herramientas"
            title="Ver herramientas anteriores"
            disabled={!railScrollEdges.canUp}
            onClick={() => scrollRailBy(-1)}
          >
            <ChevronUp size={16} strokeWidth={2} aria-hidden />
          </button>
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 top-0 z-[1] h-10 bg-gradient-to-b from-[var(--os-bg-canvas)] via-[var(--os-bg-canvas)]/90 to-transparent transition-opacity duration-200',
                !railScrollEdges.canUp && 'opacity-0'
              )}
              aria-hidden
            />
            <div
              ref={railScrollRef}
              className="os-scrollbar-none h-full min-h-0 overflow-y-auto overflow-x-hidden px-1 py-2"
            >
              {LIBRARY_SIDE_GROUPS.map((group, gi) => (
                <div
                  key={group.label}
                  role="group"
                  aria-label={group.ariaLabel}
                  className={cn(
                    'flex flex-col gap-1',
                    gi > 0 && 'mt-2 border-t border-[var(--os-border-default)]/60 pt-2'
                  )}
                >
                  <p className="px-0.5 pb-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--os-text-muted)]">
                    {group.label}
                  </p>
                  {group.sections.map(([id, label, icon]) => {
                    const Icon = icons[icon];
                    return (
                      <button
                        key={id}
                        type="button"
                        className={cn(
                          'flex w-full flex-col items-center gap-1 rounded-xl border py-2 text-[10px] font-medium leading-tight transition-all',
                          activeSection === id
                            ? 'text-[var(--os-text-primary)] bg-[var(--os-bg-active)] border-[var(--os-border-accent)] shadow-[inset_0_0_0_1px_rgba(125,160,220,0.22)]'
                            : 'border-transparent text-[var(--os-text-muted)] hover:bg-[var(--os-bg-hover)] hover:text-[var(--os-text-primary)]'
                        )}
                        onClick={() => setActiveSection(id)}
                        title={`${label}. ${SECTION_LABELS[id] ?? ''}`}
                        aria-label={SECTION_LABELS[id] ?? label}
                        aria-pressed={activeSection === id}
                      >
                        <Icon size={14} className="shrink-0" aria-hidden />
                        <span className="max-w-full break-words px-0.5 text-center">{label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-10 bg-gradient-to-t from-[var(--os-bg-canvas)] via-[var(--os-bg-canvas)]/90 to-transparent transition-opacity duration-200',
                !railScrollEdges.canDown && 'opacity-0'
              )}
              aria-hidden
            />
          </div>
          <button
            type="button"
            className="flex h-8 w-full shrink-0 items-center justify-center border-t border-[var(--os-border-default)]/50 text-[var(--os-text-muted)] transition-colors hover:bg-[var(--os-bg-hover)] hover:text-[var(--os-text-primary)] disabled:pointer-events-none disabled:opacity-30"
            aria-label="Bajar en la lista de herramientas"
            title="Ver más herramientas"
            disabled={!railScrollEdges.canDown}
            onClick={() => scrollRailBy(1)}
          >
            <ChevronDown size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 max-w-full flex-col self-stretch overflow-hidden">
        <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-[var(--os-border-default)] bg-gradient-to-r from-[var(--os-media-card-bg)] to-[var(--os-timeline-bg)] px-3">
          <span
            className="min-w-0 max-w-[min(100%,14rem)] text-left text-[11px] font-semibold leading-snug text-[var(--os-text-primary)] line-clamp-2 break-words"
            title={SECTION_LABELS[activeSection]}
          >
            {SECTION_LABELS[activeSection]}
          </span>
          {activeSection !== 'multimedia' && (
            <button
              type="button"
              className="editor-chip shrink-0"
              onClick={() => setActiveSection('multimedia')}
            >
              ← Biblioteca
            </button>
          )}
        </div>
        <div
          className={cn(
            'os-scrollbar-none w-full min-w-0 flex-1 overflow-y-auto bg-[var(--os-bg-subtle)] p-3',
            isDragging && 'bg-[var(--os-accent-primary)]/10'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {activeSection === 'multimedia' && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[var(--os-text-secondary)] mb-2">Videos</p>
                <div className="grid grid-cols-1 gap-2">
                  {mediaFiles.slice(0, 4).map((v, index) => (
                    <button
                      key={`${v.id}-${index}`}
                    className="h-14 rounded-xl border border-[var(--os-border-default)] bg-[var(--os-bg-panel-2)] text-[10px] text-[var(--os-text-secondary)] truncate px-2 hover:bg-[var(--os-bg-hover)]"
                      onClick={() => handleAddToTimeline(v)}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-[var(--os-text-secondary)] mb-2">Textos predefinidos</p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    className="h-10 rounded-xl border border-[var(--os-border-default)] bg-[var(--os-bg-panel-2)] px-2 text-white text-sm leading-none whitespace-nowrap hover:bg-[var(--os-bg-hover)]"
                    onClick={() => quickAddTextTemplate('Escribe tu texto aquí', 46, '#ffffff')}
                  >
                    Escribe tu texto aquí
                  </button>
                  <button
                    className="h-10 rounded-xl border border-[var(--os-border-default)] bg-[var(--os-bg-panel-2)] px-2 text-white text-sm leading-none whitespace-nowrap hover:bg-[var(--os-bg-hover)]"
                    onClick={() => quickAddTextTemplate('Escribe tu texto aquí', 46, '#e879f9')}
                  >
                    Escribe tu texto aquí
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'workflow' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--os-border-strong)] bg-[var(--os-surface-2)] px-2 py-2.5 text-left text-[11px] text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)]"
                  onClick={() => setActiveSection('shorts')}
                >
                  <span className="font-medium text-[var(--os-text-primary)]">Shorts 1 clic</span>
                  <span className="mt-0.5 block text-[10px] text-[var(--os-text-muted)]">Segmentos desde biblioteca o timeline</span>
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--os-border-strong)] bg-[var(--os-surface-2)] px-2 py-2.5 text-left text-[11px] text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)]"
                  onClick={() => setActiveSection('ai-shorts')}
                >
                  <span className="font-medium text-[var(--os-text-primary)]">AI Shorts</span>
                  <span className="mt-0.5 block text-[10px] text-[var(--os-text-muted)]">Brief, guion y modo Low/Premium</span>
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--os-border-strong)] bg-[var(--os-surface-2)] px-2 py-2.5 text-left text-[11px] text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)]"
                  onClick={() => setActiveSection('subtitles')}
                >
                  <span className="font-medium text-[var(--os-text-primary)]">Subtítulos</span>
                  <span className="mt-0.5 block text-[10px] text-[var(--os-text-muted)]">Presets listos para redes</span>
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--os-border-strong)] bg-[var(--os-surface-2)] px-2 py-2.5 text-left text-[11px] text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)]"
                  onClick={() => setActiveSection('transcribe')}
                >
                  <span className="font-medium text-[var(--os-text-primary)]">Guion / voz</span>
                  <span className="mt-0.5 block text-[10px] text-[var(--os-text-muted)]">Planifica frases y tiempos</span>
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--os-border-strong)] bg-[var(--os-surface-2)] px-2 py-2.5 text-left text-[11px] text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)]"
                  onClick={() => setActiveSection('brandkit')}
                >
                  <span className="font-medium text-[var(--os-text-primary)]">Marca</span>
                  <span className="mt-0.5 block text-[10px] text-[var(--os-text-muted)]">Colores y logos rápidos</span>
                </button>
              </div>
              <p className="text-[10px] leading-snug text-[var(--os-text-muted)]">
                <span className="text-[var(--os-text-secondary)]">Reencuadre del lienzo:</span> panel derecho de propiedades → sección
                «Reencuadre del lienzo» (16:9, 9:16, 1:1, 4:5).{' '}
                <span className="text-[var(--os-text-secondary)]">Export por red:</span> selector de plataforma en la barra superior.
              </p>
              <div className="rounded-lg border border-[var(--os-border-default)] bg-[var(--os-surface-1)]/60 p-2">
                <label htmlFor="workflow-notes" className="text-[11px] font-medium text-[var(--os-text-secondary)]">
                  Guion y marcas de tiempo
                </label>
                <textarea
                  id="workflow-notes"
                  rows={6}
                  className="mt-1 w-full resize-y rounded-md border border-[var(--os-border-default)] bg-[var(--os-bg-app)] px-2 py-1.5 text-[11px] text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)] focus:border-[var(--os-border-accent)] focus:outline-none"
                  placeholder={'Una línea por frase. Usa [00:12.00] para marcar el cabezal.\nEj: Hook fuerte en los primeros 3 s…'}
                  value={project?.textWorkflowNotes ?? ''}
                  onChange={(e) => updateProjectStyle({ textWorkflowNotes: e.target.value })}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={insertWorkflowTimestamp}
                  disabled={!project}
                >
                  <icons.clock size={14} />
                  <span className="ml-2">Insertar tiempo del cabezal</span>
                </Button>
              </div>
            </div>
          )}

          {activeSection === 'shorts' && (
            <ClipGeneratorPanel onNotice={setResourceNotice} />
          )}

          {activeSection === 'ai-shorts' && (
            <AIShortsPanel onNotice={setResourceNotice} />
          )}
          {activeSection === 'audio-pro' && (
            <AudioProPanel onNotice={setResourceNotice} />
          )}
          {activeSection === 'timeline-pro' && <TimelineProPanel />}
          {activeSection === 'keyframes-pro' && (
            <KeyframesGraphPanel onNotice={setResourceNotice} />
          )}
          {activeSection === 'scopes' && <ScopesPanel />}
          {activeSection === 'multicam-proxy' && (
            <MulticamProxyPanel onNotice={setResourceNotice} />
          )}
          {activeSection === 'batch-render' && (
            <BatchRenderPanel onNotice={setResourceNotice} />
          )}

          {activeSection === 'videos' && (
            <div className="space-y-3">
              <Button variant="secondary" className="w-full" onClick={handleBrowseClick}>
                <icons.upload size={14} />
                <span className="ml-2">Upload video</span>
              </Button>
              {mediaFiles.filter((m) => m.type.startsWith('video')).length === 0 ? (
                <p className="text-xs text-[var(--os-text-muted)] text-center py-4">No videos yet</p>
              ) : (
                <div className="space-y-2">
                  {mediaFiles
                    .filter((m) => m.type.startsWith('video'))
                    .map((file, index) => (
                      <button
                        key={`${file.id}-${index}`}
                        className="w-full flex items-center gap-2 p-2 bg-[var(--os-surface-2)] rounded-lg hover:bg-[var(--os-bg-hover)]"
                        onClick={() => handleAddToTimeline(file)}
                      >
                        <div className="w-10 h-10 bg-[var(--os-surface-3)] rounded overflow-hidden flex-shrink-0">
                          {file.thumbnail && (
                            <Image
                              src={file.thumbnail}
                              alt={file.name}
                              unoptimized
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs text-white truncate">{file.name}</p>
                          <p className="text-[10px] text-[var(--os-text-muted)]">{file.width}x{file.height}</p>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'upload' && (
            <div className="space-y-3">
              <div
                className={cn(
                  'border-2 border-dashed border-[var(--os-border-default)] rounded-lg p-6 text-center transition-colors',
                  isDragging && 'border-indigo-500 bg-indigo-500/10'
                )}
              >
                <icons.upload className="mx-auto text-[var(--os-text-muted)] mb-2" size={24} />
                <p className="text-xs text-[var(--os-text-muted)]">Drop files here or</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={handleBrowseClick}>
                  Browse
                </Button>
              </div>
            </div>
          )}

          {activeSection === 'record' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--os-text-secondary)]">
                Use the Record button in the top bar to open recording setup.
              </p>
              <div className="rounded-lg border border-[var(--os-border-default)] p-3 bg-[var(--os-surface-2)]/60">
                <p className="text-xs text-[var(--os-text-primary)]">Quick tips</p>
                <ul className="mt-2 text-[11px] text-[var(--os-text-muted)] space-y-1">
                  <li>1) Choose microphone/system audio</li>
                  <li>2) Start recording and stop from header</li>
                  <li>3) Recording is added to Videos automatically</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'audio' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--os-border-default)] bg-[var(--os-bg-panel-2)] p-3">
                <p className="text-sm font-semibold text-[var(--os-text-primary)]">Música</p>
                <p className="mt-1 text-[11px] leading-snug text-[var(--os-warning)]">
                  Parte de la música instrumental no está disponible por caducidad de licencia. Nuevos tracks pronto.
                </p>
              </div>
              <Button variant="secondary" className="w-full h-10 rounded-xl" onClick={handleBrowseClick}>
                <icons.upload size={14} />
                <span className="ml-2">Subir</span>
              </Button>
              <div className="rounded-xl border border-[var(--os-border-default)] bg-[var(--os-media-card-bg)] px-3 py-2 text-[11px] text-[var(--os-text-secondary)]">
                Buscar música libre de derechos
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {['All', 'Liked', 'Instrumental', 'Pop', 'Lo-fi'].map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      'whitespace-nowrap rounded-full border px-3 py-1 text-[11px]',
                      tag === 'Instrumental'
                        ? 'border-[var(--os-text-primary)] bg-[var(--os-text-primary)] text-[var(--os-text-inverse)]'
                        : 'border-[var(--os-border-default)] bg-[var(--os-bg-panel-2)] text-[var(--os-text-secondary)]'
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-[var(--os-text-muted)] leading-snug">
                Mezcla rápida en el clip activo (volumen por clip).
              </p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2 py-2 text-[10px] text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)]"
                  onClick={() => applyAudioMixPreset(1, 'Normal')}
                >
                  Normal (100%)
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2 py-2 text-[10px] text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)]"
                  onClick={() => applyAudioMixPreset(0.35, 'Bed')}
                >
                  Música fondo (~−9 dB)
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2 py-2 text-[10px] text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)]"
                  onClick={() => applyAudioMixPreset(0.15, 'Ambiente')}
                >
                  Ambiente muy bajo
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2 py-2 text-[10px] text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)]"
                  onClick={() => applyAudioMixPreset(0, 'Mute')}
                >
                  Silenciar clip
                </button>
              </div>
              <div className="space-y-2">
                {mediaFiles
                  .filter((m) => m.type.startsWith('audio'))
                  .map((file, index) => (
                    <button
                      key={`${file.id}-${index}`}
                      className="w-full flex items-center gap-3 p-2.5 bg-[var(--os-surface-1)] rounded-xl border border-[var(--os-border-default)] hover:bg-[var(--os-surface-2)]"
                      onClick={() => handleAddToTimeline(file)}
                    >
                      <div className="h-10 w-10 shrink-0 rounded-md bg-[var(--os-bg-hover)] flex items-center justify-center">
                        <icons.audio size={14} />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs text-white truncate">{file.name}</p>
                        <p className="text-[10px] text-[var(--os-text-muted)]">
                          {Math.max(0, Math.round(file.duration ?? 0)).toString().padStart(2, '0')}s · {file.type}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {activeSection === 'elements' && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[var(--os-text-secondary)] mb-2">Shapes</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className="h-10 rounded bg-[var(--os-surface-2)] hover:bg-[var(--os-bg-hover)] text-white text-lg"
                    onClick={() => handleAddShape('rectangle')}
                  >
                    ■
                  </button>
                  <button
                    className="h-10 rounded bg-[var(--os-surface-2)] hover:bg-[var(--os-bg-hover)] text-white text-lg"
                    onClick={() => handleAddShape('circle')}
                  >
                    ●
                  </button>
                  <button
                    className="h-10 rounded bg-[var(--os-surface-2)] hover:bg-[var(--os-bg-hover)] text-white text-lg"
                    onClick={() => handleAddShape('triangle')}
                  >
                    ▲
                  </button>
                </div>
              </div>
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleAddText}
              >
                <icons.text size={14} />
                <span className="ml-2">Add text</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => elementImageInputRef.current?.click()}
              >
                <icons.upload size={14} />
                <span className="ml-2">Upload overlay image</span>
              </Button>
            </div>
          )}

          {activeSection === 'text' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--os-text-secondary)]">Básico</p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => quickAddTextTemplate('Agregar título', 56, '#ffffff')}
              >
                Agregar título
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => quickAddTextTemplate('Agregar texto del cuerpo', 34, '#f4f4f5')}
              >
                Agregar texto del cuerpo
              </Button>
              <p className="text-xs text-[var(--os-text-secondary)]">Tendencias</p>
              <div className="grid grid-cols-1 gap-2">
                {['PERFECTO', 'BOOYAH!', 'NICE TRY', 'Free Fire'].map((txt) => (
                  <button
                    key={txt}
                    className="h-14 rounded border border-[var(--os-border-default)] bg-[var(--os-surface-2)] text-[11px] text-[var(--os-text-primary)]"
                    onClick={() => quickAddTextTemplate(txt, 38, '#ffffff')}
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'subtitles' && <SubtitleTrackPanel onNotice={setResourceNotice} />}

          {activeSection === 'transcribe' && <TranscriptionPanel onNotice={setResourceNotice} />}

          {activeSection === 'effects' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--os-text-secondary)]">
                {selectedClipId ? 'Aplica al clip seleccionado' : 'Se aplica al clip activo (auto)'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {EFFECT_PRESETS.map((preset) => {
                  const effectClass = `effect-${preset.id.replace('-', '-')}`;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      title={preset.hint ? `${preset.name} — ${preset.hint}` : preset.name}
                      className="os-effect-card"
                      onClick={() => applyCatalogEffect(preset.id)}
                    >
                      <div className={`os-effect-preview ${effectClass}`}>
                        <span className="text-white text-xs font-medium drop-shadow-lg">{preset.name}</span>
                      </div>
                      <div className="os-effect-preview-label">
                        {preset.hint || preset.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === 'motion' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {MOTION_DESIGN_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    title={preset.description}
                    className="min-h-[3rem] rounded border border-[var(--os-border-default)] bg-[var(--os-surface-2)] px-2 py-2 text-left text-[10px] text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)]"
                    onClick={() => applyMotionDesignPreset(preset.id)}
                  >
                    <span className="font-medium text-[var(--os-text-primary)]">{preset.name}</span>
                    <span className="mt-0.5 block text-[9px] leading-tight text-[var(--os-text-muted)]">{preset.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'lienzo' && (
            <div className="flex min-h-0 flex-col space-y-3">
              {!project ? (
                <p className="text-xs text-[var(--os-text-muted)]">Abre o crea un proyecto para usar zoom tutorial y cursor.</p>
              ) : (
                <>
                  <ProjectZoomCursorSections
                    project={project}
                    currentTime={currentTime}
                    updateProjectStyle={updateProjectStyle}
                  />
                </>
              )}
            </div>
          )}

          {activeSection === 'transitions' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--os-border-default)] bg-[var(--os-bg-panel-2)] p-1 grid grid-cols-2 gap-1 text-[12px]">
                <button
                  type="button"
                  onClick={() => setTransitionEdgeTab('in')}
                  className={cn(
                    'h-8 rounded-lg',
                    transitionEdgeTab === 'in' ? 'bg-[var(--os-bg-active)] text-white' : 'text-[var(--os-text-secondary)] hover:bg-[var(--os-bg-hover)]'
                  )}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setTransitionEdgeTab('out')}
                  className={cn(
                    'h-8 rounded-lg',
                    transitionEdgeTab === 'out' ? 'bg-[var(--os-bg-active)] text-white' : 'text-[var(--os-text-secondary)] hover:bg-[var(--os-bg-hover)]'
                  )}
                >
                  Salida
                </button>
              </div>
              <p className="text-xs text-[var(--os-text-secondary)]">
                {selectedClipId ? 'Selecciona transición para el clip' : 'Se aplica al clip activo (auto)'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TRANSITION_PRESETS.map((preset) => {
                  const transitionClass = `transition-${preset.id.replace('-', '-')}`;
                  return (
                    <button
                      key={`${transitionEdgeTab}-${preset.id}`}
                      className="os-transition-card"
                      onClick={() => applyCatalogTransition(preset.id, transitionEdgeTab)}
                    >
                      <div className={`os-transition-preview ${transitionClass}`} />
                      <div className="os-filter-label">
                        <span className="font-medium">{preset.name}</span>
                        {preset.duration && <span className="text-[var(--os-text-muted)] ml-1">({preset.duration}s)</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === 'filters' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--os-text-secondary)]">
                {selectedClipId ? 'Catálogo de filtros Timeline Pro' : 'Se aplica al clip activo (auto)'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {FILTER_PRESETS.map((preset) => {
                  const filterClass = `filter-${preset.id.replace('-', '-')}`;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      title={preset.hint ? `${preset.name} — ${preset.hint}` : preset.name}
                      className="os-filter-card"
                      onClick={() => applyCatalogFilter(preset.id)}
                    >
                      <div className={`os-filter-preview ${filterClass}`} />
                      <div className="os-filter-label">
                        <span className="font-medium">{preset.name}</span>
                        {preset.hint && <span className="text-[var(--os-text-muted)] ml-1">— {preset.hint}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {resourceNotice && (
            <div className="rounded-md border border-[var(--os-border-accent)]/40 bg-[var(--os-accent-primary)]/10 px-2 py-1 text-[10px] text-[var(--os-text-primary)]">
              {resourceNotice}
            </div>
          )}

          {activeSection === 'brandkit' && (
            <div className="space-y-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--os-text-muted)]">Colores rápidos</p>
              <div className="flex flex-wrap gap-2">
                {[
                  ['Primario oscuro', '#0f172a'],
                  ['Slate', '#1e293b'],
                  ['Marca violeta', '#7c3aed'],
                  ['Acento rosa', '#db2777'],
                  ['CTA ámbar', '#d97706'],
                ].map(([label, hex]) => (
                  <button
                    key={hex}
                    type="button"
                    title={label}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--os-border-strong)] ring-offset-2 ring-offset-[var(--os-bg-app)] hover:ring-2 hover:ring-[var(--os-accent-primary)]/60"
                    style={{ backgroundColor: hex }}
                    onClick={() => updateBackground({ type: 'solid', color: hex })}
                  />
                ))}
              </div>
              <Button variant="secondary" className="w-full" onClick={handleBrowseClick}>
                <icons.upload size={14} />
                <span className="ml-2">Subir logo o imagen de marca</span>
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="h-16 rounded border border-[var(--os-border-default)] bg-[var(--os-surface-2)] text-sm text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)]"
                  onClick={() => quickAddCaptionAtPlayhead('TU MARCA', 44, '#ffffff', true)}
                >
                  Wordmark blanco
                </button>
                <button
                  type="button"
                  className="h-16 rounded border border-[var(--os-border-default)] bg-[var(--os-surface-2)] text-sm text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)]"
                  onClick={() => quickAddCaptionAtPlayhead('TU MARCA', 40, '#c4b5fd', true)}
                >
                  Wordmark color
                </button>
              </div>
            </div>
          )}

          {activeSection === 'background' && (
            <div className="space-y-3">
              <Button variant="secondary" className="w-full text-xs" onClick={clearSceneBackground}>
                Quitar fondo (transparente en el playhead)
              </Button>
              <p className="text-[10px] text-[var(--os-text-muted)] leading-snug">
                El fondo es un clip en la pista <span className="text-[var(--os-text-primary)]">Background</span> al final
                del timeline (osa bajo el vídeo del proyecto). Puedes borrarlo, moverlo o partirlo con
                Split.
              </p>
              <div className="rounded-xl border border-[var(--os-border-default)] p-1 bg-[var(--os-bg-panel-2)] grid grid-cols-3 gap-1">
                {([
                  ['wallpaper', 'Wallpaper'],
                  ['color', 'Color'],
                  ['image', 'Image'],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setBackgroundTab(id)}
                    className={cn(
                      'h-7 rounded-md text-[11px] transition-colors',
                      backgroundTab === id
                        ? 'bg-[var(--os-surface-3)] text-white border border-[var(--os-border-accent)]'
                        : 'text-[var(--os-text-secondary)] hover:text-white'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {backgroundTab === 'wallpaper' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-1">
                    {wallpaperCategories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setWallpaperCategory(category.id)}
                        className={cn(
                          'h-7 rounded-md text-[10px] border',
                          safeWallpaperCategory === category.id
                            ? 'border-[var(--os-border-accent)] bg-[var(--os-accent-primary)]/10 text-white'
                            : 'border-[var(--os-border-default)] bg-[var(--os-surface-1)] text-[var(--os-text-primary)] hover:text-white'
                        )}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {wallpaperTiles.map((wallpaper) => (
                      <button
                        key={wallpaper.id}
                        type="button"
                        className="h-10 rounded-lg border border-[var(--os-border-default)]"
                        style={{ background: `url(${wallpaper.previewUrl}) center / cover no-repeat` }}
                        onClick={() =>
                          updateBackground({
                            type: 'image',
                            imageUrl: wallpaper.fullUrl,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {backgroundTab === 'color' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      className={cn(
                        'h-9 rounded-lg border text-xs',
                        resolvedSceneBackground?.type === 'solid'
                          ? 'border-[var(--os-border-accent)] text-white bg-[var(--os-accent-primary)]/10'
                          : 'border-[var(--os-border-default)] text-[var(--os-text-primary)] bg-[var(--os-surface-2)]'
                      )}
                      onClick={() => updateBackground({ type: 'solid' })}
                    >
                      Solid
                    </button>
                    <button
                      className={cn(
                        'h-9 rounded-lg border text-xs',
                        resolvedSceneBackground?.type === 'gradient'
                          ? 'border-[var(--os-border-accent)] text-white bg-[var(--os-accent-primary)]/10'
                          : 'border-[var(--os-border-default)] text-[var(--os-text-primary)] bg-[var(--os-surface-2)]'
                      )}
                      onClick={() => updateBackground({ type: 'gradient' })}
                    >
                      Gradient
                    </button>
                  </div>

                  <label className="text-[11px] text-[var(--os-text-secondary)]">Color 1</label>
                  <input
                    type="color"
                    className="w-full h-9 rounded-lg border border-[var(--os-border-default)] bg-[var(--os-surface-2)]"
                    value={
                      resolvedSceneBackground?.gradientFrom ??
                      resolvedSceneBackground?.color ??
                      '#0d0d0d'
                    }
                    onChange={(e) =>
                      updateBackground({
                        color: e.target.value,
                        gradientFrom: e.target.value,
                      })
                    }
                  />

                  <label className="text-[11px] text-[var(--os-text-secondary)]">Color 2</label>
                  <input
                    type="color"
                    className="w-full h-9 rounded-lg border border-[var(--os-border-default)] bg-[var(--os-surface-2)]"
                    value={resolvedSceneBackground?.gradientTo ?? '#6366f1'}
                    onChange={(e) => updateBackground({ gradientTo: e.target.value })}
                  />
                  <div className="grid grid-cols-8 gap-1 pt-1">
                    {STUDIO_SOLID_COLORS.slice(0, 24).map((color) => (
                      <button
                        key={color}
                        className="h-5 w-5 rounded-md border border-[var(--os-border-default)]"
                        style={{ backgroundColor: color }}
                        onClick={() => updateBackground({ type: 'solid', color })}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {STUDIO_GRADIENT_PRESETS.map((preset) => (
                      <button
                        key={`${preset.from}-${preset.to}`}
                        className="h-8 rounded-md border border-[var(--os-border-default)]"
                        style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
                        onClick={() =>
                          updateBackground({
                            type: 'gradient',
                            color: preset.from,
                            gradientFrom: preset.from,
                            gradientTo: preset.to,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {backgroundTab === 'image' && (
                <div className="space-y-3">
                  <button
                    className="w-full h-20 rounded-xl border border-dashed border-[var(--os-border-default)] bg-[var(--os-surface-2)]/60 text-xs text-[var(--os-text-primary)] hover:bg-[var(--os-surface-2)]"
                    onClick={() => backgroundImageInputRef.current?.click()}
                  >
                    Drag an image here or upload a file
                  </button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => backgroundImageInputRef.current?.click()}
                  >
                    <icons.upload size={14} />
                    <span className="ml-2">Upload background image</span>
                  </Button>
                </div>
              )}

              <div className="pt-2 border-t border-[var(--os-border-default)] space-y-2">
                <p className="text-[11px] text-[var(--os-text-secondary)] uppercase tracking-wide">Options</p>
                <Slider
                  label="Blur"
                  min={0}
                  max={24}
                  step={1}
                  value={resolvedSceneBackground?.blur ?? 0}
                  onChange={(value) => updateBackground({ blur: value })}
                />
                <Slider
                  label="Padding"
                  min={0}
                  max={60}
                  step={1}
                  value={resolvedSceneBackground?.padding ?? 0}
                  onChange={(value) => updateBackground({ padding: value })}
                />
                <Slider
                  label="Rounded"
                  min={0}
                  max={40}
                  step={1}
                  value={resolvedSceneBackground?.radius ?? 0}
                  onChange={(value) => updateBackground({ radius: value })}
                />
                <Slider
                  label="Shadows"
                  min={0}
                  max={48}
                  step={1}
                  value={resolvedSceneBackground?.shadow ?? 0}
                  onChange={(value) => updateBackground({ shadow: value })}
                />
              </div>
            </div>
          )}

          {activeSection === 'mockup' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--os-text-primary)]">Mockups de dispositivo</p>
              <div className="grid grid-cols-1 gap-2">
                {STUDIO_MOCKUP_PRESETS.map((mockup) => (
                  <button
                    key={mockup.id}
                    className={cn(
                      'relative h-20 rounded-lg border text-left overflow-hidden',
                      (project?.deviceFrame?.type ?? 'none') === mockup.deviceType &&
                        (project?.background?.radius ?? 16) === mockup.radius
                        ? 'border-[var(--os-border-accent)] ring-1 ring-[var(--os-accent-primary)]/60'
                        : 'border-[var(--os-border-default)] hover:border-[var(--os-border-strong)]'
                    )}
                    onClick={() => applyMockupPreset(mockup.id)}
                  >
                    <div
                      className="absolute inset-0 opacity-60"
                      style={{
                        background: `url(${studioMockupCategoryBackground(mockup.category)}) center / cover no-repeat`,
                      }}
                    />
                    <div className="relative z-10 h-full w-full bg-gradient-to-t from-black/70 to-black/10 p-2 flex items-end">
                      <span className="text-[10px] text-white font-semibold">{mockup.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'templates' && (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {([
                  ['all', 'All'],
                  ['native', 'Native'],
                  ['jitter', 'Fuente A'],
                  ['hera', 'Fuente B'],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    className={cn(
                      'px-2 py-1 rounded-full text-[10px] border',
                      templateSourceFilter === id
                        ? 'border-[var(--os-border-accent)] bg-[var(--os-timeline-selection)] text-white'
                        : 'border-[var(--os-border-default)] bg-[var(--os-bg-panel-2)] text-[var(--os-text-secondary)] hover:bg-[var(--os-bg-hover)]'
                    )}
                    onClick={() => setTemplateSourceFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {visibleTemplates.length === 0 && (
                <p className="text-xs text-[var(--os-text-muted)]">No templates for this source.</p>
              )}

              {visibleTemplates.map((template, index) => (
                <button
                  key={`${template.source}-${template.id}-${index}`}
                  className="w-full p-3 bg-[var(--os-surface-2)] rounded-lg text-left hover:bg-[var(--os-bg-hover)] transition-colors"
                  onClick={() => handleApplyTemplate(template.id)}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-white">{template.name}</p>
                    <span className="text-[10px] uppercase text-[var(--os-text-secondary)]">{template.source}</span>
                  </div>
                  <p className="text-[11px] text-[var(--os-text-secondary)] mt-1">{template.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*,image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={backgroundImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBackgroundImageChange}
      />
      <input
        ref={elementImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAddElementImage}
      />
    </div>
  );
}