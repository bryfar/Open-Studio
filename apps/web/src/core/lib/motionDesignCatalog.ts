import type { Clip, Keyframe } from '@/shared/types';
import { generateId } from '@/shared/utils';

export interface MotionDesignPreset {
  id: string;
  name: string;
  description: string;
}

export const MOTION_DESIGN_PRESETS: MotionDesignPreset[] = [
  { id: 'fade-in-up', name: 'Fade In Up', description: 'Entrada suave desde abajo (Motion)' },
  { id: 'fade-in-down', name: 'Fade In Down', description: 'Desde arriba — útil para títulos' },
  { id: 'pop-in', name: 'Pop In', description: 'Escala suave tipo sticker' },
  { id: 'bounce-in', name: 'Bounce In', description: 'Rebote corto al aparecer (Remotion-style overshoot)' },
  { id: 'slide-in-left', name: 'Slide In Left', description: 'Desde la izquierda' },
  { id: 'slide-in-right', name: 'Slide In Right', description: 'Desde la derecha' },
  { id: 'scale-in', name: 'Scale In', description: 'Zoom-in desde 0 % sin fade' },
  { id: 'drift-out', name: 'Drift Out', description: 'Salida suave hacia arriba' },
  { id: 'ken-burns', name: 'Ken Burns', description: 'Zoom lento en todo el clip (foto / B-roll)' },
];

export const MOTION_FONT_FAMILIES: string[] = [
  'Inter',
  'Poppins',
  'Montserrat',
  'Oswald',
  'Playfair Display',
  'Bebas Neue',
  'Space Grotesk',
  'Fira Code',
];

export const MOTION_FONT_FAMILY_TO_CSS: Record<string, string> = {
  Inter: 'var(--font-inter)',
  Poppins: 'var(--font-poppins)',
  Montserrat: 'var(--font-montserrat)',
  Oswald: 'var(--font-oswald)',
  'Playfair Display': 'var(--font-playfair)',
  'Bebas Neue': 'var(--font-bebas)',
  'Space Grotesk': 'var(--font-space-grotesk)',
  'Fira Code': 'var(--font-fira-code)',
};

export const MOTION_COLOR_PALETTE: string[] = [
  '#ffffff',
  '#f8fafc',
  '#e2e8f0',
  '#94a3b8',
  '#0ea5e9',
  '#22d3ee',
  '#6366f1',
  '#8b5cf6',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#38bdf8',
];

function kf(time: number, value: number, easing: Keyframe['easing']): Keyframe {
  return { id: generateId(), time, value, easing };
}

export function applyMotionPresetToClip(clip: Clip, presetId: string): Clip {
  const intro = Math.min(0.6, Math.max(0.2, clip.duration * 0.2));
  const outroStart = Math.max(0, clip.duration - intro);

  if (presetId === 'fade-in-up') {
    return {
      ...clip,
      keyframes: {
        ...clip.keyframes,
        positionY: [kf(0, clip.transform.y + 50, 'ease-out'), kf(intro, clip.transform.y, 'ease-out')],
        opacity: [kf(0, 0, 'linear'), kf(intro, clip.transform.opacity, 'ease-in-out')],
      },
    };
  }

  if (presetId === 'fade-in-down') {
    return {
      ...clip,
      keyframes: {
        ...clip.keyframes,
        positionY: [kf(0, clip.transform.y - 50, 'ease-out'), kf(intro, clip.transform.y, 'ease-out')],
        opacity: [kf(0, 0, 'linear'), kf(intro, clip.transform.opacity, 'ease-in-out')],
      },
    };
  }

  if (presetId === 'pop-in') {
    return {
      ...clip,
      keyframes: {
        ...clip.keyframes,
        scaleX: [kf(0, 0.75, 'ease-out'), kf(intro, clip.transform.scaleX, 'ease-in-out')],
        scaleY: [kf(0, 0.75, 'ease-out'), kf(intro, clip.transform.scaleY, 'ease-in-out')],
        opacity: [kf(0, 0, 'linear'), kf(intro * 0.7, clip.transform.opacity, 'ease-in-out')],
      },
    };
  }

  if (presetId === 'slide-in-left') {
    return {
      ...clip,
      keyframes: {
        ...clip.keyframes,
        positionX: [kf(0, clip.transform.x - 90, 'ease-out'), kf(intro, clip.transform.x, 'ease-in-out')],
        opacity: [kf(0, 0, 'linear'), kf(intro, clip.transform.opacity, 'ease-in-out')],
      },
    };
  }

  if (presetId === 'slide-in-right') {
    return {
      ...clip,
      keyframes: {
        ...clip.keyframes,
        positionX: [kf(0, clip.transform.x + 90, 'ease-out'), kf(intro, clip.transform.x, 'ease-in-out')],
        opacity: [kf(0, 0, 'linear'), kf(intro, clip.transform.opacity, 'ease-in-out')],
      },
    };
  }

  if (presetId === 'scale-in') {
    return {
      ...clip,
      keyframes: {
        ...clip.keyframes,
        scaleX: [kf(0, 0.4, 'ease-out'), kf(intro, clip.transform.scaleX, 'ease-in-out')],
        scaleY: [kf(0, 0.4, 'ease-out'), kf(intro, clip.transform.scaleY, 'ease-in-out')],
        opacity: [kf(0, clip.transform.opacity, 'linear'), kf(intro, clip.transform.opacity, 'linear')],
      },
    };
  }

  if (presetId === 'bounce-in') {
    const mid = intro * 0.55;
    return {
      ...clip,
      keyframes: {
        ...clip.keyframes,
        scaleX: [
          kf(0, clip.transform.scaleX * 0.82, 'ease-out'),
          kf(mid, clip.transform.scaleX * 1.06, 'overshoot'),
          kf(intro, clip.transform.scaleX, 'ease-in-out'),
        ],
        scaleY: [
          kf(0, clip.transform.scaleY * 0.82, 'ease-out'),
          kf(mid, clip.transform.scaleY * 1.06, 'overshoot'),
          kf(intro, clip.transform.scaleY, 'ease-in-out'),
        ],
        opacity: [kf(0, 0, 'linear'), kf(intro * 0.35, clip.transform.opacity, 'ease-out')],
      },
    };
  }

  if (presetId === 'ken-burns') {
    const sx = clip.transform.scaleX;
    const sy = clip.transform.scaleY;
    return {
      ...clip,
      keyframes: {
        ...clip.keyframes,
        scaleX: [kf(0, sx, 'linear'), kf(clip.duration, sx * 1.1, 'linear')],
        scaleY: [kf(0, sy, 'linear'), kf(clip.duration, sy * 1.1, 'linear')],
        positionX: [kf(0, clip.transform.x, 'linear'), kf(clip.duration, clip.transform.x - 12, 'linear')],
      },
    };
  }

  if (presetId === 'drift-out') {
    return {
      ...clip,
      keyframes: {
        ...clip.keyframes,
        positionY: [kf(outroStart, clip.transform.y, 'ease-in-out'), kf(clip.duration, clip.transform.y - 30, 'ease-in')],
        opacity: [kf(outroStart, clip.transform.opacity, 'linear'), kf(clip.duration, 0, 'ease-in')],
      },
    };
  }

  return clip;
}
