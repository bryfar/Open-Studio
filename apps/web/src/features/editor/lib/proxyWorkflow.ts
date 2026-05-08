import type { MediaFile } from '@/shared/types';
import { convertToWebM } from '@/features/editor/lib/ffmpeg';

export async function buildProxyForMedia(
  media: MediaFile,
  scale: number
): Promise<Pick<MediaFile, 'proxyUrl' | 'proxyReady'>> {
  if (!media.type.startsWith('video') || !media.url) {
    return { proxyReady: false };
  }

  try {
    const src = await fetch(media.url);
    const blob = await src.blob();
    const safeScale = Math.max(0.2, Math.min(1, scale));
    const proxyBlob = await convertToWebM(blob, false, undefined, safeScale);
    if (!proxyBlob) return { proxyReady: false };
    const proxyUrl = URL.createObjectURL(proxyBlob);
    void scale;
    return { proxyUrl, proxyReady: true };
  } catch {
    return { proxyReady: false };
  }
}
