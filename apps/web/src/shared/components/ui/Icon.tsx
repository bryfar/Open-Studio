'use client';

import { SVG_ASSETS } from './icons-data';
import { cn } from '@/shared/utils';

export type IconName = keyof typeof SVG_ASSETS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 24, className }: IconProps) {
  const svg = SVG_ASSETS[name];
  if (!svg) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox={svg.viewBox}
      className={cn('fill-current', className)}
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: svg.content }}
    />
  );
}