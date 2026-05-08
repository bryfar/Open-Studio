import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { Clip, MediaFile, Project } from '@/shared/types';
import { isDesktopRuntime } from '@/shared/platform/desktop';
import { resolveActiveMulticamSource } from '@/features/editor/lib/multicam';

let ffmpeg: FFmpeg | null = null;
let loaded = false;
let loadingPromise: Promise<boolean> | null = null;

/**
 * Worker del paquete `@ffmpeg/ffmpeg` cargado por URL absoluta.
 * Evita `new Worker(new URL("./worker.js", import.meta.url))` en el bundle, que Turbopack
 * no resuelve y produce: "Cannot find module as expression is too dynamic".
 * Mantener alineado con la versión instalada de `@ffmpeg/ffmpeg`.
 */
const FFMPEG_CLASS_WORKER_URL =
  'https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/esm/worker.js';
const LOCAL_FFMPEG_CLASS_WORKER_URL = '/ffmpeg/worker.js';

export interface Mp4ExportOptions {
  width?: number;
  height?: number;
  fps?: number;
  videoBitrate?: string;
  audioBitrate?: string;
  crf?: number;
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow';
  maxRate?: string;
  bufSize?: string;
}

export async function loadFFmpeg(
  onProgress?: (progress: number) => void
): Promise<boolean> {
  if (loaded && ffmpeg) return true;
  if (loadingPromise) return loadingPromise;
  if (typeof window === 'undefined') return false;

  loadingPromise = (async () => {
    ffmpeg = new FFmpeg();

    ffmpeg.on('progress', ({ progress }) => {
      onProgress?.(progress * 100);
    });

    try {
      const candidates = [
        '/ffmpeg',
        'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm',
        'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm',
      ];

      let lastError: unknown = null;
      for (const baseURL of candidates) {
        try {
          const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
          const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
          const workerURL = await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript');
          await ffmpeg.load({
            classWorkerURL: isDesktopRuntime() ? LOCAL_FFMPEG_CLASS_WORKER_URL : FFMPEG_CLASS_WORKER_URL,
            coreURL,
            wasmURL,
            workerURL,
          });
          loaded = true;
          return true;
        } catch (error) {
          lastError = error;
        }
      }

      console.error('Failed to load FFmpeg:', lastError);
      return false;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

export function isFFmpegLoaded(): boolean {
  return loaded;
}

export async function exportClipSegmentToMp4(
  clip: Clip,
  inputBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<Blob | null> {
  if (!ffmpeg || !loaded) {
    const success = await loadFFmpeg(onProgress);
    if (!success) return null;
  }

  try {
    const inputData = await fetchFile(inputBlob);
    await ffmpeg!.writeFile('input.webm', inputData);

    const ss = (clip.mediaStart ?? 0).toString();
    const t = clip.duration.toString();

    const args = [
      '-ss',
      ss,
      '-i',
      'input.webm',
      '-t',
      t,
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '23',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      'output.mp4',
    ];

    await ffmpeg!.exec(args);

    const outputData = await ffmpeg!.readFile('output.mp4');
    await ffmpeg!.deleteFile('input.webm');
    await ffmpeg!.deleteFile('output.mp4');

    return new Blob([outputData as unknown as BlobPart], { type: 'video/mp4' });
  } catch (error) {
    console.error('Clip export failed:', error);
    return null;
  }
}

interface TimelineSegment {
  clip: Clip;
  mediaFile: MediaFile;
  mediaStart: number;
}

function resolveTimeMapSpeed(clip: Clip): number {
  const map = clip.timeMap ?? [];
  if (!map.length) return Math.max(0.1, clip.speed ?? 1);
  const sorted = [...map].sort((a, b) => a.time - b.time);
  const avg = sorted.reduce((acc, k) => acc + Math.max(0.1, k.speed), 0) / sorted.length;
  return Math.max(0.1, avg || clip.speed || 1);
}

export function buildBasicCrossfadeFilter(durationSeconds: number = 0.25): string {
  return `acrossfade=d=${durationSeconds}:c1=tri:c2=tri`;
}

function resolveAudioProGain(project: Project): { master: number; ducking: number } {
  const ap = project.audioPro;
  if (!ap) return { master: 1, ducking: 1 };
  const master = Math.pow(10, ap.masterDb / 20);
  const ducking = ap.duckingEnabled ? Math.pow(10, ap.duckingAmountDb / 20) : 1;
  return { master, ducking };
}

function buildTimelineSegments(project: Project, mediaFiles: MediaFile[]): TimelineSegment[] {
  const videoTrack = project.tracks.find((t) => t.type === 'video');
  if (!videoTrack) return [];

  const byUrl = new Map<string, MediaFile>();
  for (const m of mediaFiles) {
    byUrl.set(m.url, m);
  }

  const clips = videoTrack.clips
    .filter((c) => !!c.mediaUrl)
    .slice()
    .sort((a, b) => a.startTime - b.startTime);

  const segments: TimelineSegment[] = [];
  for (const clip of clips) {
    const multicamSource = resolveActiveMulticamSource(project, mediaFiles, clip.startTime);
    const mediaFile = project.multicam?.enabled
      ? multicamSource.media ?? (clip.mediaUrl ? byUrl.get(clip.mediaUrl) : undefined)
      : clip.mediaUrl
      ? byUrl.get(clip.mediaUrl)
      : undefined;
    if (!mediaFile) continue;
    const mediaStart = Math.max(0, (clip.mediaStart ?? 0) + (project.multicam?.enabled ? multicamSource.sourceOffsetSec : 0));
    segments.push({ clip, mediaFile, mediaStart });
  }

  return segments;
}

export async function exportTimelineToMp4(
  project: Project,
  mediaFiles: MediaFile[],
  onProgress?: (progress: number) => void
): Promise<Blob | null> {
  if (!ffmpeg || !loaded) {
    const success = await loadFFmpeg(onProgress);
    if (!success) return null;
  }

  const segments = buildTimelineSegments(project, mediaFiles);
  if (!segments.length) {
    console.warn('No video segments found in timeline for export.');
    return null;
  }

  try {
    // 1) Generar archivos de segmento individuales
    let segmentIndex = 0;
    for (const { clip, mediaFile, mediaStart } of segments) {
      const response = await fetch(mediaFile.url);
      const inputBlob = await response.blob();
      const inputData = await fetchFile(inputBlob);

      const inputName = `input_${segmentIndex}.webm`;
      const outputName = `segment_${segmentIndex}.mp4`;

      await ffmpeg!.writeFile(inputName, inputData);

      const ss = mediaStart.toString();
      const t = clip.duration.toString();
      const speed = resolveTimeMapSpeed(clip);
      const safeAtempo = Math.min(2, Math.max(0.5, speed));
      const videoFilterParts: string[] = [];
      const audioFilterParts: string[] = [];
      if (speed !== 1) {
        videoFilterParts.push(`setpts=${(1 / speed).toFixed(4)}*PTS`);
        audioFilterParts.push(`atempo=${safeAtempo.toFixed(3)}`);
      }
      if (clip.reverse) {
        videoFilterParts.push('reverse');
        audioFilterParts.push('areverse');
      }

      const unsupportedTransition =
        (clip.inTransition && !['cut', 'fade', 'slide-left', 'slide-right'].includes(clip.inTransition.id)) ||
        (clip.outTransition && !['cut', 'fade', 'slide-left', 'slide-right'].includes(clip.outTransition.id));
      if (unsupportedTransition) {
        console.warn(
          `Transition fallback applied for clip "${clip.name}" during export (preset not supported yet).`
        );
      }

      const args = [
        '-ss',
        ss,
        '-i',
        inputName,
        '-t',
        t,
        ...(videoFilterParts.length ? ['-vf', videoFilterParts.join(',')] : []),
        ...(audioFilterParts.length ? ['-af', audioFilterParts.join(',')] : []),
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        outputName,
      ];

      await ffmpeg!.exec(args);
      await ffmpeg!.deleteFile(inputName);

      segmentIndex += 1;
    }

    // 2) Crear archivo de lista para concat demuxer
    const listContent = Array.from({ length: segmentIndex })
      .map((_, i) => `file segment_${i}.mp4`)
      .join('\n');
    const encoder = new TextEncoder();
    await ffmpeg!.writeFile('concat_list.txt', encoder.encode(listContent));

    // 3) Concatenar segmentos
    await ffmpeg!.exec([
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      'concat_list.txt',
      '-c',
      'copy',
      'output.mp4',
    ]);

    const outputData = await ffmpeg!.readFile('output.mp4');

    // 4) Limpieza
    for (let i = 0; i < segmentIndex; i += 1) {
      await ffmpeg!.deleteFile(`segment_${i}.mp4`);
    }
    await ffmpeg!.deleteFile('concat_list.txt');
    await ffmpeg!.deleteFile('output.mp4');

    return new Blob([outputData as unknown as BlobPart], { type: 'video/mp4' });
  } catch (error) {
    console.error('Timeline export failed:', error);
    return null;
  }
}

export async function mergeAudioTrackIntoVideo(
  videoBlob: Blob,
  project: Project,
  mediaFiles: MediaFile[],
  onProgress?: (progress: number) => void
): Promise<Blob | null> {
  if (!ffmpeg || !loaded) {
    const success = await loadFFmpeg(onProgress);
    if (!success) return null;
  }
  const audioTrack = project.tracks.find((t) => t.type === 'audio');
  if (!audioTrack || audioTrack.clips.length === 0) return videoBlob;

  try {
    const gains = resolveAudioProGain(project);
    await ffmpeg!.writeFile('mix_input_video.mp4', await fetchFile(videoBlob));
    const byUrl = new Map(mediaFiles.map((m) => [m.url, m]));
    const audioClips = audioTrack.clips
      .filter((c) => !!c.mediaUrl && byUrl.has(c.mediaUrl))
      .slice()
      .sort((a, b) => a.startTime - b.startTime);
    if (!audioClips.length) return videoBlob;

    let idx = 0;
    for (const clip of audioClips) {
      const media = byUrl.get(clip.mediaUrl!);
      if (!media) continue;
      const resp = await fetch(media.url);
      await ffmpeg!.writeFile(`mix_in_${idx}.webm`, await fetchFile(await resp.blob()));
      await ffmpeg!.exec([
        '-ss',
        String(clip.mediaStart ?? 0),
        '-i',
        `mix_in_${idx}.webm`,
        '-t',
        String(clip.duration),
        '-filter:a',
        `volume=${(clip.volume ?? 1) * gains.master * gains.ducking}`,
        `mix_seg_${idx}.aac`,
      ]);
      await ffmpeg!.deleteFile(`mix_in_${idx}.webm`);
      idx += 1;
    }
    if (idx === 0) return videoBlob;

    const listContent = Array.from({ length: idx })
      .map((_, i) => `file mix_seg_${i}.aac`)
      .join('\n');
    await ffmpeg!.writeFile('mix_concat.txt', new TextEncoder().encode(listContent));
    await ffmpeg!.exec([
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      'mix_concat.txt',
      '-c',
      'copy',
      'mix_audio.aac',
    ]);

    await ffmpeg!.exec([
      '-i',
      'mix_input_video.mp4',
      '-i',
      'mix_audio.aac',
      '-filter_complex',
      '[0:a][1:a]amix=inputs=2:duration=first[aout]',
      '-map',
      '0:v',
      '-map',
      '[aout]',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      'mix_output.mp4',
    ]);

    const out = await ffmpeg!.readFile('mix_output.mp4');
    await ffmpeg!.deleteFile('mix_input_video.mp4');
    await ffmpeg!.deleteFile('mix_audio.aac');
    await ffmpeg!.deleteFile('mix_concat.txt');
    await ffmpeg!.deleteFile('mix_output.mp4');
    for (let i = 0; i < idx; i += 1) {
      await ffmpeg!.deleteFile(`mix_seg_${i}.aac`);
    }
    return new Blob([out as unknown as BlobPart], { type: 'video/mp4' });
  } catch (error) {
    console.error('Audio mix failed:', error);
    return videoBlob;
  }
}

export async function convertToMp4(
  inputBlob: Blob,
  onProgress?: (progress: number) => void,
  options?: Mp4ExportOptions
): Promise<Blob | null> {
  if (!ffmpeg || !loaded) {
    const success = await loadFFmpeg(onProgress);
    if (!success) return null;
  }

  try {
    const inputData = await fetchFile(inputBlob);
    await ffmpeg!.writeFile('input.webm', inputData);

    const videoFilters: string[] = [];
    if (options?.width && options?.height) {
      videoFilters.push(
        `scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease,pad=${options.width}:${options.height}:(ow-iw)/2:(oh-ih)/2`
      );
    }
    if (options?.fps) {
      videoFilters.push(`fps=${options.fps}`);
    }

    const args = [
      '-i',
      'input.webm',
      ...(videoFilters.length ? ['-vf', videoFilters.join(',')] : []),
      '-c:v',
      'libx264',
      '-preset',
      options?.preset ?? 'fast',
      '-crf',
      String(options?.crf ?? 23),
      ...(options?.videoBitrate ? ['-b:v', options.videoBitrate] : []),
      ...(options?.maxRate ? ['-maxrate', options.maxRate] : []),
      ...(options?.bufSize ? ['-bufsize', options.bufSize] : []),
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-c:a',
      'aac',
      '-b:a',
      options?.audioBitrate ?? '128k',
      'output.mp4',
    ];

    await ffmpeg!.exec(args);

    const outputData = await ffmpeg!.readFile('output.mp4');
    await ffmpeg!.deleteFile('input.webm');
    await ffmpeg!.deleteFile('output.mp4');

    return new Blob([outputData as unknown as BlobPart], { type: 'video/mp4' });
  } catch (error) {
    console.error('Conversion failed:', error);
    return null;
  }
}

export async function convertToGif(
  inputBlob: Blob,
  width: number = 480,
  onProgress?: (progress: number) => void
): Promise<Blob | null> {
  if (!ffmpeg || !loaded) {
    const success = await loadFFmpeg(onProgress);
    if (!success) return null;
  }

  try {
    const inputData = await fetchFile(inputBlob);
    await ffmpeg!.writeFile('input.webm', inputData);

    await ffmpeg!.exec([
      '-i', 'input.webm',
      '-vf', `fps=15,scale=${width}:-1:flags=lanczos`,
      'output.gif',
    ]);

    const outputData = await ffmpeg!.readFile('output.gif');
    await ffmpeg!.deleteFile('input.webm');
    await ffmpeg!.deleteFile('output.gif');

    return new Blob([outputData as unknown as BlobPart], { type: 'image/gif' });
  } catch (error) {
    console.error('GIF conversion failed:', error);
    return null;
  }
}

export async function convertToWebM(
  inputBlob: Blob,
  withAlpha: boolean = false,
  onProgress?: (progress: number) => void,
  scaleFactor?: number
): Promise<Blob | null> {
  if (!ffmpeg || !loaded) {
    const success = await loadFFmpeg(onProgress);
    if (!success) return null;
  }

  try {
    const inputData = await fetchFile(inputBlob);
    await ffmpeg!.writeFile('input_for_webm.webm', inputData);
    const filters: string[] = [];
    if (scaleFactor && scaleFactor > 0 && scaleFactor < 1) {
      filters.push(`scale=iw*${scaleFactor}:ih*${scaleFactor}`);
    }
    await ffmpeg!.exec([
      '-i',
      'input_for_webm.webm',
      ...(filters.length ? ['-vf', filters.join(',')] : []),
      '-c:v',
      'libvpx-vp9',
      ...(withAlpha ? ['-pix_fmt', 'yuva420p'] : []),
      '-b:v',
      '2M',
      '-c:a',
      'libopus',
      'output.webm',
    ]);
    const outputData = await ffmpeg!.readFile('output.webm');
    await ffmpeg!.deleteFile('input_for_webm.webm');
    await ffmpeg!.deleteFile('output.webm');
    return new Blob([outputData as unknown as BlobPart], { type: 'video/webm' });
  } catch (error) {
    console.error('WebM conversion failed:', error);
    return null;
  }
}

export async function exportFrameImage(
  inputBlob: Blob,
  format: 'png' | 'webp' | 'jpg' | 'avif' = 'png',
  onProgress?: (progress: number) => void
): Promise<Blob | null> {
  if (!ffmpeg || !loaded) {
    const success = await loadFFmpeg(onProgress);
    if (!success) return null;
  }

  try {
    const inputData = await fetchFile(inputBlob);
    await ffmpeg!.writeFile('input_for_image.webm', inputData);
    const outputName = `frame.${format}`;
    await ffmpeg!.exec(['-i', 'input_for_image.webm', '-frames:v', '1', outputName]);
    const outputData = await ffmpeg!.readFile(outputName);
    await ffmpeg!.deleteFile('input_for_image.webm');
    await ffmpeg!.deleteFile(outputName);
    const mime =
      format === 'jpg'
        ? 'image/jpeg'
        : format === 'png'
        ? 'image/png'
        : format === 'webp'
        ? 'image/webp'
        : 'image/avif';
    return new Blob([outputData as unknown as BlobPart], { type: mime });
  } catch (error) {
    console.error('Frame export failed:', error);
    return null;
  }
}