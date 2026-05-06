import type { CSSProperties } from 'react';
import type {
  BackgroundStyle,
  Clip,
  ClipMediaLayout,
  Effect,
  MediaCropRect,
  Project,
} from '@/types';
import { DEFAULT_MEDIA_CROP } from '@/types';
import { interpolateKeyframes } from '@/lib/animation';

/** Cadena de filter CSS a partir de efectos del clip (preview / canvas 2d ctx.filter). */
export function normalizeMediaCrop(crop: MediaCropRect | undefined | null): MediaCropRect {
  if (!crop) return { ...DEFAULT_MEDIA_CROP };
  const x = Math.max(0, Math.min(1, crop.x));
  const y = Math.max(0, Math.min(1, crop.y));
  let w = Math.max(0.02, Math.min(1, crop.width));
  let h = Math.max(0.02, Math.min(1, crop.height));
  if (x + w > 1) w = 1 - x;
  if (y + h > 1) h = 1 - y;
  return { x, y, width: w, height: h };
}

/** Contenedor con overflow oculto; el interior escala y desplaza para mostrar solo `mediaCrop`. */
export function buildMediaCropOuterStyle(): CSSProperties {
  return {
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    position: 'relative',
  };
}

export function buildMediaCropInnerStyle(crop: MediaCropRect | undefined | null): CSSProperties {
  const c = normalizeMediaCrop(crop);
  return {
    width: `${100 / c.width}%`,
    height: `${100 / c.height}%`,
    transform: `translate(${(-c.x / c.width) * 100}%, ${(-c.y / c.height) * 100}%)`,
    transformOrigin: 'top left',
  };
}

export function buildClipEffectsCssFilter(effects: Effect[]): string {
  const enabled = effects.filter((e) => e.enabled);
  const extra: string[] = [];
  let brightnessMul = 1;
  let contrastMul = 1;

  for (const e of enabled) {
    switch (e.type) {
      case 'blur':
        extra.push(`blur(${Math.min(24, Math.max(0, e.value) / 2)}px)`);
        break;
      case 'motion-blur':
        extra.push(`blur(${Math.min(28, Math.max(0, e.value) * 0.75)}px)`);
        break;
      case 'brightness':
        brightnessMul *= 1 + e.value / 100;
        break;
      case 'contrast':
        contrastMul *= 1 + e.value / 100;
        break;
      case 'shadow': {
        const b = Math.max(0, e.value);
        extra.push(`drop-shadow(0 ${b}px ${b * 1.4}px rgba(0,0,0,0.55))`);
        break;
      }
      case 'glow': {
        const g = Math.max(0, e.value);
        extra.push(`brightness(1.1) drop-shadow(0 0 ${g * 0.45}px rgba(255,255,255,0.4))`);
        break;
      }
      case 'chromatic-aberration': {
        const o = Math.max(0.5, e.value / 5);
        extra.push(
          `drop-shadow(${o}px 0 0 rgba(255,70,70,0.5)) drop-shadow(-${o}px 0 0 rgba(60,170,255,0.45))`
        );
        break;
      }
      case 'color-overlay':
        break;
      case 'shake':
        break;
      case 'grayscale': {
        const g = Math.max(0, Math.min(100, e.value));
        extra.push(`grayscale(${g}%)`);
        break;
      }
      case 'sepia': {
        const s = Math.max(0, Math.min(100, e.value));
        extra.push(`sepia(${s}%)`);
        break;
      }
      case 'saturate': {
        const sat = Math.max(0, Math.min(200, e.value));
        extra.push(`saturate(${sat}%)`);
        break;
      }
      case 'hue-rotate': {
        const h = ((e.value % 360) + 360) % 360;
        extra.push(`hue-rotate(${h}deg)`);
        break;
      }
      case 'invert': {
        const inv = Math.max(0, Math.min(100, e.value));
        extra.push(`invert(${inv}%)`);
        break;
      }
      default:
        break;
    }
  }

  if (brightnessMul !== 1) extra.push(`brightness(${brightnessMul})`);
  if (contrastMul !== 1) extra.push(`contrast(${contrastMul})`);

  return extra.length > 0 ? extra.join(' ') : 'none';
}

export function computeShakeOffset(
  clip: Clip,
  globalTime: number,
  isPlaying: boolean
): { x: number; y: number } {
  const shake = clip.effects.find((e) => e.type === 'shake' && e.enabled);
  if (!shake) return { x: 0, y: 0 };
  const intensity = Math.max(0, shake.value) / 4;
  const t = (isPlaying ? globalTime : globalTime) * (isPlaying ? 42 : 10);
  return {
    x: Math.sin(t) * intensity,
    y: Math.cos(t * 1.27) * intensity * 0.85,
  };
}

