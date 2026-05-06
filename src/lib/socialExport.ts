import type { Mp4ExportOptions } from '@/lib/ffmpeg';
import type { SocialExportPlatform } from '@/types';

export type SocialVariantPreset = NonNullable<Mp4ExportOptions['preset']>;

export type SocialVariantProfile = {
  id: string;
  label: string;
  width: number;
  height: number;
  fps: number;
  videoBitrate: string;
  maxRate: string;
  bufferSize: string;
  audioBitrate: string;
  crf: number;
  preset: SocialVariantPreset;
};

/** Presets por plataforma (misma lista que usa el export MP4). */
export const SOCIAL_VARIANTS_BY_PLATFORM: Record<SocialExportPlatform, SocialVariantProfile[]> = {
  tiktok: [
    {
      id: 'vertical',
      label: 'Vertical 9:16 (For You)',
      width: 1080,
      height: 1920,
      fps: 30,
      videoBitrate: '10M',
      maxRate: '12M',
      bufferSize: '16M',
      audioBitrate: '192k',
      crf: 19,
      preset: 'medium',
    },
  ],
  facebook: [
    {
      id: 'reels',
      label: 'Reels / Stories 9:16',
      width: 1080,
      height: 1920,
      fps: 30,
      videoBitrate: '10M',
      maxRate: '12M',
      bufferSize: '16M',
      audioBitrate: '192k',
      crf: 19,
      preset: 'medium',
    },
    {
      id: 'feed_4_5',
      label: 'Feed 4:5',
      width: 1080,
      height: 1350,
      fps: 30,
      videoBitrate: '8M',
      maxRate: '10M',
      bufferSize: '14M',
      audioBitrate: '192k',
      crf: 20,
      preset: 'medium',
    },
    {
      id: 'feed_1_1',
      label: 'Feed 1:1',
      width: 1080,
      height: 1080,
      fps: 30,
      videoBitrate: '8M',
      maxRate: '10M',
      bufferSize: '14M',
      audioBitrate: '192k',
      crf: 20,
      preset: 'medium',
    },
    {
      id: 'landscape',
      label: 'Feed / in-stream 16:9',
      width: 1920,
      height: 1080,
      fps: 30,
      videoBitrate: '8M',
      maxRate: '10M',
      bufferSize: '14M',
      audioBitrate: '192k',
      crf: 20,
      preset: 'medium',
    },
  ],
  instagram: [
    {
      id: 'reel',
      label: 'Reels 9:16',
      width: 1080,
      height: 1920,
      fps: 30,
      videoBitrate: '10M',
      maxRate: '12M',
      bufferSize: '16M',
      audioBitrate: '192k',
      crf: 19,
      preset: 'medium',
    },
    {
      id: 'feed_square',
      label: 'Feed / carrusel 1:1',
      width: 1080,
      height: 1080,
      fps: 30,
      videoBitrate: '8M',
      maxRate: '10M',
      bufferSize: '14M',
      audioBitrate: '192k',
      crf: 20,
      preset: 'medium',
    },
    {
      id: 'feed_portrait',
      label: 'Feed 4:5',
      width: 1080,
      height: 1350,
      fps: 30,
      videoBitrate: '8M',
      maxRate: '10M',
      bufferSize: '14M',
      audioBitrate: '192k',
      crf: 20,
      preset: 'medium',
    },
    {
      id: 'landscape',
      label: 'Feed horizontal 16:9',
      width: 1920,
      height: 1080,
      fps: 30,
      videoBitrate: '8M',
      maxRate: '10M',
      bufferSize: '14M',
      audioBitrate: '192k',
      crf: 20,
      preset: 'medium',
    },
  ],
  youtube: [
    {
      id: 'video_1080',
      label: 'Video 16:9 (1080p)',
      width: 1920,
      height: 1080,
      fps: 30,
      videoBitrate: '12M',
      maxRate: '16M',
      bufferSize: '24M',
      audioBitrate: '320k',
      crf: 18,
      preset: 'medium',
    },
    {
      id: 'shorts',
      label: 'Shorts 9:16',
      width: 1080,
      height: 1920,
      fps: 30,
      videoBitrate: '10M',
      maxRate: '12M',
      bufferSize: '16M',
      audioBitrate: '192k',
      crf: 19,
      preset: 'medium',
    },
  ],
  linkedin: [
    {
      id: 'landscape',
      label: 'Video / publicación 16:9',
      width: 1920,
      height: 1080,
      fps: 30,
      videoBitrate: '8M',
      maxRate: '10M',
      bufferSize: '14M',
      audioBitrate: '192k',
      crf: 20,
      preset: 'medium',
    },
    {
      id: 'vertical',
      label: 'Vertical 9:16',
      width: 1080,
      height: 1920,
      fps: 30,
      videoBitrate: '8M',
      maxRate: '10M',
      bufferSize: '14M',
      audioBitrate: '192k',
      crf: 20,
      preset: 'medium',
    },
  ],
  x: [
    {
      id: 'landscape',
      label: 'Video 16:9',
      width: 1920,
      height: 1080,
      fps: 30,
      videoBitrate: '8M',
      maxRate: '10M',
      bufferSize: '14M',
      audioBitrate: '192k',
      crf: 20,
      preset: 'medium',
    },
    {
      id: 'vertical',
      label: 'Video vertical 9:16',
      width: 1080,
      height: 1920,
      fps: 30,
      videoBitrate: '8M',
      maxRate: '10M',
      bufferSize: '14M',
      audioBitrate: '192k',
      crf: 20,
      preset: 'medium',
    },
  ],
};

export function resolveSocialProfile(
  platform: SocialExportPlatform,
  variantId: string
): SocialVariantProfile | null {
  const list = SOCIAL_VARIANTS_BY_PLATFORM[platform];
  const found = list.find((v) => v.id === variantId);
  return found ?? list[0] ?? null;
}
