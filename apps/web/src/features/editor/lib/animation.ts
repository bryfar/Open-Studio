import type { Keyframe } from '@/shared/types';
import type { CameraAnimation } from '@/shared/types';
import type { Clip, TimeRemapKeyframe } from '@/shared/types';

type EasingType = Keyframe['easing'];

function ease(t: number, easing: EasingType): number {
  switch (easing) {
    case 'smooth':
      return t * t * (3 - 2 * t);
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return t * (2 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    case 'overshoot': {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    case 'bounce': {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t - 1.5 / d1) * (t - 1.5 / d1) + 0.75;
      if (t < 2.5 / d1) return n1 * (t - 2.25 / d1) * (t - 2.25 / d1) + 0.9375;
      return n1 * (t - 2.625 / d1) * (t - 2.625 / d1) + 0.984375;
    }
    case 'elastic': {
      const c4 = (2 * Math.PI) / 3;
      if (t === 0) return 0;
      if (t === 1) return 1;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
    case 'linear':
    default:
      return t;
  }
}

export function interpolateKeyframes(
  keyframes: Keyframe[],
  time: number,
  fallbackValue: number
): number {
  if (!keyframes.length) return fallbackValue;

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  if (time <= sorted[0].time) {
    return sorted[0].value;
  }

  const last = sorted[sorted.length - 1];
  if (time >= last.time) {
    return last.value;
  }

  const nextIndex = sorted.findIndex((k) => k.time >= time);
  if (nextIndex <= 0) return fallbackValue;

  const prev = sorted[nextIndex - 1];
  const next = sorted[nextIndex];

  const span = next.time - prev.time;
  if (span <= 0) return next.value;

  const rawT = (time - prev.time) / span;
  const easedT = ease(rawT, next.easing ?? 'linear');

  return prev.value + (next.value - prev.value) * easedT;
}

export function interpolateCamera(
  camera: CameraAnimation | undefined,
  time: number
): { zoom: number; tiltX: number; tiltY: number } {
  const fallback = {
    zoom: camera?.defaultZoom ?? 1,
    tiltX: camera?.defaultTiltX ?? 0,
    tiltY: camera?.defaultTiltY ?? 0,
  };
  if (!camera?.keyframes?.length) return fallback;

  const sorted = [...camera.keyframes].sort((a, b) => a.time - b.time);
  if (time <= sorted[0].time) {
    return { zoom: sorted[0].zoom, tiltX: sorted[0].tiltX, tiltY: sorted[0].tiltY };
  }

  const last = sorted[sorted.length - 1];
  if (time >= last.time) {
    return { zoom: last.zoom, tiltX: last.tiltX, tiltY: last.tiltY };
  }

  const nextIndex = sorted.findIndex((k) => k.time >= time);
  if (nextIndex <= 0) return fallback;

  const prev = sorted[nextIndex - 1];
  const next = sorted[nextIndex];
  const span = next.time - prev.time;
  if (span <= 0) return { zoom: next.zoom, tiltX: next.tiltX, tiltY: next.tiltY };

  const t = (time - prev.time) / span;
  return {
    zoom: prev.zoom + (next.zoom - prev.zoom) * t,
    tiltX: prev.tiltX + (next.tiltX - prev.tiltX) * t,
    tiltY: prev.tiltY + (next.tiltY - prev.tiltY) * t,
  };
}

export function interpolateCurveKeyframes(
  keyframes: TimeRemapKeyframe[],
  time: number,
  fallbackSpeed: number
): number {
  if (!keyframes.length) return fallbackSpeed;
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  if (time <= sorted[0].time) return sorted[0].speed;
  const last = sorted[sorted.length - 1];
  if (time >= last.time) return last.speed;
  const nextIndex = sorted.findIndex((k) => k.time >= time);
  if (nextIndex <= 0) return fallbackSpeed;
  const prev = sorted[nextIndex - 1];
  const next = sorted[nextIndex];
  const span = next.time - prev.time;
  if (span <= 0) return next.speed;
  const rawT = (time - prev.time) / span;
  const smoothT = next.curve === 'smooth' ? rawT * rawT * (3 - 2 * rawT) : rawT;
  return prev.speed + (next.speed - prev.speed) * smoothT;
}

export function getClipEffectiveMediaTime(clip: Clip, timelineTime: number): number {
  const rel = Math.max(0, timelineTime - clip.startTime);
  const base = clip.mediaStart ?? 0;
  const speedBase = Math.max(0.1, clip.speed ?? 1);
  const mappedSpeed = clip.timeMap?.length
    ? Math.max(0.1, interpolateCurveKeyframes(clip.timeMap, rel, speedBase))
    : speedBase;
  const offset = rel * mappedSpeed;
  if (clip.reverse) {
    return Math.max(0, base + Math.max(0, clip.duration - offset));
  }
  return Math.max(0, base + offset);
}

