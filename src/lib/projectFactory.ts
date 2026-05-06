import type { Project, SocialExportSettings, Track } from '@/types';
import { PRESETS, DEFAULT_SCREEN_CURSOR, DEFAULT_PRO_EDITOR } from '@/types';
import { generateId } from '@/lib/utils';
import { resolveSocialProfile } from '@/lib/socialExport';

/** Formato de lienzo (horizontal, vertical, cuadrado, 4:5 tipo redes). */
export type ProjectAspectFormat = '16:9' | '9:16' | '1:1' | '4:5';

export interface BlankProjectOptions {
  fps?: number;
  duration?: number;
  /** Color sólido del fondo de escena inicial. */
  backgroundColor?: string;
  /** Si se indica, el lienzo y FPS siguen el preset de redes (ancho/alto/FPS del perfil). */
  socialExport?: SocialExportSettings;
}

export function getDimensionsForAspect(format: ProjectAspectFormat): { width: number; height: number } {
  if (format === '9:16') return { width: 1080, height: 1920 };
  if (format === '1:1') return { width: 1080, height: 1080 };
  if (format === '4:5') return { width: 1080, height: 1350 };
  return { width: PRESETS['1080p'].width, height: PRESETS['1080p'].height };
}

/**
 * Completa campos opcionales que algunas plantillas no rellenan (fondo, marco, cámara, cursor).
 */
export function ensureMotionEditorProjectDefaults(project: Project): Project {
  const defaults = createBlankProject('__tmp__', '16:9');
  return {
    ...defaults,
    ...project,
    id: project.id,
    name: project.name,
    width: project.width,
    height: project.height,
    fps: project.fps,
    duration: project.duration,
    tracks: project.tracks,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    background: project.background ?? defaults.background,
    deviceFrame: project.deviceFrame ?? defaults.deviceFrame,
    camera: project.camera ?? defaults.camera,
    zoomFragments: project.zoomFragments ?? defaults.zoomFragments,
    screenCursor: project.screenCursor ?? defaults.screenCursor,
    socialExport: project.socialExport ?? defaults.socialExport,
    proEditor: project.proEditor ?? defaults.proEditor,
  };
}

export function createBlankProject(
  name: string,
  format: ProjectAspectFormat = '16:9',
  options?: BlankProjectOptions
): Project {
  const duration = options?.duration ?? 60;
  const bgColor = options?.backgroundColor ?? '#0d0d0d';
  const profile = options?.socialExport
    ? resolveSocialProfile(options.socialExport.platform, options.socialExport.variantId)
    : null;
  const dims = profile
    ? { width: profile.width, height: profile.height }
    : getDimensionsForAspect(format);
  const fps = profile ? profile.fps : options?.fps ?? 30;

  const videoTrack: Track = {
    id: generateId(),
    name: 'Video Track 1',
    type: 'video',
    clips: [],
    muted: false,
    locked: false,
    visible: true,
  };
  const audioTrack: Track = {
    id: generateId(),
    name: 'Audio Track 1',
    type: 'audio',
    clips: [],
    muted: false,
    locked: false,
    visible: true,
  };
  const textTrack: Track = {
    id: generateId(),
    name: 'Text Track 1',
    type: 'text',
    clips: [],
    muted: false,
    locked: false,
    visible: true,
  };

  return {
    id: generateId(),
    name,
    width: dims.width,
    height: dims.height,
    fps,
    duration,
    tracks: [videoTrack, audioTrack, textTrack],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    background: {
      type: 'solid',
      color: bgColor,
      blur: 0,
    },
    deviceFrame: {
      enabled: false,
      type: 'none',
      padding: 24,
      radius: 16,
      shadow: 24,
    },
    camera: {
      keyframes: [],
      defaultZoom: 1,
      defaultTiltX: 0,
      defaultTiltY: 0,
    },
    zoomFragments: [],
    screenCursor: { ...DEFAULT_SCREEN_CURSOR, keyframes: [] },
    proEditor: { ...DEFAULT_PRO_EDITOR },
    ...(options?.socialExport ? { socialExport: options.socialExport } : {}),
  };
}
