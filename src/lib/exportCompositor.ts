import type { BackgroundStyle, Clip, MediaFile, Project } from '@/types';
import { DEFAULT_SCREEN_CURSOR } from '@/types';
import { getClipEffectiveMediaTime, interpolateCamera, interpolateKeyframes } from '@/lib/animation';
import {
  applyClipPreviewToCanvas2D,
  buildClipEffectsCssFilter,
  computeLayoutDestinationRect,
  computeTransitionPreview,
  getVideoDrawRectFromCrop,
  resolveClipMediaLayout,
} from '@/lib/clipPreviewStyle';
import { resolveBackgroundAtTime } from '@/lib/sceneTimeline';
import { calculateSmoothZoom } from '@/lib/zoomEngine';
import { drawScreenCursor, interpolateCursorAtTime } from '@/lib/cursorOverlay';

const MAX_EXPORT_SECONDS = 120;

function getActiveClipAtTime(clips: Clip[], time: number): Clip | null {
  return clips.find((c) => time >= c.startTime && time < c.startTime + c.duration) ?? null;
}

async function ensureVideoElement(url: string): Promise<HTMLVideoElement> {
  const video = document.createElement('video');
  video.src = url;
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;
  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error(`Failed loading video: ${url}`));
  });
  return video;
}

async function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  await new Promise<void>((resolve) => {
    const done = () => {
      video.removeEventListener('seeked', done);
      resolve();
    };
    video.addEventListener('seeked', done);
    video.currentTime = Math.max(0, time);
  });
}

function drawProjectBackground(
  ctx: CanvasRenderingContext2D,
  project: Project,
  bg: BackgroundStyle | null,
  backgroundImage: HTMLImageElement | null
): void {
  const w = project.width;
  const h = project.height;

  if (!bg || bg.type === 'none') {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);
    return;
  }

  if (bg.type === 'image' && backgroundImage?.complete) {
    ctx.drawImage(backgroundImage, 0, 0, w, h);
    return;
  }

  if (bg.type === 'gradient') {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, bg.gradientFrom ?? bg.color);
    g.addColorStop(1, bg.gradientTo ?? '#6366f1');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  ctx.fillStyle = bg.color;
  ctx.fillRect(0, 0, w, h);
}

function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  clip: Clip,
  relTime: number
): void {
  const x = interpolateKeyframes(clip.keyframes.positionX, relTime, clip.transform.x);
  const y = interpolateKeyframes(clip.keyframes.positionY, relTime, clip.transform.y);
  const scaleX = interpolateKeyframes(clip.keyframes.scaleX, relTime, clip.transform.scaleX);
  const scaleY = interpolateKeyframes(clip.keyframes.scaleY, relTime, clip.transform.scaleY);
  const rotation = interpolateKeyframes(clip.keyframes.rotation, relTime, clip.transform.rotation);
  const opacity = interpolateKeyframes(clip.keyframes.opacity, relTime, clip.transform.opacity);

  const text = clip.text || 'Text';
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scaleX, scaleY);
  ctx.globalAlpha = opacity;
  ctx.fillStyle = clip.color || '#ffffff';
  ctx.font = `${clip.fontSize || 48}px ${clip.fontFamily || 'Inter, sans-serif'}`;
  ctx.textBaseline = 'top';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawImageOverlay(
  ctx: CanvasRenderingContext2D,
  clip: Clip,
  relTime: number,
  imageByUrl: Map<string, HTMLImageElement>
): void {
  if (!clip.mediaUrl) return;
  const img = imageByUrl.get(clip.mediaUrl);
  if (!img) return;
  const x = interpolateKeyframes(clip.keyframes.positionX, relTime, clip.transform.x);
  const y = interpolateKeyframes(clip.keyframes.positionY, relTime, clip.transform.y);
  const scaleX = interpolateKeyframes(clip.keyframes.scaleX, relTime, clip.transform.scaleX);
  const scaleY = interpolateKeyframes(clip.keyframes.scaleY, relTime, clip.transform.scaleY);
  const rotation = interpolateKeyframes(clip.keyframes.rotation, relTime, clip.transform.rotation);
  const opacity = interpolateKeyframes(clip.keyframes.opacity, relTime, clip.transform.opacity);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scaleX, scaleY);
  ctx.globalAlpha = opacity;
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