export function computeTransitionPreview(
  clip: Clip,
  timelineTime: number
): { opacity: number; translateXPct: number; translateYPct: number; transitionScale: number } {
  const local = timelineTime - clip.startTime;
  const dur = clip.duration;
  let opacity = 1;
  let translateXPct = 0;
  let translateYPct = 0;
  let transitionScale = 1;

  const { inTransition: inT, outTransition: outT } = clip;

  const applyFadeEdge = (
    t: { id: string; duration: number } | null | undefined,
    edge: 'in' | 'out'
  ) => {
    if (!t || t.id !== 'fade' || t.duration <= 0) return;
    if (edge === 'in' && local < t.duration) {
      opacity *= local / t.duration;
    }
    if (edge === 'out' && local > dur - t.duration) {
      opacity *= (dur - local) / t.duration;
    }
  };

  applyFadeEdge(inT, 'in');
  applyFadeEdge(outT, 'out');

  const slideX = (t: { id: string; duration: number } | null | undefined, edge: 'in' | 'out') => {
    if (!t || t.duration <= 0) return;
    const id = t.id;
    if (id !== 'slide-left' && id !== 'slide-right') return;
    const dirIn = id === 'slide-left' ? -1 : 1;
    if (edge === 'in' && local < t.duration) {
      const p = local / t.duration;
      translateXPct += (1 - p) * dirIn * 12;
    }
    if (edge === 'out' && local > dur - t.duration) {
      const p = (local - (dur - t.duration)) / t.duration;
      const dirOut = id === 'slide-left' ? 1 : -1;
      translateXPct += p * dirOut * 12;
    }
  };

  slideX(inT, 'in');
  slideX(outT, 'out');

  const slideY = (t: { id: string; duration: number } | null | undefined, edge: 'in' | 'out') => {
    if (!t || t.duration <= 0) return;
    const id = t.id;
    if (id !== 'slide-up' && id !== 'slide-down') return;
    const dirIn = id === 'slide-up' ? 1 : -1;
    if (edge === 'in' && local < t.duration) {
      const p = local / t.duration;
      translateYPct += (1 - p) * dirIn * 10;
    }
    if (edge === 'out' && local > dur - t.duration) {
      const p = (local - (dur - t.duration)) / t.duration;
      const dirOut = id === 'slide-up' ? -1 : 1;
      translateYPct += p * dirOut * 10;
    }
  };

  slideY(inT, 'in');
  slideY(outT, 'out');

  const crossZoom = (t: { id: string; duration: number } | null | undefined, edge: 'in' | 'out') => {
    if (!t || t.id !== 'cross-zoom' || t.duration <= 0) return;
    const overshoot = 1.1;
    if (edge === 'in' && local < t.duration) {
      const p = local / t.duration;
      const ease = 1 - Math.pow(1 - p, 2);
      transitionScale *= overshoot - (overshoot - 1) * ease;
    }
    if (edge === 'out' && local > dur - t.duration) {
      const p = (local - (dur - t.duration)) / t.duration;
      const ease = Math.pow(p, 2);
      transitionScale *= 1 + (overshoot - 1) * ease;
    }
  };

  crossZoom(inT, 'in');
  crossZoom(outT, 'out');

  const flash = (t: { id: string; duration: number } | null | undefined, edge: 'in' | 'out') => {
    if (!t || t.id !== 'flash' || t.duration <= 0) return;
    const flashWindow = t.duration * 0.22;
    if (edge === 'in' && local < t.duration) {
      if (local < flashWindow) {
        const p = local / flashWindow;
        opacity *= Math.min(1, 0.35 + p * 0.65);
      }
    }
    if (edge === 'out' && local > dur - t.duration) {
      const rel = local - (dur - t.duration);
      if (rel > t.duration - flashWindow) {
        const u = (rel - (t.duration - flashWindow)) / flashWindow;
        opacity *= Math.min(1, 1 - u * 0.85);
      }
    }
  };

  flash(inT, 'in');
  flash(outT, 'out');

  const glitch = (t: { id: string; duration: number } | null | undefined, edge: 'in' | 'out') => {
    if (!t || t.id !== 'glitch' || t.duration <= 0) return;
    const jitter = (phase: number) => Math.sin(phase * 71.17 + clip.id.charCodeAt(0)) * 3.2;
    if (edge === 'in' && local < t.duration) {
      const p = local / t.duration;
      translateXPct += jitter(local * 30) * (1 - p);
      translateYPct += jitter(local * 22 + 4) * 0.45 * (1 - p);
    }
    if (edge === 'out' && local > dur - t.duration) {
      const rel = local - (dur - t.duration);
      const p = rel / t.duration;
      translateXPct += jitter(rel * 35 + 2) * p;
      translateYPct += jitter(rel * 18 + 1) * 0.45 * p;
      opacity *= 1 - p * 0.08;
    }
  };

  glitch(inT, 'in');
  glitch(outT, 'out');

  return {
    opacity: Math.max(0, Math.min(1, opacity)),
    translateXPct,
    translateYPct,
    transitionScale: Math.max(0.5, Math.min(1.35, transitionScale)),
  };
}

