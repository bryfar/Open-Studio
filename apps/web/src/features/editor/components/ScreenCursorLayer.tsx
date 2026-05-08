'use client';

import type { Project } from '@/shared/types';
import { DEFAULT_SCREEN_CURSOR } from '@/shared/types';
import { interpolateCursorAtTime } from '@/features/editor/lib/cursorOverlay';

function MacCursorSvg({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))' }}
    >
      <path
        d="M5 3L19 14.5L12 15.5L9 22L5 3Z"
        fill={color}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ScreenCursorLayer({
  project,
  currentTime,
}: {
  project: Project;
  currentTime: number;
}) {
  const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
  if (!sc.visible) return null;

  const sample = interpolateCursorAtTime(sc.keyframes, currentTime, sc.smoothing);
  if (!sample) return null;

  const { x, y, clicking } = sample;
  const baseSize = Math.max(18, sc.size);

  return (
    <div className="absolute inset-0 pointer-events-none z-[25] overflow-hidden">
      <div
        className="absolute"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: sc.style === 'mac' ? 'translate(-4%, -4%)' : 'translate(-50%, -50%)',
        }}
      >
        {sc.style === 'mac' && <MacCursorSvg size={baseSize} color={sc.color} />}
        {sc.style === 'dot' && (
          <div
            className="rounded-full border-2 shadow-md"
            style={{
              width: baseSize * 0.45,
              height: baseSize * 0.45,
              backgroundColor: sc.color,
              borderColor: sc.ringColor,
            }}
          />
        )}
        {sc.style === 'ring' && (
          <div
            className="rounded-full border-[3px] shadow-md bg-transparent"
            style={{
              width: baseSize * 0.5,
              height: baseSize * 0.5,
              borderColor: sc.ringColor,
            }}
          />
        )}
        {clicking && sc.clickEffect === 'ripple' && (
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 animate-ping opacity-40"
            style={{
              width: baseSize * 1.1,
              height: baseSize * 1.1,
              borderColor: sc.ringColor,
            }}
          />
        )}
        {clicking && sc.clickEffect === 'ring' && (
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{
              width: baseSize * 0.85,
              height: baseSize * 0.85,
              borderColor: sc.ringColor,
            }}
          />
        )}
      </div>
    </div>
  );
}
