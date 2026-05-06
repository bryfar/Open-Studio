/**
 * Lee duración y tamaño del fotograma desde metadatos del vídeo (blob: o URL reproducible en el mismo origen).
 */
export function probeVideoMetadata(url: string): Promise<{
  duration: number;
  width?: number;
  height?: number;
} | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const finish = (result: { duration: number; width?: number; height?: number } | null) => {
      video.removeAttribute('src');
      video.load();
      resolve(result);
    };
    const onError = () => finish(null);
    video.onloadedmetadata = () => {
      const d = video.duration;
      if (!Number.isFinite(d) || d <= 0) {
        onError();
        return;
      }
      finish({
        duration: d,
        width: video.videoWidth || undefined,
        height: video.videoHeight || undefined,
      });
    };
    video.onerror = onError;
    video.src = url;
  });
}
