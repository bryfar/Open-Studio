'use client';

import { useEffect, useMemo, useState } from 'react';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { Slider } from '@/shared/components/ui/Slider';
import { Input } from '@/shared/components/ui/Input';
import { icons } from '@/shared/components/icons';
import {
  DEFAULT_MEDIA_CROP,
  DEFAULT_SCREEN_CURSOR,
  Keyframe,
  Transform,
  type ScreenCursorClickEffect,
  type ScreenCursorStyle,
} from '@/shared/types';
import { cn, generateId } from '@/shared/utils';
import {
  EFFECT_PRESETS,
  FILTER_PRESETS,
  TRANSITION_PRESETS,
} from '@/core/lib/motionCatalog';
import type { TimeRemapKeyframe, BackgroundStyle, Clip, ClipMediaLayout } from '@/shared/types';
import { ProjectLienzoPanel } from '@/features/editor/components/ProjectLienzoPanel';
import {
  applyMotionPresetToClip,
  MOTION_COLOR_PALETTE,
  MOTION_DESIGN_PRESETS,
  MOTION_FONT_FAMILIES,
} from '@/core/lib/motionDesignCatalog';
import { defaultProjectBackground, findBackgroundEditTarget } from '@/features/editor/lib/sceneTimeline';
import {
  applyScreenCursorStylePreset,
  SCREEN_CURSOR_STYLE_PRESETS,
} from '@/features/editor/lib/projectStylePresets';
import { isFaceDetectorSupported } from '@/features/editor/lib/faceFraming';

function SelectedClipNameField({ clip }: { clip: Clip }) {
  const { project, dispatch } = useEditorStore();
  const [draft, setDraft] = useState(clip.name);

  const trackId = useMemo(() => {
    if (!project) return null;
    const track = project.tracks.find((t) => t.clips.some((c) => c.id === clip.id));
    return track?.id ?? null;
  }, [project, clip.id]);

  const commit = () => {
    if (!trackId) return;
    const next = draft.trim();
    if (!next) {
      setDraft(clip.name);
      return;
    }
    if (next === clip.name) return;
    dispatch({
      type: 'UPDATE_CLIP',
      payload: {
        trackId,
        clip: { ...clip, name: next },
      },
    });
  };

  return (
    <>
      <label className="text-[10px] uppercase tracking-wide text-zinc-500 block mb-1">Nombre</label>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="h-8 text-sm font-medium text-white border-zinc-700 bg-zinc-950/80"
      />
    </>
  );
}

