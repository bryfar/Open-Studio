import type { MediaFile, Project } from '@/shared/types';

type AngleCut = { id: string; time: number; angle: number };

function normalizeAngleCuts(cuts: AngleCut[] | undefined): AngleCut[] {
  if (!cuts || cuts.length === 0) return [];
  return [...cuts]
    .filter((cut) => Number.isFinite(cut.time) && Number.isFinite(cut.angle))
    .sort((a, b) => a.time - b.time);
}

function getActiveAngleAtTime(project: Project, time: number): number {
  const multicam = project.multicam;
  if (!multicam?.enabled) return 1;
  const safeTime = Math.max(0, time);
  const cuts = normalizeAngleCuts(multicam.angleCuts);
  let activeAngle = Math.max(1, multicam.activeAngle || 1);
  for (const cut of cuts) {
    if (cut.time <= safeTime) {
      activeAngle = Math.max(1, cut.angle || 1);
      continue;
    }
    break;
  }
  return activeAngle;
}

function getCameraSources(mediaFiles: MediaFile[]): MediaFile[] {
  return mediaFiles
    .filter((m) => m.type.startsWith('video'))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface ActiveMulticamSource {
  media: MediaFile | null;
  angle: number;
  sourceOffsetSec: number;
}

export function resolveActiveMulticamSource(
  project: Project | null,
  mediaFiles: MediaFile[],
  timelineTime: number
): ActiveMulticamSource {
  if (!project?.multicam?.enabled) {
    return { media: null, angle: 1, sourceOffsetSec: 0 };
  }
  const sources = getCameraSources(mediaFiles);
  if (!sources.length) {
    return { media: null, angle: 1, sourceOffsetSec: 0 };
  }
  const angle = getActiveAngleAtTime(project, timelineTime);
  const index = Math.max(0, Math.min(sources.length - 1, angle - 1));
  const media = sources[index] ?? null;
  const syncOffsetFromMedia = media?.cameraOffsetSec ?? 0;
  const syncOffsetFromProject = (media?.id && project.multicam.syncOffsets?.[media.id]) ?? syncOffsetFromMedia;
  const numericOffset =
    typeof syncOffsetFromProject === 'number' ? syncOffsetFromProject : Number(syncOffsetFromProject);
  return { media, angle, sourceOffsetSec: Number.isFinite(numericOffset) ? numericOffset : 0 };
}
