import type { ZoomFragment } from '@/shared/types';

export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

export function zoomLevelToFactor(level: number): number {
  const minZoom = 1.2;
  const maxZoom = 4.0;
  const normalized = (Math.max(1, Math.min(10, level)) - 1) / 9;
  return minZoom + (maxZoom - minZoom) * normalized;
}

export function speedToTransitionMs(speed: number): number {
  const minMs = 150;
  const maxMs = 2000;
  const normalized = (Math.max(1, Math.min(10, speed)) - 1) / 9;
  return Math.round(maxMs - (maxMs - minMs) * normalized);
}

export interface ZoomPhaseState {
  phase: 'entry' | 'hold' | 'exit';
  scale: number;
  focusX: number;
  focusY: number;
  progress: number;
  rotateX: number;
  rotateY: number;
  perspective: number;
}

export function calculateZoomPhaseState(
  fragment: ZoomFragment,
  currentTime: number,
  forExport: boolean = false
): ZoomPhaseState {
  const totalDuration = fragment.endTime - fragment.startTime;
  const elapsed = currentTime - fragment.startTime;
  const normalizedTime = Math.max(0, Math.min(1, totalDuration > 0 ? elapsed / totalDuration : 0));

  const targetScale = zoomLevelToFactor(fragment.zoomLevel);
  const enable3D = fragment.enable3D ?? false;

  const transitionSeconds = speedToTransitionMs(fragment.speed) / 1000;
  const entryEndTime = fragment.startTime + transitionSeconds;
  const exitStartTime = fragment.endTime - transitionSeconds;
  const holdDuration = Math.max(0, exitStartTime - entryEndTime);

  let rotateX = 0;
  let rotateY = 0;
  let perspective = 0;
  let scale = forExport ? 1 : targetScale;
  let focusX = fragment.focusX;
  let focusY = fragment.focusY;
  let phase: 'entry' | 'hold' | 'exit' = 'hold';
  let progress = normalizedTime;

  const movementEndX = fragment.movementEndX ?? fragment.focusX;
  const movementEndY = fragment.movementEndY ?? fragment.focusY;

  if (currentTime < entryEndTime && transitionSeconds > 0) {
    phase = 'entry';
    const entryProgress = (currentTime - fragment.startTime) / transitionSeconds;
    progress = Math.max(0, Math.min(1, entryProgress));
    const easedProgress = easeOutQuart(progress);

    if (forExport) {
      scale = 1 + (targetScale - 1) * easedProgress;
    }
  } else if (currentTime >= exitStartTime && transitionSeconds > 0) {
    phase = 'exit';
    const exitProgress = (currentTime - exitStartTime) / transitionSeconds;
    progress = Math.max(0, Math.min(1, exitProgress));
    const easedProgress = easeOutQuart(progress);

    if (forExport) {
      scale = targetScale - (targetScale - 1) * easedProgress;
    }

    if (fragment.movementEnabled) {
      focusX = movementEndX;
      focusY = movementEndY;
    }
  } else {
    phase = 'hold';

    if (forExport) {
      scale = targetScale;
    }

    if (fragment.movementEnabled && holdDuration > 0) {
      const movementStartOffset = fragment.movementStartOffset ?? 0;
      const movementEndOffset = fragment.movementEndOffset ?? holdDuration;

      const movementStartTime = entryEndTime + Math.max(0, Math.min(movementStartOffset, holdDuration));
      const movementEndTime = entryEndTime + Math.max(movementStartOffset, Math.min(movementEndOffset, holdDuration));
      const movementDuration = movementEndTime - movementStartTime;

      if (currentTime >= movementStartTime && currentTime <= movementEndTime && movementDuration > 0) {
        const movementProgress = (currentTime - movementStartTime) / movementDuration;
        const easedProgress = easeInOutQuart(Math.min(1, movementProgress));
        focusX = fragment.focusX + (movementEndX - fragment.focusX) * easedProgress;
        focusY = fragment.focusY + (movementEndY - fragment.focusY) * easedProgress;
        progress = movementProgress;
      } else if (currentTime > movementEndTime) {
        focusX = movementEndX;
        focusY = movementEndY;
        progress = 1;
      }
    }
  }

  if (enable3D) {
    const intensity = (fragment.perspective3DIntensity ?? 50) / 100;
    const baseAngleX = fragment.perspective3DAngleX ?? 0;
    const baseAngleY = fragment.perspective3DAngleY ?? 0;

    let effect3DOpacity = 0;

    if (phase === 'entry') {
      const entryProgress = (currentTime - fragment.startTime) / transitionSeconds;
      effect3DOpacity = Math.min(1, entryProgress * 1.2);
    } else if (phase === 'exit') {
      const exitProgress = (currentTime - exitStartTime) / transitionSeconds;
      effect3DOpacity = Math.max(0, 1 - exitProgress * 1.8);
    } else {
      effect3DOpacity = 1;
    }

    const smoothOpacity = easeInOutQuart(effect3DOpacity);
    perspective = 500;

    const maxRotation = 32 * intensity;
    rotateX = (baseAngleX / 45) * maxRotation * smoothOpacity;
    rotateY = (baseAngleY / 45) * maxRotation * smoothOpacity;
  }

  return {
    phase,
    scale,
    focusX,
    focusY,
    progress,
    rotateX,
    rotateY,
    perspective,
  };
}