/** Origen en píxeles del vídeo para `drawImage` según `mediaCrop` normalizado. */
export function getVideoDrawRectFromCrop(
  clip: Clip,
  video: HTMLVideoElement
): { sx: number; sy: number; sw: number; sh: number } {
  const c = normalizeMediaCrop(clip.mediaCrop);
  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;
  return {
    sx: c.x * vw,
    sy: c.y * vh,
    sw: Math.max(1, c.width * vw),
    sh: Math.max(1, c.height * vh),
  };
}

export function resolveClipMediaLayout(clip: Clip | null | undefined): ClipMediaLayout {
  return clip?.mediaLayout ?? 'cover';
}

/** Misma semántica que CSS object-fit para el elemento de vídeo. */
export function getVideoObjectFitForLayout(layout: ClipMediaLayout): 'cover' | 'contain' | 'fill' {
  return layout;
}

/**
 * Rectángulo de destino en coordenadas del lienzo (píxeles proyecto) para drawImage,
 * manteniendo aspect ratio según layout (salvo fill).
 */
export function computeLayoutDestinationRect(
  frameW: number,
  frameH: number,
  srcW: number,
  srcH: number,
  layout: ClipMediaLayout | undefined
): { dx: number; dy: number; dw: number; dh: number } {
  const L = layout ?? 'cover';
  if (L === 'fill' || srcW <= 0 || srcH <= 0 || frameW <= 0 || frameH <= 0) {
    return { dx: 0, dy: 0, dw: frameW, dh: frameH };
  }
  const srcAr = srcW / srcH;
  const frameAr = frameW / frameH;
  if (L === 'contain') {
    let dw: number;
    let dh: number;
    if (srcAr > frameAr) {
      dw = frameW;
      dh = frameW / srcAr;
    } else {
      dh = frameH;
      dw = frameH * srcAr;
    }
    return { dx: (frameW - dw) / 2, dy: (frameH - dh) / 2, dw, dh };
  }
  let dw: number;
  let dh: number;
  if (srcAr > frameAr) {
    dh = frameH;
    dw = dh * srcAr;
  } else {
    dw = frameW;
    dh = dw / srcAr;
  }
  return { dx: (frameW - dw) / 2, dy: (frameH - dh) / 2, dw, dh };
}

/**
 * Alinea el contexto 2D con la misma cadena que `buildClipPreviewTransform` (sin opacidad CSS).
 * Debe llamarse con el origen ya en (0,0) del lienzo del proyecto.
 */
export function applyClipPreviewToCanvas2D(
  ctx: CanvasRenderingContext2D,
  project: Project,
  clip: Clip,
  timelineTime: number,
  isPlaying: boolean
): void {
  const localT = timelineTime - clip.startTime;
  const { translateXPct, translateYPct, transitionScale } = computeTransitionPreview(
    clip,
    timelineTime
  );
  const scaleX =
    interpolateKeyframes(clip.keyframes.scaleX, localT, clip.transform.scaleX) * transitionScale;
  const scaleY =
    interpolateKeyframes(clip.keyframes.scaleY, localT, clip.transform.scaleY) * transitionScale;
  const rotation = interpolateKeyframes(clip.keyframes.rotation, localT, clip.transform.rotation);
  const posX = interpolateKeyframes(clip.keyframes.positionX, localT, clip.transform.x);
  const posY = interpolateKeyframes(clip.keyframes.positionY, localT, clip.transform.y);
  const { x: shakeX, y: shakeY } = computeShakeOffset(clip, timelineTime, isPlaying);

  const cx = project.width / 2;
  const cy = project.height / 2;

  ctx.translate(cx, cy);
  ctx.translate(posX + shakeX, posY + shakeY);
  ctx.translate((translateXPct / 100) * project.width, (translateYPct / 100) * project.height);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scaleX, scaleY);
  ctx.translate(-cx, -cy);
}

