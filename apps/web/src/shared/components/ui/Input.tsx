'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'h-[var(--os-input-height)] w-full rounded-[var(--os-input-radius)] border border-[var(--os-input-border)] bg-[var(--os-input-bg)] px-2.5 text-[var(--os-text-sm)] text-[var(--os-input-fg)] outline-none placeholder:text-[var(--os-input-placeholder)] focus:border-[var(--os-border-accent)] focus-visible:shadow-[var(--os-focus-ring)]',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';