export async function renderCompositedWebM(
  project: Project,
  mediaFiles: MediaFile[],
  onProgress?: (progress: number) => void
): Promise<Blob | null> {
  const duration = Math.min(project.duration, MAX_EXPORT_SECONDS);
  if (duration <= 0) return null;

  const fps = Math.min(project.fps || 30, 30);
  const frameCount = Math.max(1, Math.floor(duration * fps));
  const canvas = document.createElement('canvas');
  canvas.width = project.width;
  canvas.height = project.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const videoTrack = project.tracks.find((t) => t.type === 'video');
  const videoClips = [...(videoTrack?.clips ?? [])].sort((a, b) => a.startTime - b.startTime);
  const textClips = project.tracks
    .filter((t) => t.type === 'text')
    .flatMap((t) => t.clips);
  const imageClips = project.tracks
    .filter((t) => t.type === 'image')
    .flatMap((t) => t.clips);

  const videoByUrl = new Map<string, HTMLVideoElement>();
  const imageByUrl = new Map<string, HTMLImageElement>();

  const neededVideoUrls = new Set(videoClips.map((c) => c.mediaUrl).filter(Boolean) as string[]);
  for (const media of mediaFiles) {
    if (neededVideoUrls.has(media.url)) {
      videoByUrl.set(media.url, await ensureVideoElement(media.url));
    }
  }

  for (const clip of imageClips) {
    if (!clip.mediaUrl || imageByUrl.has(clip.mediaUrl)) continue;
    const img = new Image();
    img.src = clip.mediaUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed loading image: ${clip.mediaUrl}`));
    });
    imageByUrl.set(clip.mediaUrl, img);
  }

  const backgroundImageUrls = new Set<string>();
  if (project.background?.type === 'image' && project.background.imageUrl) {
    backgroundImageUrls.add(project.background.imageUrl);
  }
  for (const t of project.tracks) {
    if (t.type !== 'background') continue;
    for (const c of t.clips) {
      if (c.type === 'background' && c.sceneBackground?.type === 'image' && c.sceneBackground.imageUrl) {
        backgroundImageUrls.add(c.sceneBackground.imageUrl);
      }
    }
  }

  const backgroundImagesByUrl = new Map<string, HTMLImageElement>();
  for (const bgUrl of backgroundImageUrls) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = bgUrl;
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Background image failed: ${bgUrl}`));
      });
      backgroundImagesByUrl.set(bgUrl, img);
    } catch {
      /* skip broken bg */
    }
  }

  const stream = canvas.captureStream(fps);
  const preferredTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  const supportedType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type));
  const recorder = supportedType
    ? new MediaRecorder(stream, { mimeType: supportedType })
    : new MediaRecorder(stream);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  recorder.start();

  for (let i = 0; i < frameCount; i += 1) {
    const time = i / fps;
    ctx.clearRect(0, 0, project.width, project.height);
    const { style: frameBg } = resolveBackgroundAtTime(project, time);
    const frameBgImg =
      frameBg?.type === 'image' && frameBg.imageUrl
        ? backgroundImagesByUrl.get(frameBg.imageUrl) ?? null
        : null;
    drawProjectBackground(ctx, project, frameBg, frameBgImg);

    const activeVideoClip = getActiveClipAtTime(videoClips, time);
    if (activeVideoClip?.mediaUrl) {
      const videoEl = videoByUrl.get(activeVideoClip.mediaUrl);
      if (videoEl) {
        const mediaTime = getClipEffectiveMediaTime(activeVideoClip, time);
        await seekVideo(videoEl, mediaTime);
        const rel = time - activeVideoClip.startTime;
        const { opacity: tOpacity } = computeTransitionPreview(activeVideoClip, time);
        const kfOpacity = interpolateKeyframes(
          activeVideoClip.keyframes.opacity,
          rel,
          activeVideoClip.transform.opacity
        );
        const alpha = Math.max(0, Math.min(1, kfOpacity * tOpacity));
        const filterStr = buildClipEffectsCssFilter(activeVideoClip.effects);
        const cam = interpolateCamera(project.camera, time);
        const zs = calculateSmoothZoom(time, project.zoomFragments);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.filter = filterStr === 'none' ? 'none' : filterStr;
        applyClipPreviewToCanvas2D(ctx, project, activeVideoClip, time, false);
        const cx = project.width / 2;
        const cy = project.height / 2;
        ctx.translate(cx, cy);
        ctx.scale(cam.zoom, cam.zoom);
        ctx.rotate((cam.tiltY * Math.PI) / 180);
        ctx.translate(-cx, -cy);
        const ox = (zs.focusX / 100) * project.width;
        const oy = (zs.focusY / 100) * project.height;
        ctx.translate(ox, oy);
        ctx.scale(zs.scale, zs.scale);
        if (zs.perspective > 0) {
          ctx.rotate((zs.rotateY * Math.PI) / 180);
        }
        ctx.translate(-ox, -oy);
        const { sx, sy, sw, sh } = getVideoDrawRectFromCrop(activeVideoClip, videoEl);
        const layout = resolveClipMediaLayout(activeVideoClip);
        const { dx, dy, dw, dh } = computeLayoutDestinationRect(
          project.width,
          project.height,
          sw,
          sh,
          layout
        );
        const nudge = activeVideoClip.faceFramingNudge ?? { x: 0, y: 0 };
        const nudgeK = 0.22;
        const fx = dx + nudge.x * nudgeK * project.width;
        const fy = dy + nudge.y * nudgeK * project.height;
        ctx.drawImage(videoEl, sx, sy, sw, sh, fx, fy, dw, dh);
        ctx.restore();
        ctx.filter = 'none';
      }
    }

    for (const clip of textClips) {
      if (time < clip.startTime || time >= clip.startTime + clip.duration) continue;
      drawTextOverlay(ctx, clip, time - clip.startTime);
    }
    for (const clip of imageClips) {
      if (time < clip.startTime || time >= clip.startTime + clip.duration) continue;
      drawImageOverlay(ctx, clip, time - clip.startTime, imageByUrl);
    }

    const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
    if (sc.visible) {
      const cur = interpolateCursorAtTime(sc.keyframes, time, sc.smoothing);
      if (cur) {
        drawScreenCursor(ctx, project.width, project.height, cur.x, cur.y, cur.clicking, sc);
      }
    }

    onProgress?.(((i + 1) / frameCount) * 100);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
    recorder.stop();
  });

  return new Blob(chunks, { type: 'video/webm' });
}

