import type { EditorAction, MediaFile } from '@/types';
import { probeVideoMetadata } from '@/lib/probeVideoMetadata';

/** Tras añadir un vídeo a la biblioteca, completa duración/dimensiones si faltan. */
export function scheduleMediaFileMetadataProbe(
  dispatch: (action: EditorAction) => void,
  file: MediaFile
): void {
  if (!file.type.startsWith('video')) return;
  if (file.duration != null && file.duration > 0) return;
  void probeVideoMetadata(file.url).then((meta) => {
    if (!meta) return;
    dispatch({
      type: 'UPDATE_MEDIA_FILE',
      payload: {
        id: file.id,
        updates: {
          duration: meta.duration,
          ...(meta.width != null && meta.width > 0 ? { width: meta.width } : {}),
          ...(meta.height != null && meta.height > 0 ? { height: meta.height } : {}),
        },
      },
    });
  });
}
