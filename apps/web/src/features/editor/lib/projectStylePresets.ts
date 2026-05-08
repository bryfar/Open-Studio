/**
 * Presets rápidos para zoom tipo tutorial (screen recording) y cursor,
 * inspirados en flujos de edición moderna, composición Remotion y zoom tipo tutorial.
 */
import type { Project, ScreenCursorOverlay, ZoomFragment } from '@/shared/types';
import { DEFAULT_SCREEN_CURSOR } from '@/shared/types';
import { createZoomFragment } from '@/features/editor/lib/zoomEngine';

export type TutorialZoomPresetMeta = {
  id: string;
  title: string;
  subtitle: string;
};

export const TUTORIAL_ZOOM_PRESETS: Array<
  TutorialZoomPresetMeta & { build: (project: Project, playhead: number) => ZoomFragment }
> = [
  {
    id: 'center-soft',
    title: 'Centro suave',
    subtitle: 'Zoom medio al centro del lienzo',
    build: (project, t) => {
      const start = Math.max(0, Math.min(t, project.duration - 0.2));
      const end = Math.min(project.duration, start + 2.4);
      const z = createZoomFragment(start, end);
      return { ...z, zoomLevel: 4, speed: 6, focusX: 50, focusY: 50 };
    },
  },
  {
    id: 'corner-code',
    title: 'Esquina código',
    subtitle: 'Foco arriba-izquierda (IDE / tutorial)',
    build: (project, t) => {
      const start = Math.max(0, Math.min(t, project.duration - 0.2));
      const end = Math.min(project.duration, start + 3);
      const z = createZoomFragment(start, end);
      return { ...z, zoomLevel: 6, speed: 5.5, focusX: 28, focusY: 32, movementEnabled: true, movementEndX: 72, movementEndY: 38 };
    },
  },
  {
    id: 'presenter',
    title: 'Presentador',
    subtitle: 'Foco inferior-centro (cámara / cara)',
    build: (project, t) => {
      const start = Math.max(0, Math.min(t, project.duration - 0.2));
      const end = Math.min(project.duration, start + 2.8);
      const z = createZoomFragment(start, end);
      return { ...z, zoomLevel: 5, speed: 6, focusX: 50, focusY: 78 };
    },
  },
  {
    id: 'dramatic-3d',
    title: 'Dramático 3D',
    subtitle: 'Zoom alto + ligera perspectiva (preview)',
    build: (project, t) => {
      const start = Math.max(0, Math.min(t, project.duration - 0.2));
      const end = Math.min(project.duration, start + 2.2);
      const z = createZoomFragment(start, end);
      return {
        ...z,
        zoomLevel: 7,
        speed: 5,
        focusX: 50,
        focusY: 45,
        enable3D: true,
        perspective3DIntensity: 55,
        perspective3DAngleX: 10,
        perspective3DAngleY: -12,
      };
    },
  },
];

export type ScreenCursorPresetMeta = {
  id: string;
  title: string;
  subtitle: string;
};

export const SCREEN_CURSOR_STYLE_PRESETS: Array<
  ScreenCursorPresetMeta & { patch: Partial<ScreenCursorOverlay> }
> = [
  {
    id: 'hidden',
    title: 'Oculto',
    subtitle: 'Sin cursor simulado',
    patch: { visible: false },
  },
  {
    id: 'tutorial-mac',
    title: 'Tutorial (mac)',
    subtitle: 'Flecha clásica, clic con anillo',
    patch: {
      visible: true,
      style: 'mac',
      size: 30,
      color: '#ffffff',
      ringColor: '#38bdf8',
      smoothing: 45,
      clickEffect: 'ring',
    },
  },
  {
    id: 'highlight-dot',
    title: 'Punto foco',
    subtitle: 'Ideal para demos rápidas',
    patch: {
      visible: true,
      style: 'dot',
      size: 22,
      color: '#f472b6',
      ringColor: '#f472b6',
      smoothing: 55,
      clickEffect: 'ripple',
    },
  },
  {
    id: 'precision-ring',
    title: 'Anillo precisión',
    subtitle: 'Área de clic clara (estilo screencast)',
    patch: {
      visible: true,
      style: 'ring',
      size: 36,
      color: '#e2e8f0',
      ringColor: '#22d3ee',
      smoothing: 40,
      clickEffect: 'ring',
    },
  },
];

export function applyTutorialZoomPreset(
  project: Project,
  playhead: number,
  presetId: string
): ZoomFragment | null {
  const preset = TUTORIAL_ZOOM_PRESETS.find((p) => p.id === presetId);
  if (!preset) return null;
  return preset.build(project, playhead);
}

export function applyScreenCursorStylePreset(
  base: ScreenCursorOverlay | undefined,
  presetId: string
): ScreenCursorOverlay {
  const preset = SCREEN_CURSOR_STYLE_PRESETS.find((p) => p.id === presetId);
  const merged: ScreenCursorOverlay = { ...DEFAULT_SCREEN_CURSOR, ...(base ?? {}) };
  if (!preset) return merged;
  return { ...merged, ...preset.patch };
}
