import { createClip } from '@/stores/editorStore';
import type { Clip } from '@/types';

export const SHORT_FORM_TIMELINE_GAP_SEC = 0.25;

export const SHORT_FORM_DURATION_PRESETS = [15, 30, 60, 90] as const;

export function formatShortTimecode(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.floor((s % 1) * 100);
  return `${m}:${sec.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

export function createVideoSegmentClip(
  trackId: string,
  baseName: string,
  timelineStart: number,
  segmentDuration: number,
  mediaUrl: string,
  mediaMime: string,
  mediaStartSec: number
): Clip {
  const ms = Math.max(0, mediaStartSec);
  const clip = createClip(
    trackId,
    'video',
    `${baseName} · ${formatShortTimecode(ms)}`,
    timelineStart,
    Math.max(0.05, segmentDuration),
    mediaUrl,
    mediaMime
  );
  clip.mediaStart = ms;
  return clip;
}
