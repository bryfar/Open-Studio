/**
 * Clases Tailwind compartidas para paneles laterales del editor (misma familia visual que dashboard / StudioShell).
 */
export const ep = {
  root: 'flex flex-col gap-4 text-[12px] text-[var(--os-text-primary)]',
  intro: 'text-[11px] leading-relaxed text-[var(--os-text-secondary)]',
  card: 'space-y-2 rounded-xl border border-[var(--os-border-default)] bg-[var(--os-surface-1)]/55 p-3',
  cardTight: 'space-y-2 rounded-xl border border-[var(--os-border-default)] bg-[var(--os-surface-1)]/55 p-2.5',
  callout: 'rounded-xl border border-[var(--os-border-default)] bg-[var(--os-bg-panel)] px-3 py-2.5',
  calloutTitle: 'text-[11px] font-semibold text-[var(--os-text-primary)]',
  calloutBody: 'mt-1 text-[11px] leading-relaxed text-[var(--os-text-secondary)]',
  label: 'mb-1 block text-[11px] font-medium uppercase tracking-[0.05em] text-[var(--os-text-muted)]',
  labelInline: 'text-[11px] font-medium uppercase tracking-[0.05em] text-[var(--os-text-muted)]',
  hint: 'text-[11px] leading-relaxed text-[var(--os-text-muted)]',
  field:
    'w-full rounded-[var(--os-input-radius)] border border-[var(--os-input-border)] bg-[var(--os-input-bg)] px-2.5 py-2 text-[12px] text-[var(--os-input-fg)] placeholder:text-[var(--os-input-placeholder)] outline-none focus:border-[var(--os-border-accent)] focus-visible:shadow-[var(--os-focus-ring)]',
  textarea:
    'min-h-[4.5rem] w-full resize-y rounded-[var(--os-input-radius)] border border-[var(--os-input-border)] bg-[var(--os-input-bg)] px-2.5 py-2 text-[12px] text-[var(--os-input-fg)] placeholder:text-[var(--os-input-placeholder)] outline-none focus:border-[var(--os-border-accent)] focus-visible:shadow-[var(--os-focus-ring)]',
  select:
    'w-full rounded-[var(--os-input-radius)] border border-[var(--os-input-border)] bg-[var(--os-input-bg)] px-2.5 py-2 text-[12px] text-[var(--os-input-fg)] outline-none focus:border-[var(--os-border-accent)] focus-visible:shadow-[var(--os-focus-ring)]',
  seg: 'rounded-lg border px-2.5 py-2 text-center text-[11px] font-medium transition-colors duration-[var(--os-duration-fast)]',
  segOff:
    'border-[var(--os-border-default)] bg-[var(--os-surface-1)] text-[var(--os-text-secondary)] hover:bg-[var(--os-bg-hover)]',
  segOn:
    'border-[var(--os-border-accent)] bg-[var(--os-timeline-selection)] text-[var(--os-text-primary)] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]',
  meterTrack: 'h-2 overflow-hidden rounded bg-[var(--os-bg-canvas)]',
  meterFill: 'h-2 rounded bg-[var(--os-accent-primary)]',
  meterFillAlt: 'h-2 rounded bg-[var(--os-success)]',
  sectionTitle: 'text-xs font-medium text-[var(--os-text-secondary)]',
  checkboxRow: 'flex cursor-pointer items-center gap-2 text-[11px] text-[var(--os-text-primary)]',
  range: 'editor-panel-range w-full',
} as const;
