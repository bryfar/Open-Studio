import type { Project } from '@/shared/types';
import { createClip, createTrack } from '@/features/editor/store/editorStore';

export function exportProjectBridge(project: Project): { otioJson: string; mltXml: string } {
  const otioJson = JSON.stringify(
    {
      schema: 'OpenStudio-OTIO-Bridge',
      project: {
        id: project.id,
        name: project.name,
        fps: project.fps,
        width: project.width,
        height: project.height,
      },
      tracks: project.tracks.map((t) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        clips: t.clips.map((c) => ({
          id: c.id,
          name: c.name,
          start: c.startTime,
          duration: c.duration,
          mediaStart: c.mediaStart ?? 0,
          mediaUrl: c.mediaUrl ?? null,
        })),
      })),
    },
    null,
    2
  );

  const mltXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<mlt>',
    `  <profile width="${project.width}" height="${project.height}" frame_rate_num="${project.fps}" frame_rate_den="1" />`,
    `  <producer id="${project.id}" title="${project.name}" />`,
    ...project.tracks.map((t, idx) => `  <playlist id="track_${idx}" name="${t.name}" type="${t.type}" />`),
    '</mlt>',
  ].join('\n');

  return { otioJson, mltXml };
}

export function importProjectBridge(raw: string, fallbackName: string): Partial<Project> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as {
        project?: { name?: string; fps?: number; width?: number; height?: number };
        tracks?: Array<{ name?: string; type?: 'video' | 'audio' | 'text' | 'image' | 'background'; clips?: Array<{ name?: string; start?: number; duration?: number; mediaUrl?: string | null; mediaStart?: number }> }>;
      };
      const tracks =
        parsed.tracks?.map((t, idx) => {
          const track = createTrack(t.name || `Track ${idx + 1}`, t.type ?? 'video');
          return {
            ...track,
            clips: (t.clips ?? []).map((c, cIdx) => ({
              ...createClip(
                track.id,
                track.type,
                c.name || `${track.name} Clip ${cIdx + 1}`,
                c.start ?? 0,
                c.duration ?? 1,
                c.mediaUrl ?? undefined
              ),
              mediaStart: c.mediaStart ?? 0,
            })),
          };
        }) ?? [];
      return {
        name: parsed.project?.name || fallbackName,
        fps: parsed.project?.fps ?? 30,
        width: parsed.project?.width ?? 1920,
        height: parsed.project?.height ?? 1080,
        tracks,
      };
    } catch {
      return null;
    }
  }
  if (trimmed.startsWith('<mlt')) {
    const names = [...trimmed.matchAll(/playlist[^>]*name="([^"]+)"/g)].map((m) => m[1]);
    const tracks = names.map((name, idx) => createTrack(name || `Track ${idx + 1}`, idx === 0 ? 'video' : 'audio'));
    return { name: fallbackName, tracks };
  }
  return null;
}
