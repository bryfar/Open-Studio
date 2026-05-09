'use client';

import { forwardRef, useCallback } from 'react';
import { cn } from '@/shared/utils';

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  className?: string;
  label?: string;
  showValue?: boolean;
}

export const Slider = forwardRef<HTMLDivElement, SliderProps>(
  ({ value, min = 0, max = 100, step = 1, onChange, className, label, showValue = true }, ref) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(Number(e.target.value));
      },
      [onChange]
    );

    return (
      <div ref={ref} className={cn('flex items-center gap-2', className)}>
        {label && (
          <span className="text-[11px] text-[var(--os-text-secondary)] min-w-[58px]">{label}</span>
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="flex-1 h-[var(--os-slider-track-height)] rounded-full appearance-none cursor-pointer accent-[var(--os-accent-primary)]"
          style={{
            background: `linear-gradient(to right, var(--os-slider-range-bg) 0%, var(--os-slider-range-bg) ${((value - min) / (max - min)) * 100}%, var(--os-slider-track-bg) ${((value - min) / (max - min)) * 100}%, var(--os-slider-track-bg) 100%)`,
          }}
        />
        {showValue && (
          <span className="text-[11px] text-[var(--os-text-secondary)] min-w-[40px] text-right">{value}</span>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';