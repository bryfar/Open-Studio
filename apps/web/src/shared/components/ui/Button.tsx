'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/utils';

export type ButtonVariant = 'default' | 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  default: 'border-[var(--os-border-default)] bg-[var(--os-surface-1)] text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)]',
  primary: 'border-transparent bg-[var(--os-accent-primary)] text-[var(--os-text-inverse)] hover:bg-[var(--os-button-primary-bg-hover)]',
  secondary: 'border-[var(--os-border-default)] bg-[var(--os-surface-2)] text-[var(--os-text-primary)] hover:bg-[var(--os-bg-hover)]',
  ghost: 'border-transparent bg-transparent text-[var(--os-text-secondary)] hover:bg-[var(--os-bg-hover)] hover:text-[var(--os-text-primary)]',
  danger: 'border-[rgba(239,68,68,0.28)] bg-[rgba(239,68,68,0.12)] text-[#ffb3b3] hover:bg-[rgba(239,68,68,0.18)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-[11px]',
  md: 'h-9 px-3.5 text-[12px]',
  lg: 'h-10 px-4 text-[13px]',
  icon: 'h-9 w-9 p-0',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-[var(--os-button-radius)] border font-medium transition-colors duration-[var(--os-duration-fast)] outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:shadow-[var(--os-focus-ring)]',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';