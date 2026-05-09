import type { ReactNode } from 'react';
import { cn } from '@/shared/utils';

export const openshortsHeroClass =
  'rounded-2xl border border-[var(--os-border-default)] bg-[var(--os-media-card-bg)] px-5 py-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] sm:px-6';

export const openshortsPanelClass =
  'flex flex-col gap-4 rounded-2xl border border-[var(--os-border-default)] bg-[var(--os-bg-panel)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]';

export const openshortsGridClass =
  'grid flex-1 grid-cols-1 content-start gap-5 lg:min-h-0 lg:grid-cols-[1.12fr_1fr] lg:gap-6';

export const controlClass =
  'w-full rounded-[var(--os-input-radius)] border border-[var(--os-input-border)] bg-[var(--os-input-bg)] px-3 py-2.5 text-[var(--os-text-sm)] text-[var(--os-input-fg)] outline-none placeholder:text-[var(--os-input-placeholder)] transition-[border-color,box-shadow] duration-[var(--os-duration-fast)] focus:border-[var(--os-border-accent)] focus-visible:shadow-[var(--os-focus-ring)]';

export const textareaClass = `${controlClass} min-h-[5.5rem] resize-y leading-relaxed`;

/** Select alineado al tema (flecha discreta, sin estilo nativo claro). */
export const selectClass = `${controlClass} cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat pr-9 [background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")]`;

export function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--os-text-muted)]',
        className
      )}
    >
      {children}
    </span>
  );
}

export function FormField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

export function SegmentedOption({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-2.5 text-center text-[12px] font-medium transition-colors duration-[var(--os-duration-fast)]',
        active
          ? 'border-[var(--os-border-accent)] bg-[var(--os-timeline-selection)] text-[var(--os-text-primary)] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]'
          : 'border-[var(--os-border-default)] bg-[var(--os-surface-1)] text-[var(--os-text-secondary)] hover:bg-[var(--os-bg-hover)] hover:text-[var(--os-text-primary)]',
        className
      )}
    >
      {children}
    </button>
  );
}

export function EmptyLogPlaceholder({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 px-4 py-8 text-center">
      <p className="text-xs font-medium text-[var(--os-text-secondary)]">{title}</p>
      <p className="max-w-[18rem] text-[11px] leading-relaxed text-[var(--os-text-muted)]">{hint}</p>
    </div>
  );
}