export interface ZoomStateCanvasExport {
  scale: number;
  focusX: number;
  focusY: number;
  rotateX: number;
  rotateY: number;
  perspective: number;
}

const DEFAULT_ZOOM_STATE: ZoomStateCanvasExport = {
  scale: 1,
  focusX: 50,
  focusY: 50,
  rotateX: 0,
  rotateY: 0,
  perspective: 0,
};

function isAdvancedZoom(f: ZoomFragment): boolean {
  return !!(f.enable3D || f.movementEnabled);
}

export function calculateSmoothZoom(
  frameTime: number,
  zoomFragments: ZoomFragment[] | undefined
): ZoomStateCanvasExport {
  if (!zoomFragments?.length) return DEFAULT_ZOOM_STATE;

  const sortedFragments = [...zoomFragments].sort((a, b) => a.startTime - b.startTime);

  const activeFragment = sortedFragments.find(
    (f) => frameTime >= f.startTime && frameTime <= f.endTime
  );

  const previousFragment = sortedFragments
    .filter((f) => f.endTime < frameTime)
    .sort((a, b) => b.endTime - a.endTime)[0];

  if (activeFragment) {
    if (isAdvancedZoom(activeFragment)) {
      const phaseState = calculateZoomPhaseState(activeFragment, frameTime, true);
      return {
        scale: phaseState.scale,
        focusX: phaseState.focusX,
        focusY: phaseState.focusY,
        rotateX: phaseState.rotateX,
        rotateY: phaseState.rotateY,
        perspective: phaseState.perspective,
      };
    }

    const transitionSec = speedToTransitionMs(activeFragment.speed) / 1000;
    const targetScale = zoomLevelToFactor(activeFragment.zoomLevel);
    const timeIntoFragment = frameTime - activeFragment.startTime;

    let scale: number;
    if (timeIntoFragment < transitionSec) {
      const p = Math.min(1, transitionSec > 0 ? timeIntoFragment / transitionSec : 1);
      const easedProgress = easeOutQuart(p);
      scale = 1 + (targetScale - 1) * easedProgress;
    } else {
      scale = targetScale;
    }

    return {
      scale,
      focusX: activeFragment.focusX,
      focusY: activeFragment.focusY,
      rotateX: 0,
      rotateY: 0,
      perspective: 0,
    };
  }

  if (previousFragment) {
    if (isAdvancedZoom(previousFragment)) {
      return DEFAULT_ZOOM_STATE;
    }

    const exitTransitionSec = speedToTransitionMs(previousFragment.speed) / 1000;
    const timeSinceEnd = frameTime - previousFragment.endTime;

    if (timeSinceEnd < exitTransitionSec) {
      const progress = Math.min(1, exitTransitionSec > 0 ? timeSinceEnd / exitTransitionSec : 1);
      const easedProgress = easeOutQuart(progress);
      const targetScale = zoomLevelToFactor(previousFragment.zoomLevel);
      const scale = targetScale - (targetScale - 1) * easedProgress;

      return {
        scale,
        focusX: previousFragment.focusX,
        focusY: previousFragment.focusY,
        rotateX: 0,
        rotateY: 0,
        perspective: 0,
      };
    }
  }

  return DEFAULT_ZOOM_STATE;
}

const DEFAULT_ZOOM_LEVEL = 2;
const DEFAULT_ZOOM_SPEED = 5;

export function createZoomFragment(startTime: number, endTime: number): ZoomFragment {
  return {
    id: `zoom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    startTime,
    endTime,
    zoomLevel: DEFAULT_ZOOM_LEVEL,
    speed: DEFAULT_ZOOM_SPEED,
    focusX: 50,
    focusY: 50,
    movementEnabled: false,
  };
}