export function PropertiesPanel() {
  const { project, currentTime, selectedClipId, dispatch } = useEditorStore();

  const resolvedCanvasBackground = useMemo(() => {
    if (!project) return null;
    return (
      findBackgroundEditTarget(project, currentTime)?.clip.sceneBackground ?? project.background ?? null
    );
  }, [project, currentTime]);

  const selectedClip = useMemo(() => {
    if (!project || !selectedClipId) return null;
    for (const track of project.tracks) {
      const clip = track.clips.find((c) => c.id === selectedClipId);
      if (clip) return clip;
    }
    return null;
  }, [project, selectedClipId]);

  const [activeTab, setActiveTab] = useState<'lienzo' | 'clip'>('clip');

  useEffect(() => {
    if (selectedClipId) queueMicrotask(() => setActiveTab('clip'));
  }, [selectedClipId]);

  const [animProperty, setAnimProperty] = useState<'scale' | 'opacity' | 'positionY' | 'rotation'>(
    'scale'
  );
  const [animDirection, setAnimDirection] = useState<'in' | 'out'>('in');
  const [animFrom, setAnimFrom] = useState(0.7);
  const [animTo, setAnimTo] = useState(1);
  const [animDuration, setAnimDuration] = useState(0.9);
  const [animEasing, setAnimEasing] = useState<Keyframe['easing']>('overshoot');

  const updateTransform = (key: keyof Transform, value: number) => {
    if (!selectedClip || !project) return;

    const track = project.tracks.find((t) =>
      t.clips.some((c) => c.id === selectedClipId)
    );
    if (!track) return;

    dispatch({
      type: 'UPDATE_CLIP',
      payload: {
        trackId: track.id,
        clip: {
          ...selectedClip,
          transform: {
            ...selectedClip.transform,
            [key]: value,
          },
        },
      },
    });
  };

  const addKeyframe = (
    channel: 'positionX' | 'positionY' | 'scaleX' | 'scaleY' | 'opacity'
  ) => {
    if (!selectedClip || !project) return;

    const track = project.tracks.find((t) =>
      t.clips.some((c) => c.id === selectedClipId)
    );
    if (!track) return;

    const relTime = Math.max(
      0,
      Math.min(selectedClip.duration, currentTime - selectedClip.startTime)
    );

    const currentValue =
      channel === 'positionX'
        ? selectedClip.transform.x
        : channel === 'positionY'
        ? selectedClip.transform.y
      : channel === 'scaleX'
        ? selectedClip.transform.scaleX
      : channel === 'scaleY'
        ? selectedClip.transform.scaleY
        : selectedClip.transform.opacity;

    const existing = selectedClip.keyframes[channel] || [];
    const withoutSameTime = existing.filter((k) => Math.abs(k.time - relTime) > 1e-3);
    const nextChannel = [
      ...withoutSameTime,
      {
        id: generateId(),
        time: relTime,
        value: currentValue,
        easing: 'linear' as const,
      },
    ].sort((a, b) => a.time - b.time);

    const nextKeyframes = {
      ...selectedClip.keyframes,
      [channel]: nextChannel,
    };

    dispatch({
      type: 'UPDATE_CLIP',
      payload: {
        trackId: track.id,
        clip: {
          ...selectedClip,
          keyframes: nextKeyframes,
        },
      },
    });
  };

  const removeKeyframe = (
    channel: 'positionX' | 'positionY' | 'scaleX' | 'scaleY' | 'opacity',
    keyframeId: string
  ) => {
    if (!selectedClip || !project) return;
    const track = project.tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));
    if (!track) return;
    dispatch({
      type: 'UPDATE_CLIP',
      payload: {
        trackId: track.id,
        clip: {
          ...selectedClip,
          keyframes: {
            ...selectedClip.keyframes,
            [channel]: selectedClip.keyframes[channel].filter((k) => k.id !== keyframeId),
          },
        },
      },
    });
  };

  const updateKeyframeEasing = (
    channel: 'positionX' | 'positionY' | 'scaleX' | 'scaleY' | 'opacity',
    keyframeId: string,
    easing: Keyframe['easing']
  ) => {
    if (!selectedClip || !project) return;
    const track = project.tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));
    if (!track) return;
    dispatch({
      type: 'UPDATE_CLIP',
      payload: {
        trackId: track.id,
        clip: {
          ...selectedClip,
          keyframes: {
            ...selectedClip.keyframes,
            [channel]: selectedClip.keyframes[channel].map((k) =>
              k.id === keyframeId ? { ...k, easing } : k
            ),
          },
        },
      },
    });
  };

  const renderKeyframeRow = (
    label: string,
    channel: 'positionX' | 'positionY' | 'scaleX' | 'scaleY' | 'opacity'
  ) => {
    if (!selectedClip) return null;
    const list = selectedClip.keyframes[channel];
    return (
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
        <div className="relative h-6 rounded bg-zinc-800 border border-zinc-700">
          {list.map((k) => (
            <span
              key={`${k.id}-dot`}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-400"
              style={{
                left: `${(k.time / Math.max(0.01, selectedClip.duration)) * 100}%`,
              }}
              title={`${k.time.toFixed(2)}s (${k.easing})`}
            />
          ))}
        </div>
        <div className="space-y-1">
          {list.map((k) => (
            <div key={k.id} className="flex items-center gap-2 text-[10px]">
              <span className="text-zinc-400 min-w-[40px]">t={k.time.toFixed(2)}</span>
              <select
                className="bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-zinc-200"
                value={k.easing}
                onChange={(e) =>
                  updateKeyframeEasing(
                    channel,
                    k.id,
                    e.target.value as Keyframe['easing']
                  )
                }
              >
                <option value="linear">linear</option>
                <option value="ease-in">ease-in</option>
                <option value="ease-out">ease-out</option>
                <option value="ease-in-out">ease-in-out</option>
                <option value="smooth">smooth</option>
                <option value="overshoot">overshoot</option>
                <option value="bounce">bounce</option>
                <option value="elastic">elastic</option>
              </select>
              <button
                className="text-red-400 hover:text-red-300"
                onClick={() => removeKeyframe(channel, k.id)}
                title="Delete keyframe"
              >
                <icons.close size={12} />
              </button>
            </div>
          ))}
          {list.length === 0 && <p className="text-[10px] text-zinc-600">No keyframes</p>}
        </div>
      </div>
    );
  };

  const updateTextContent = (text: string) => {
    if (!selectedClip || !project) return;

    const track = project.tracks.find((t) =>
      t.clips.some((c) => c.id === selectedClipId)
    );
    if (!track) return;

    dispatch({
      type: 'UPDATE_CLIP',
      payload: {
        trackId: track.id,
        clip: {
          ...selectedClip,
          text,
        },
      },
    });
  };

  const updateProjectStyle = (patch: Record<string, unknown>) => {
    if (!project) return;
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: patch,
    });
  };

  const patchSceneBackground = (patch: Partial<BackgroundStyle>) => {
    if (!project) return;
    const target = findBackgroundEditTarget(project, currentTime);
    const prev =
      target?.clip.sceneBackground ?? project.background ?? defaultProjectBackground();
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

  const applyEffectPreset = (effectId: string) => {
    if (!selectedClip || !project) return;
    const track = project.tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));
    if (!track) return;
    const valid = [
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
    ] as const;
    if (!valid.includes(effectId as (typeof valid)[number])) return;

    const defaults: Partial<Record<(typeof valid)[number], number>> = {
      blur: 20,
      brightness: 18,
      contrast: 18,
      shadow: 8,
      shake: 18,
      'chromatic-aberration': 16,
      glow: 24,
      'motion-blur': 22,
      grayscale: 70,
      sepia: 55,
      saturate: 115,
      'hue-rotate': 24,
      invert: 20,
    };

    const exists = selectedClip.effects.some((e) => e.type === effectId);
    const nextEffects = exists
      ? selectedClip.effects.map((e) =>
          e.type === effectId ? { ...e, enabled: true } : e
        )
      : [
          ...selectedClip.effects,
          {
            id: generateId(),
            type: effectId as (typeof valid)[number],
            value: defaults[effectId as (typeof valid)[number]] ?? 20,
            enabled: true,
          },
        ];

    dispatch({
      type: 'UPDATE_CLIP',
      payload: {
        trackId: track.id,
        clip: { ...selectedClip, effects: nextEffects },
      },
    });
  };

  const applyTransitionPreset = (position: 'in' | 'out', transitionId: string) => {
    if (!selectedClip || !project) return;
    const track = project.tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));
    if (!track) return;
    const preset = TRANSITION_PRESETS.find((p) => p.id === transitionId);
    if (!preset) return;
    const payload = {
      trackId: track.id,
      clipId: selectedClip.id,
      transition:
        transitionId === 'cut'
          ? null
          : { id: preset.id, name: preset.name, duration: preset.duration ?? 0.3 },
    };
    dispatch({
      type: position === 'in' ? 'SET_CLIP_TRANSITION_IN' : 'SET_CLIP_TRANSITION_OUT',
      payload,
    });
  };

  const applyMotionDesignPreset = (presetId: string) => {
    if (!selectedClip || !project) return;
    const track = project.tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));
    if (!track) return;
    dispatch({
      type: 'UPDATE_CLIP',
      payload: {
        trackId: track.id,
        clip: applyMotionPresetToClip(selectedClip, presetId),
      },
    });
  };

  const applyConfiguredAnimation = () => {
    if (!selectedClip || !project) return;
    const track = project.tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));
    if (!track) return;

    const clampedDuration = Math.max(0.1, Math.min(selectedClip.duration, animDuration));
    const start = animDirection === 'in' ? 0 : Math.max(0, selectedClip.duration - clampedDuration);
    const end = Math.min(selectedClip.duration, start + clampedDuration);

    const make = (time: number, value: number, easing: Keyframe['easing']): Keyframe => ({
      id: generateId(),
      time,
      value,
      easing,
    });

    const next = { ...selectedClip.keyframes };
    if (animProperty === 'scale') {
      next.scaleX = [make(start, animFrom, 'linear'), make(end, animTo, animEasing)];
      next.scaleY = [make(start, animFrom, 'linear'), make(end, animTo, animEasing)];
    } else if (animProperty === 'opacity') {
      next.opacity = [make(start, animFrom, 'linear'), make(end, animTo, animEasing)];
    } else if (animProperty === 'positionY') {
      next.positionY = [make(start, animFrom, 'linear'), make(end, animTo, animEasing)];
    } else if (animProperty === 'rotation') {
      next.rotation = [make(start, animFrom, 'linear'), make(end, animTo, animEasing)];
    }

    dispatch({
      type: 'UPDATE_CLIP',
      payload: {
        trackId: track.id,
        clip: {
          ...selectedClip,
          keyframes: next,
        },
      },
    });

  };

  const updateClipSpeed = (value: number) => {
    if (!selectedClip || !project) return;
    const track = project.tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));
    if (!track) return;
    dispatch({
      type: 'SET_CLIP_SPEED',
      payload: { trackId: track.id, clipId: selectedClip.id, speed: value },
    });
  };

  const toggleClipReverse = (reverse: boolean) => {
    if (!selectedClip || !project) return;
    const track = project.tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));
    if (!track) return;
    dispatch({
      type: 'SET_CLIP_REVERSE',
      payload: { trackId: track.id, clipId: selectedClip.id, reverse },
    });
  };

  const addTimeRemapKeyframe = () => {
    if (!selectedClip || !project) return;
    const track = project.tracks.find((t) => t.clips.some((c) => c.id === selectedClipId));
    if (!track) return;
    const relTime = Math.max(0, Math.min(selectedClip.duration, currentTime - selectedClip.startTime));
    const existing = selectedClip.timeMap ?? [];
    const withoutSame = existing.filter((k) => Math.abs(k.time - relTime) > 1e-3);
    const speed = Math.max(0.1, selectedClip.speed ?? 1);
    const next: TimeRemapKeyframe[] = [
      ...withoutSame,
      { id: generateId(), time: relTime, speed, curve: 'linear' as const },
    ].sort((a, b) => a.time - b.time);
    dispatch({
      type: 'SET_CLIP_TIME_MAP',
      payload: { trackId: track.id, clipId: selectedClip.id, timeMap: next },
    });
  };

  if (!project) {
    return (
      <div className="editor-panel-fill flex w-full flex-col items-center justify-center bg-[#0c0f18] p-5">
        <p className="text-center text-sm text-[var(--text-muted)]">No hay proyecto cargado</p>
      </div>
    );
  }

  return (
    <div className="editor-panel-fill flex flex-col overflow-hidden bg-[#0c0f18]">
      <div
        className="flex shrink-0 gap-1 border-b border-[var(--border-default)] bg-[#080b12] p-1.5"
        role="tablist"
        aria-label="Secciones del panel de propiedades"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'lienzo'}
          onClick={() => setActiveTab('lienzo')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide transition-colors',
            activeTab === 'lienzo'
              ? 'border border-sky-500/45 bg-[#152030] text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
              : 'border border-transparent text-zinc-500 hover:bg-[#121722] hover:text-zinc-300'
          )}
        >
          <icons.maximize size={14} className="shrink-0 opacity-90" aria-hidden />
          Lienzo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'clip'}
          onClick={() => setActiveTab('clip')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide transition-colors',
            activeTab === 'clip'
              ? 'border border-sky-500/45 bg-[#152030] text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
              : 'border border-transparent text-zinc-500 hover:bg-[#121722] hover:text-zinc-300'
          )}
        >
          <icons.layers size={14} className="shrink-0 opacity-90" aria-hidden />
          Clip
        </button>
      </div>

      {activeTab === 'lienzo' && (
        <div
          className="min-h-0 flex-1 overflow-y-auto bg-[#0a0d14]/60"
          role="tabpanel"
          id="properties-panel-lienzo"
        >
          <ProjectLienzoPanel
            project={project}
            resolvedCanvasBackground={resolvedCanvasBackground}
            patchSceneBackground={patchSceneBackground}
            updateProjectStyle={updateProjectStyle}
          />
          <div className="border-t border-[var(--border-default)]/50 bg-[#080b11]/90 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Zoom y cursor</p>
            <p className="mt-1 text-[10px] leading-snug text-zinc-600">
              En la barra izquierda elige <span className="text-zinc-400">Zoom / Cursor</span> (icono de pantalla) para
              zoom tutorial y puntero simulado del proyecto.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'clip' &&
        (!selectedClip ? (
          <div
            className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto bg-[#090c12]/55 px-5 py-8 text-center"
            role="tabpanel"
            id="properties-panel-clip-empty"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[#121722] shadow-inner">
              <icons.layers size={26} className="text-zinc-500" aria-hidden />
            </div>
            <div className="max-w-[220px] space-y-2">
              <p className="text-sm font-medium text-zinc-200">Ningún clip seleccionado</p>
              <p className="text-xs leading-relaxed text-zinc-500">
                Pulsa un clip en la línea de tiempo para ver transformación, efectos, filtros, texto y tiempo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('lienzo')}
              className="text-[11px] font-medium text-sky-400/90 underline-offset-2 hover:text-sky-300 hover:underline"
            >
              Ir a Lienzo (blur, marco, cámara)
            </button>
          </div>
        ) : (
          <div
            className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
            role="tabpanel"
            id="properties-panel-clip"
            aria-label="Propiedades del clip"
          >
          <div className="shrink-0 border-b border-zinc-800 p-4">
            <SelectedClipNameField key={selectedClip.id} clip={selectedClip} />
            <p className="mt-1 text-xs text-zinc-500">
              {selectedClip.type.charAt(0).toUpperCase() + selectedClip.type.slice(1)} Clip
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-400">Keyframes</h4>
          <div className="flex flex-col gap-2">
            <button
              className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left"
              onClick={() => addKeyframe('positionX')}
            >
              Add keyframe at playhead (X)
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left"
              onClick={() => addKeyframe('positionY')}
            >
              Add keyframe at playhead (Y)
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left"
              onClick={() => addKeyframe('opacity')}
            >
              Add keyframe at playhead (Opacity)
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left"
              onClick={() => addKeyframe('scaleX')}
            >
              Add keyframe at playhead (Scale X)
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left"
              onClick={() => addKeyframe('scaleY')}
            >
              Add keyframe at playhead (Scale Y)
            </button>
          </div>
          <div className="mt-2 space-y-3">
            {renderKeyframeRow('Position X', 'positionX')}
            {renderKeyframeRow('Position Y', 'positionY')}
            {renderKeyframeRow('Scale X', 'scaleX')}
            {renderKeyframeRow('Scale Y', 'scaleY')}
            {renderKeyframeRow('Opacity', 'opacity')}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-400">Effects</h4>
          <div className="flex flex-wrap gap-1.5">
            {EFFECT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-200"
                onClick={() => applyEffectPreset(preset.id)}
                title={preset.supportedNow ? 'Apply effect' : 'Coming soon'}
              >
                {preset.name}
                {!preset.supportedNow ? ' (soon)' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-400">Timeline Pro</h4>
          <div className="space-y-2">
            <label className="text-xs text-zinc-500">Speed</label>
            <Slider
              value={selectedClip.speed ?? 1}
              min={0.1}
              max={4}
              step={0.1}
              onChange={updateClipSpeed}
              label="x"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Reverse</span>
            <button
              className={`px-2 py-1 rounded text-xs border ${
                selectedClip.reverse
                  ? 'border-sky-400 bg-sky-400/10 text-white'
                  : 'border-zinc-700 text-zinc-300'
              }`}
              onClick={() => toggleClipReverse(!selectedClip.reverse)}
            >
              {selectedClip.reverse ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="space-y-2">
            <button
              className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-left"
              onClick={addTimeRemapKeyframe}
            >
              Add speed keyframe at playhead
            </button>
            <div className="space-y-1">
              {(selectedClip.timeMap ?? []).map((k) => (
                <div key={k.id} className="text-[10px] text-zinc-400">
                  t={k.time.toFixed(2)} speed={k.speed.toFixed(2)}x
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-400">Filters</h4>
          <div className="flex flex-wrap gap-1.5">
            {FILTER_PRESETS.map((preset) => (
              <span
                key={preset.id}
                className="px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-300"
              >
                {preset.name}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-400">Motion Design (After Effects style)</h4>
          <div className="grid grid-cols-2 gap-2">
            {MOTION_DESIGN_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className="rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-2 text-left"
                onClick={() => applyMotionDesignPreset(preset.id)}
                title={preset.description}
              >
                <p className="text-[11px] text-zinc-200">{preset.name}</p>
                <p className="text-[10px] text-zinc-500">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-400">Animation Options</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-zinc-500">Property</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-2 text-xs text-zinc-200"
                value={animProperty}
                onChange={(e) =>
                  setAnimProperty(e.target.value as 'scale' | 'opacity' | 'positionY' | 'rotation')
                }
              >
                <option value="scale">Scale</option>
                <option value="opacity">Opacity</option>
                <option value="positionY">Position Y</option>
                <option value="rotation">Rotation</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500">Direction</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-2 text-xs text-zinc-200"
                value={animDirection}
                onChange={(e) => setAnimDirection(e.target.value as 'in' | 'out')}
              >
                <option value="in">In</option>
                <option value="out">Out</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500">From</label>
              <Input
                type="number"
                step="0.1"
                value={animFrom}
                onChange={(e) => setAnimFrom(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500">To</label>
              <Input
                type="number"
                step="0.1"
                value={animTo}
                onChange={(e) => setAnimTo(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500">Duration (s)</label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                value={animDuration}
                onChange={(e) => setAnimDuration(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500">Easing</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-2 text-xs text-zinc-200"
                value={animEasing}
                onChange={(e) => setAnimEasing(e.target.value as Keyframe['easing'])}
              >
                <option value="linear">linear</option>
                <option value="ease-in">ease-in</option>
                <option value="ease-out">ease-out</option>
                <option value="ease-in-out">ease-in-out</option>
                <option value="smooth">smooth</option>
                <option value="overshoot">overshoot</option>
                <option value="bounce">bounce</option>
                <option value="elastic">elastic</option>
              </select>
            </div>
          </div>
          <button
            className="w-full rounded bg-indigo-600 hover:bg-indigo-500 px-2 py-2 text-xs text-white"
            onClick={applyConfiguredAnimation}
          >
            Apply Animation Settings
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-400">
            Transitions
          </h4>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-zinc-500 mb-1">In</p>
              <div className="flex flex-wrap gap-1.5">
                {TRANSITION_PRESETS.map((preset) => (
                  <button
                    key={`in-${preset.id}`}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300"
                    onClick={() => applyTransitionPreset('in', preset.id)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 mb-1">Out</p>
              <div className="flex flex-wrap gap-1.5">
                {TRANSITION_PRESETS.map((preset) => (
                  <button
                    key={`out-${preset.id}`}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300"
                    onClick={() => applyTransitionPreset('out', preset.id)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-400 flex items-center gap-2">
            <icons.move size={14} />
            Position
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-zinc-500">X</label>
              <Input
                type="number"
                value={selectedClip.transform.x}
                onChange={(e) => updateTransform('x', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500">Y</label>
              <Input
                type="number"
                value={selectedClip.transform.y}
                onChange={(e) => updateTransform('y', Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {selectedClip.type === 'audio' && (
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-zinc-400">Volume</h4>
            <Slider
              value={(selectedClip.volume ?? 1) * 100}
              min={0}
              max={200}
              step={1}
              onChange={(v) => {
                if (!selectedClip || !project) return;
                const track = project.tracks.find((t) =>
                  t.clips.some((c) => c.id === selectedClipId)
                );
                if (!track) return;
                dispatch({
                  type: 'UPDATE_CLIP',
                  payload: {
                    trackId: track.id,
                    clip: { ...selectedClip, volume: v / 100 },
                  },
                });
              }}
              label="%"
            />
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-400 flex items-center gap-2">
            <icons.maximize size={14} />
            Scale
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-zinc-500">Scale X</label>
              <Input
                type="number"
                step="0.1"
                value={selectedClip.transform.scaleX}
                onChange={(e) => updateTransform('scaleX', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500">Scale Y</label>
              <Input
                type="number"
                step="0.1"
                value={selectedClip.transform.scaleY}
                onChange={(e) => updateTransform('scaleY', Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {(selectedClip.type === 'video' || selectedClip.type === 'image') && (
          <div className="space-y-3 rounded-md border border-zinc-800 bg-zinc-900/40 p-2">
            <h4 className="text-xs font-medium text-zinc-400">Medio · layout (tipo Premiere / Resolve)</h4>
            <p className="text-[10px] leading-snug text-zinc-500">
              Cómo escala el archivo dentro del lienzo: <strong className="text-zinc-400">Cover</strong> rellena
              recortando, <strong className="text-zinc-400">Contain</strong> muestra todo el encuadre (bandas),
              <strong className="text-zinc-400"> Fill</strong> estira sin respetar proporción.
            </p>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-zinc-500">Encuadre</label>
              <select
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200"
                value={selectedClip.mediaLayout ?? 'cover'}
                onChange={(e) => {
                  if (!selectedClip || !project) return;
                  const track = project.tracks.find((t) =>
                    t.clips.some((c) => c.id === selectedClipId)
                  );
                  if (!track) return;
                  dispatch({
                    type: 'UPDATE_CLIP',
                    payload: {
                      trackId: track.id,
                      clip: {
                        ...selectedClip,
                        mediaLayout: e.target.value as ClipMediaLayout,
                      },
                    },
                  });
                }}
              >
                <option value="cover">Cover (rellenar lienzo)</option>
                <option value="contain">Contain (ver todo el clip)</option>
                <option value="fill">Fill (estirar al lienzo)</option>
              </select>
            </div>
            {selectedClip.type === 'video' && (
              <div className="space-y-1 border-t border-zinc-800/80 pt-2">
                <label className="flex cursor-pointer items-center gap-2 text-[11px] text-zinc-300">
                  <input
                    type="checkbox"
                    checked={!!selectedClip.trackFace}
                    onChange={(e) => {
                      if (!selectedClip || !project) return;
                      const track = project.tracks.find((t) =>
                        t.clips.some((c) => c.id === selectedClipId)
                      );
                      if (!track) return;
                      const on = e.target.checked;
                      dispatch({
                        type: 'UPDATE_CLIP',
                        payload: {
                          trackId: track.id,
                          clip: {
                            ...selectedClip,
                            trackFace: on,
                            faceFramingNudge: on ? selectedClip.faceFramingNudge : { x: 0, y: 0 },
                          },
                        },
                      });
                    }}
                  />
                  Track face (encuadre hacia la cara)
                </label>
                <p className="text-[10px] leading-snug text-zinc-600">
                  Usa la API Face Detector del navegador (p. ej. Chrome). El desplazamiento se aplica en preview y de
                  forma aproximada al exportar WebM.
                </p>
                {!isFaceDetectorSupported() && (
                  <p className="text-[10px] text-amber-500/90">
                    Este navegador no expone FaceDetector; la opción no tendrá efecto.
                  </p>
                )}
              </div>
            )}
            <div className="space-y-1 border-t border-zinc-800/80 pt-2">
              <h4 className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Recorte del archivo</h4>
              <p className="text-[10px] leading-snug text-zinc-500">
                Usa «Recortar» en el lienzo para arrastrar bordes.
              </p>
              <button
                type="button"
                className="rounded-md border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-[11px] text-zinc-200 hover:bg-zinc-750"
                onClick={() => {
                  if (!selectedClip || !project) return;
                  const track = project.tracks.find((t) =>
                    t.clips.some((c) => c.id === selectedClipId)
                  );
                  if (!track) return;
                  dispatch({
                    type: 'UPDATE_CLIP',
                    payload: {
                      trackId: track.id,
                      clip: { ...selectedClip, mediaCrop: { ...DEFAULT_MEDIA_CROP } },
                    },
                  });
                }}
              >
                Restablecer recorte
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-400 flex items-center gap-2">
            <icons.rotate size={14} />
            Rotation
          </h4>
          <Slider
            value={selectedClip.transform.rotation}
            min={-180}
            max={180}
            step={1}
            onChange={(v) => updateTransform('rotation', v)}
            label="°"
          />
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-400">Opacity</h4>
          <Slider
            value={selectedClip.transform.opacity * 100}
            min={0}
            max={100}
            step={1}
            onChange={(v) => updateTransform('opacity', v / 100)}
            label="%"
          />
        </div>

        {selectedClip.type === 'text' && (
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <icons.text size={14} />
              Text Content
            </h4>
            <Input
              value={selectedClip.text || ''}
              onChange={(e) => updateTextContent(e.target.value)}
              placeholder="Enter text..."
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-zinc-500">Font Size</label>
                <Input
                  type="number"
                  value={selectedClip.fontSize || 48}
                  onChange={(e) => {
                    if (!selectedClip || !project) return;
                    const track = project.tracks.find((t) =>
                      t.clips.some((c) => c.id === selectedClipId)
                    );
                    if (!track) return;
                    dispatch({
                      type: 'UPDATE_CLIP',
                      payload: {
                        trackId: track.id,
                        clip: { ...selectedClip, fontSize: Number(e.target.value) },
                      },
                    });
                  }}
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">Font Family</label>
                <select
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-2 text-xs text-zinc-200"
                  value={selectedClip.fontFamily || 'Inter'}
                  onChange={(e) => {
                    if (!selectedClip || !project) return;
                    const track = project.tracks.find((t) =>
                      t.clips.some((c) => c.id === selectedClipId)
                    );
                    if (!track) return;
                    dispatch({
                      type: 'UPDATE_CLIP',
                      payload: {
                        trackId: track.id,
                        clip: { ...selectedClip, fontFamily: e.target.value },
                      },
                    });
                  }}
                >
                  {MOTION_FONT_FAMILIES.map((family) => (
                    <option key={family} value={family}>
                      {family}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500">Color Palette</label>
              <div className="grid grid-cols-10 gap-1 mt-1">
                {MOTION_COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    className="h-5 w-5 rounded border border-zinc-700"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      if (!selectedClip || !project) return;
                      const track = project.tracks.find((t) =>
                        t.clips.some((c) => c.id === selectedClipId)
                      );
                      if (!track) return;
                      dispatch({
                        type: 'UPDATE_CLIP',
                        payload: {
                          trackId: track.id,
                          clip: { ...selectedClip, color },
                        },
                      });
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-400 flex items-center gap-2">
            <icons.clock size={14} />
            Timing
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-zinc-500">Start (s)</label>
              <Input
                type="number"
                step="0.1"
                value={selectedClip.startTime}
                readOnly
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500">Duration (s)</label>
              <Input
                type="number"
                step="0.1"
                value={selectedClip.duration}
                readOnly
              />
            </div>
          </div>
        </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {(project.zoomFragments ?? []).length === 0 && (
              <p className="text-[10px] text-zinc-600">Sin fragmentos de zoom.</p>
            )}
            {(project.zoomFragments ?? []).map((f) => (
              <div key={f.id} className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-2 space-y-2">
                <div className="flex justify-between items-center gap-1">
                  <span className="text-[10px] text-zinc-500 font-mono truncate">{f.id.slice(0, 12)}…</span>
                  <button
                    type="button"
                    className="text-[10px] text-red-400 hover:text-red-300"
                    onClick={() => {
                      if (!project) return;
                      updateProjectStyle({
                        zoomFragments: (project.zoomFragments ?? []).filter((x) => x.id !== f.id),
                      });
                    }}
                  >
                    Quitar
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <label className="text-[10px] text-zinc-500">Inicio (s)</label>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-8 text-xs"
                      value={f.startTime}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!project || Number.isNaN(v)) return;
                        const list = project.zoomFragments ?? [];
                        updateProjectStyle({
                          zoomFragments: list.map((x) =>
                            x.id === f.id ? { ...x, startTime: Math.max(0, v) } : x
                          ),
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500">Fin (s)</label>
                    <Input
                      type="number"
                      step="0.1"
                      className="h-8 text-xs"
                      value={f.endTime}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!project || Number.isNaN(v)) return;
                        const list = project.zoomFragments ?? [];
                        updateProjectStyle({
                          zoomFragments: list.map((x) =>
                            x.id === f.id ? { ...x, endTime: Math.max(x.startTime + 0.1, v) } : x
                          ),
                        });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500">Nivel 1–10 (más = más zoom)</label>
                  <Slider
                    value={f.zoomLevel}
                    min={1}
                    max={10}
                    step={0.5}
                    onChange={(v) => {
                      if (!project) return;
                      const list = project.zoomFragments ?? [];
                      updateProjectStyle({
                        zoomFragments: list.map((x) => (x.id === f.id ? { ...x, zoomLevel: v } : x)),
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500">Velocidad transición 1–10</label>
                  <Slider
                    value={f.speed}
                    min={1}
                    max={10}
                    step={0.5}
                    onChange={(v) => {
                      if (!project) return;
                      const list = project.zoomFragments ?? [];
                      updateProjectStyle({
                        zoomFragments: list.map((x) => (x.id === f.id ? { ...x, speed: v } : x)),
                      });
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <label className="text-[10px] text-zinc-500">Foco X %</label>
                    <Slider
                      value={f.focusX}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(v) => {
                        if (!project) return;
                        const list = project.zoomFragments ?? [];
                        updateProjectStyle({
                          zoomFragments: list.map((x) => (x.id === f.id ? { ...x, focusX: v } : x)),
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500">Foco Y %</label>
                    <Slider
                      value={f.focusY}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(v) => {
                        if (!project) return;
                        const list = project.zoomFragments ?? [];
                        updateProjectStyle({
                          zoomFragments: list.map((x) => (x.id === f.id ? { ...x, focusY: v } : x)),
                        });
                      }}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-[10px] text-zinc-400">
                  <input
                    type="checkbox"
                    checked={!!f.movementEnabled}
                    onChange={(e) => {
                      if (!project) return;
                      const list = project.zoomFragments ?? [];
                      updateProjectStyle({
                        zoomFragments: list.map((x) =>
                          x.id === f.id
                            ? {
                                ...x,
                                movementEnabled: e.target.checked,
                                movementEndX: x.movementEndX ?? x.focusX,
                                movementEndY: x.movementEndY ?? x.focusY,
                              }
                            : x
                        ),
                      });
                    }}
                  />
                  Mover foco durante la pausa
                </label>
                {f.movementEnabled && (
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <label className="text-[10px] text-zinc-500">Fin foco X %</label>
                      <Slider
                        value={f.movementEndX ?? f.focusX}
                        min={0}
                        max={100}
                        step={1}
                        onChange={(v) => {
                          if (!project) return;
                          const list = project.zoomFragments ?? [];
                          updateProjectStyle({
                            zoomFragments: list.map((x) =>
                              x.id === f.id ? { ...x, movementEndX: v } : x
                            ),
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500">Fin foco Y %</label>
                      <Slider
                        value={f.movementEndY ?? f.focusY}
                        min={0}
                        max={100}
                        step={1}
                        onChange={(v) => {
                          if (!project) return;
                          const list = project.zoomFragments ?? [];
                          updateProjectStyle({
                            zoomFragments: list.map((x) =>
                              x.id === f.id ? { ...x, movementEndY: v } : x
                            ),
                          });
                        }}
                      />
                    </div>
                  </div>
                )}
                <label className="flex items-center gap-2 text-[10px] text-zinc-400">
                  <input
                    type="checkbox"
                    checked={!!f.enable3D}
                    onChange={(e) => {
                      if (!project) return;
                      const list = project.zoomFragments ?? [];
                      updateProjectStyle({
                        zoomFragments: list.map((x) =>
                          x.id === f.id
                            ? {
                                ...x,
                                enable3D: e.target.checked,
                                perspective3DIntensity: x.perspective3DIntensity ?? 40,
                                perspective3DAngleX: x.perspective3DAngleX ?? 12,
                                perspective3DAngleY: x.perspective3DAngleY ?? -10,
                              }
                            : x
                        ),
                      });
                    }}
                  />
                  Perspectiva 3D (preview)
                </label>
                {f.enable3D && (
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-500">Intensidad 3D</label>
                    <Slider
                      value={f.perspective3DIntensity ?? 40}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(v) => {
                        if (!project) return;
                        const list = project.zoomFragments ?? [];
                        updateProjectStyle({
                          zoomFragments: list.map((x) =>
                            x.id === f.id ? { ...x, perspective3DIntensity: v } : x
                          ),
                        });
                      }}
                    />
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="text-[10px] text-zinc-500">Ángulo X</label>
                        <Input
                          type="number"
                          className="h-8 text-xs"
                          value={f.perspective3DAngleX ?? 0}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (!project || Number.isNaN(v)) return;
                            const list = project.zoomFragments ?? [];
                            updateProjectStyle({
                              zoomFragments: list.map((x) =>
                                x.id === f.id ? { ...x, perspective3DAngleX: v } : x
                              ),
                            });
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500">Ángulo Y</label>
                        <Input
                          type="number"
                          className="h-8 text-xs"
                          value={f.perspective3DAngleY ?? 0}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            if (!project || Number.isNaN(v)) return;
                            const list = project.zoomFragments ?? [];
                            updateProjectStyle({
                              zoomFragments: list.map((x) =>
                                x.id === f.id ? { ...x, perspective3DAngleY: v } : x
                              ),
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

        <div className="space-y-3 border-t border-zinc-800 pt-3">
          <h4 className="text-xs font-medium text-zinc-400 flex items-center gap-2">
            <icons.move size={14} />
            Cursor pantalla
          </h4>
          <p className="text-[10px] text-zinc-600 leading-snug">
            Cursor simulado encima del vídeo. Añade puntos en la línea de tiempo para animar la posición (porcentaje
            del lienzo).
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SCREEN_CURSOR_STYLE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.subtitle}
                className="rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-[10px] text-zinc-200 hover:border-sky-500/60 hover:bg-zinc-800"
                onClick={() => {
                  if (!project) return;
                  updateProjectStyle({
                    screenCursor: applyScreenCursorStylePreset(project.screenCursor, p.id),
                  });
                }}
              >
                {p.title}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[11px] text-zinc-300">
            <input
              type="checkbox"
              checked={(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).visible}
              onChange={(e) => {
                if (!project) return;
                const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                updateProjectStyle({ screenCursor: { ...sc, visible: e.target.checked } });
              }}
            />
            Mostrar cursor
          </label>
          <div>
            <label className="text-[10px] text-zinc-500">Estilo</label>
            <select
              className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
              value={(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).style}
              onChange={(e) => {
                if (!project) return;
                const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                updateProjectStyle({
                  screenCursor: {
                    ...sc,
                    style: e.target.value as ScreenCursorStyle,
                  },
                });
              }}
            >
              <option value="mac">Flecha (mac)</option>
              <option value="dot">Punto</option>
              <option value="ring">Anillo</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500">Efecto al clic</label>
            <select
              className="mt-1 w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200"
              value={(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).clickEffect}
              onChange={(e) => {
                if (!project) return;
                const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                updateProjectStyle({
                  screenCursor: {
                    ...sc,
                    clickEffect: e.target.value as ScreenCursorClickEffect,
                  },
                });
              }}
            >
              <option value="none">Ninguno</option>
              <option value="ring">Anillo</option>
              <option value="ripple">Onda</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500">Tamaño</label>
            <Slider
              value={(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).size}
              min={16}
              max={64}
              step={1}
              onChange={(v) => {
                if (!project) return;
                const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                updateProjectStyle({ screenCursor: { ...sc, size: v } });
              }}
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500">Suavizado trayectoria</label>
            <Slider
              value={(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).smoothing}
              min={0}
              max={100}
              step={5}
              onChange={(v) => {
                if (!project) return;
                const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                updateProjectStyle({ screenCursor: { ...sc, smoothing: v } });
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-zinc-500">Color</label>
              <Input
                type="color"
                className="h-8 p-0 border-zinc-700"
                value={(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).color}
                onChange={(e) => {
                  if (!project) return;
                  const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                  updateProjectStyle({ screenCursor: { ...sc, color: e.target.value } });
                }}
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500">Acento / clic</label>
              <Input
                type="color"
                className="h-8 p-0 border-zinc-700"
                value={(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).ringColor}
                onChange={(e) => {
                  if (!project) return;
                  const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                  updateProjectStyle({ screenCursor: { ...sc, ringColor: e.target.value } });
                }}
              />
            </div>
          </div>
          <button
            type="button"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-2 py-2 text-[11px] text-zinc-200 hover:bg-zinc-800"
            onClick={() => {
              if (!project) return;
              const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
              const nextKf = {
                id: generateId(),
                time: currentTime,
                x: 50,
                y: 50,
                clicking: false,
              };
              updateProjectStyle({
                screenCursor: {
                  ...sc,
                  keyframes: [...sc.keyframes, nextKf].sort((a, b) => a.time - b.time),
                },
              });
            }}
          >
            + Punto de cursor en cabezal (50%, 50%)
          </button>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).keyframes.map((k) => (
              <div
                key={k.id}
                className="flex items-center gap-1 text-[10px] text-zinc-400 border border-zinc-800 rounded px-1 py-1"
              >
                <span className="font-mono w-14 shrink-0">{k.time.toFixed(2)}s</span>
                <Input
                  type="number"
                  className="h-7 w-12 text-[10px] px-1"
                  value={k.x}
                  title="X %"
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!project || Number.isNaN(v)) return;
                    const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                    updateProjectStyle({
                      screenCursor: {
                        ...sc,
                        keyframes: sc.keyframes.map((x) =>
                          x.id === k.id ? { ...x, x: Math.max(0, Math.min(100, v)) } : x
                        ),
                      },
                    });
                  }}
                />
                <Input
                  type="number"
                  className="h-7 w-12 text-[10px] px-1"
                  value={k.y}
                  title="Y %"
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!project || Number.isNaN(v)) return;
                    const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                    updateProjectStyle({
                      screenCursor: {
                        ...sc,
                        keyframes: sc.keyframes.map((x) =>
                          x.id === k.id ? { ...x, y: Math.max(0, Math.min(100, v)) } : x
                        ),
                      },
                    });
                  }}
                />
                <label className="flex items-center gap-0.5 shrink-0" title="Clic">
                  <input
                    type="checkbox"
                    checked={!!k.clicking}
                    onChange={(e) => {
                      if (!project) return;
                      const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                      updateProjectStyle({
                        screenCursor: {
                          ...sc,
                          keyframes: sc.keyframes.map((x) =>
                            x.id === k.id ? { ...x, clicking: e.target.checked } : x
                          ),
                        },
                      });
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="ml-auto text-red-400 text-[10px]"
                  onClick={() => {
                    if (!project) return;
                    const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                    updateProjectStyle({
                      screenCursor: {
                        ...sc,
                        keyframes: sc.keyframes.filter((x) => x.id !== k.id),
                      },
                    });
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-medium text-zinc-400">Camera</h4>
          <label className="text-xs text-zinc-500">Default Zoom</label>
          <Slider
            value={project?.camera?.defaultZoom ?? 1}
            min={0.5}
            max={3}
            step={0.1}
            onChange={(v) =>
              updateProjectStyle({
                camera: {
                  ...(project?.camera ?? {
                    keyframes: [],
                    defaultZoom: 1,
                    defaultTiltX: 0,
                    defaultTiltY: 0,
                  }),
                  defaultZoom: v,
                },
              })
            }
            label="x"
          />
          <label className="text-xs text-zinc-500">Default Tilt X</label>
          <Slider
            value={project?.camera?.defaultTiltX ?? 0}
            min={-30}
            max={30}
            step={1}
            onChange={(v) =>
              updateProjectStyle({
                camera: {
                  ...(project?.camera ?? {
                    keyframes: [],
                    defaultZoom: 1,
                    defaultTiltX: 0,
                    defaultTiltY: 0,
                  }),
                  defaultTiltX: v,
                },
              })
            }
            label="deg"
          />
          <label className="text-xs text-zinc-500">Default Tilt Y</label>
          <Slider
            value={project?.camera?.defaultTiltY ?? 0}
            min={-30}
            max={30}
            step={1}
            onChange={(v) =>
              updateProjectStyle({
                camera: {
                  ...(project?.camera ?? {
                    keyframes: [],
                    defaultZoom: 1,
                    defaultTiltX: 0,
                    defaultTiltY: 0,
                  }),
                  defaultTiltY: v,
                },
              })
            }
            label="deg"
          />
        </div>
      </div>
    </div>
        ))}
    </div>
  );
}
