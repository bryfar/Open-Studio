import type { CursorOverlayKeyframe, ScreenCursorOverlay } from '@/types';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function interpolateCursorAtTime(
  keyframes: CursorOverlayKeyframe[],
  time: number,
  smoothingPct: number
): { x: number; y: number; clicking: boolean } | null {
  if (!keyframes.length) return null;

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  if (time <= sorted[0].time) {
    return {
      x: sorted[0].x,
      y: sorted[0].y,
      clicking: !!sorted[0].clicking,
    };
  }

  const last = sorted[sorted.length - 1];
  if (time >= last.time) {
    return { x: last.x, y: last.y, clicking: !!last.clicking };
  }

  let prevFrame: CursorOverlayKeyframe = sorted[0];
  let nextFrame: CursorOverlayKeyframe = sorted[0];
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].time <= time) prevFrame = sorted[i];
    if (sorted[i].time >= time) {
      nextFrame = sorted[i];
      break;
    }
  }

  if (prevFrame === nextFrame) {
    return { x: prevFrame.x, y: prevFrame.y, clicking: !!prevFrame.clicking };
  }

  const duration = nextFrame.time - prevFrame.time;
  const progress = duration > 0 ? (time - prevFrame.time) / duration : 0;
  const smoothingFactor = Math.max(0, Math.min(100, smoothingPct)) / 100;
  const easedProgress =
    easeInOutCubic(progress) * smoothingFactor + progress * (1 - smoothingFactor);

  return {
    x: lerp(prevFrame.x, nextFrame.x, easedProgress),
    y: lerp(prevFrame.y, nextFrame.y, easedProgress),
    clicking: !!(prevFrame.clicking || nextFrame.clicking),
  };
}

export function drawScreenCursor(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  xPct: number,
  yPct: number,
  clicking: boolean,
  config: ScreenCursorOverlay
): void {
  const px = (xPct / 100) * canvasW;
  const py = (yPct / 100) * canvasH;
  const base = Math.max(12, config.size * (Math.min(canvasW, canvasH) / 720));

  ctx.save();
  ctx.translate(px, py);

  if (config.clickEffect === 'ripple' && clicking) {
    ctx.strokeStyle = config.ringColor;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = Math.max(2, base * 0.08);
    ctx.beginPath();
    ctx.arc(0, 0, base * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (config.style === 'dot') {
    ctx.fillStyle = config.color;
    ctx.strokeStyle = config.ringColor;
    ctx.lineWidth = Math.max(2, base * 0.12);
    const r = base * 0.2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (config.style === 'ring') {
    ctx.strokeStyle = config.ringColor;
    ctx.lineWidth = Math.max(2, base * 0.14);
    ctx.beginPath();
    ctx.arc(0, 0, base * 0.22, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const c = config.color;
    ctx.fillStyle = c;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = Math.max(1, base * 0.06);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(base * 0.08, base * 0.72);
    ctx.lineTo(base * 0.22, base * 0.52);
    ctx.lineTo(base * 0.95, base * 0.62);
    ctx.lineTo(base * 0.72, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  if (config.clickEffect === 'ring' && clicking) {
    ctx.strokeStyle = config.ringColor;
    ctx.lineWidth = Math.max(2, base * 0.1);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(0, 0, base * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
