/**
 * Capa de escena: el fondo se resuelve desde la pista `background`
 * y el tiempo actual (clips en el timeline), no solo desde project.background.
 */
import type { BackgroundStyle, Clip, Project, Track } from '@/types';
import { DEFAULT_TRANSFORM } from '@/types';
import { generateId } from '@/lib/utils';

export function defaultProjectBackground(): BackgroundStyle {
  return {
    type: 'solid',
    color: '#0d0d0d',
    blur: 0,
    padding: 0,
    radius: 0,
    shadow: 0,
  };
}

export function createBackgroundClip(
  trackId: string,
  startTime: number,
  duration: number,
  style: BackgroundStyle,
  name = 'Background'
): Clip {
  return {
    id: generateId(),
    trackId,
    name,
    type: 'background',
    startTime,
    duration,
    volume: 1,
    speed: 1,
    reverse: false,
    timeMap: [],
    inTransition: null,
    outTransition: null,
    transform: { ...DEFAULT_TRANSFORM },
    effects: [],
    keyframes: {
      positionX: [],
      positionY: [],
      scaleX: [],
      scaleY: [],
      rotation: [],
      opacity: [],
    },
    sceneBackground: { ...style },
  };
}

function createBackgroundTrack(project: Project): Track {
  const trackId = generateId();
  const style = project.background ?? defaultProjectBackground();
  const clip = createBackgroundClip(trackId, 0, project.duration, style);
  return {
    id: trackId,
    name: 'Background',
    type: 'background',
    clips: [clip],
    muted: false,
    locked: false,
    visible: true,
  };
}

/** Garantiza una pista de fondo al final (capa inferior en composición). Idempotente. */
export function ensureBackgroundTrack(project: Project): Project {
  if (project.tracks.some((t) => t.type === 'background')) {
    return project;
  }
  return {
    ...project,
    tracks: [...project.tracks, createBackgroundTrack(project)],
  };
}

export function resolveBackgroundAtTime(
  project: Project,
  time: number
): { style: BackgroundStyle | null; clip: Clip | null } {
  const bgTrack = project.tracks.find((t) => t.type === 'background' && t.visible);
  if (!bgTrack) {
    const legacy = project.background;
    return { style: legacy ?? null, clip: null };
  }

  const clip = bgTrack.clips.find(
    (c) => time >= c.startTime && time < c.startTime + c.duration
  );
  if (!clip || clip.type !== 'background') {
    return { style: null, clip: null };
  }

  const style = clip.sceneBackground ?? project.background ?? null;
  return { style, clip };
}

/** Objetivo para editar desde la biblioteca o panel: clip bajo el playhead o el primero. */
export function findBackgroundEditTarget(
  project: Project,
  time: number
): { track: Track; clip: Clip } | null {
  const track = project.tracks.find((t) => t.type === 'background');
  if (!track || track.clips.length === 0) return null;

  const atTime = track.clips.find(
    (c) => time >= c.startTime && time < c.startTime + c.duration
  );
  const clip =
    atTime ??
    [...track.clips].sort((a, b) => a.startTime - b.startTime)[0] ??
    null;
  if (!clip || clip.type !== 'background') return null;
  return { track, clip };
}