export function buildClipPreviewTransform(
  clip: Clip | null,
  timelineTime: number,
  isPlaying: boolean
): CSSProperties {
  if (!clip) return {};

  const localT = timelineTime - clip.startTime;
  const { opacity: tOp, translateXPct, translateYPct, transitionScale } = computeTransitionPreview(
    clip,
    timelineTime
  );
  const kfOpacity = interpolateKeyframes(clip.keyframes.opacity, localT, clip.transform.opacity);
  const scaleX = interpolateKeyframes(clip.keyframes.scaleX, localT, clip.transform.scaleX) * transitionScale;
  const scaleY = interpolateKeyframes(clip.keyframes.scaleY, localT, clip.transform.scaleY) * transitionScale;
  const rotation = interpolateKeyframes(clip.keyframes.rotation, localT, clip.transform.rotation);
  const posX = interpolateKeyframes(clip.keyframes.positionX, localT, clip.transform.x);
  const posY = interpolateKeyframes(clip.keyframes.positionY, localT, clip.transform.y);
  const { x: shakeX, y: shakeY } = computeShakeOffset(clip, timelineTime, isPlaying);

  const opacity = Math.max(0, Math.min(1, kfOpacity * tOp));

  return {
    opacity,
    transform: `translate(${posX + shakeX}px, ${posY + shakeY}px) translateX(${translateXPct}%) translateY(${translateYPct}%) rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`,
    transformOrigin: 'center center',
  };
}

/** Estilo de la capa de fondo del lienzo (desde clip de pista background o legacy). */
export function buildStageBackgroundLayerStyle(bg: BackgroundStyle | null): CSSProperties {
  if (!bg || bg.type === 'none') {
    return { background: 'transparent' };
  }

  const base: CSSProperties = {
    filter: bg.blur > 0 ? `blur(${bg.blur}px)` : undefined,
  };

  if (bg.type === 'solid') {
    return { ...base, backgroundColor: bg.color };
  }

  if (bg.type === 'gradient') {
    const from = bg.gradientFrom ?? bg.color;
    const to = bg.gradientTo ?? '#6366f1';
    return {
      ...base,
      backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
    };
  }

  if (bg.type === 'image' && bg.imageUrl) {
    return {
      ...base,
      backgroundImage: `url(${bg.imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: bg.color,
    };
  }

  return { ...base, backgroundColor: bg.color };
}

/**
 * Si es false, el vídeo/contenido usa todo el rectángulo del lienzo (sin marco interno).
 * True cuando hay mockup (device frame) o fondo que actúa como marco (imagen/degradado o bordes/relleno).
 */
export function shouldUseStageContentInset(
  project: Project,
  sceneBg: BackgroundStyle | null
): boolean {
  const deviceOn =
    !!project.deviceFrame?.enabled && project.deviceFrame?.type !== 'none';
  if (deviceOn) return true;

  if (!sceneBg || sceneBg.type === 'none') return false;
  if (sceneBg.type === 'gradient' || sceneBg.type === 'image') return true;

  const p = sceneBg.padding ?? 0;
  const r = sceneBg.radius ?? 0;
  const s = sceneBg.shadow ?? 0;
  return p > 0 || r > 0 || s > 0;
}

const fullBleedContentBox: CSSProperties = {
  padding: 0,
  borderRadius: 0,
  boxShadow: undefined,
  overflow: 'hidden',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
};

export function buildStageContentWrapperStyle(
  bg: BackgroundStyle | null,
  project?: Project | null
): CSSProperties {
  if (project && !shouldUseStageContentInset(project, bg)) {
    return fullBleedContentBox;
  }

  const device = project?.deviceFrame;
  const deviceOn = !!device?.enabled && device?.type !== 'none';

  const padBg = bg?.padding ?? 0;
  const radBg = bg?.radius ?? 0;
  const shBg = bg?.shadow ?? 0;

  const padDev = deviceOn ? device.padding ?? 0 : 0;
  const radDev = deviceOn ? device.radius ?? 0 : 0;
  const shDev = deviceOn ? device.shadow ?? 0 : 0;

  const padding = Math.max(padBg, padDev);
  const borderRadius = Math.max(radBg, radDev);
  const shadow = Math.max(shBg, shDev);

  return {
    padding,
    borderRadius,
    boxShadow: shadow > 0 ? `0 ${shadow * 0.35}px ${shadow}px rgba(0,0,0,0.45)` : undefined,
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
  };
}
