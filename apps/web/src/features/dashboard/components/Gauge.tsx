'use client';

import React from 'react';

interface GaugeProps {
  value: number;
  color?: string;
  showLabels?: boolean;
  min?: number;
  max?: number;
}

export default function Gauge({
  value,
  color = '#ef4d23',
  showLabels = false,
  min = 0,
  max = 100,
}: GaugeProps) {
  const activeTicks = Math.round((value / 100) * 40);
  const center = 100;
  const radius = 80;
  const innerRadius = radius - 10;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const angleStep = (endAngle - startAngle) / 40;

  const ticks = Array.from({ length: 40 }, (_, i) => {
    const angle = startAngle + i * angleStep;
    const x1 = center + innerRadius * Math.cos(angle);
    const y1 = center + innerRadius * Math.sin(angle);
    const x2 = center + radius * Math.cos(angle);
    const y2 = center + radius * Math.sin(angle);
    const isActive = i < activeTicks;

    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        strokeWidth={2.5}
        strokeLinecap="round"
        stroke={isActive ? color : '#d4d4d8'}
      />
    );
  });

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 120"
        style={{ maxWidth: '260px', width: '100%' }}
      >
        {ticks}
        <text
          x={center}
          y={105}
          textAnchor="middle"
          fontSize={22}
          fontWeight={600}
          fill="#0b0f1a"
        >
          {value}%
        </text>
      </svg>
      {showLabels && (
        <div className="flex justify-between w-full text-[11px] text-neutral-500 px-2">
          <span>{min.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}