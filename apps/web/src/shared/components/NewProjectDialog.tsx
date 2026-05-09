'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Project, SocialExportPlatform } from '@/shared/types';
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/utils';
import { BUILTIN_TEMPLATES } from '@/core/lib/templates';
import {
  buildProjectFromWizard,
  type NewProjectWizardValues,
} from '@/features/editor/lib/createProjectFromWizard';
import type { ProjectAspectFormat } from '@/features/editor/lib/projectFactory';
import { SOCIAL_VARIANTS_BY_PLATFORM } from '@/features/editor/lib/socialExport';

const PLATFORM_LABELS: Record<SocialExportPlatform, string> = {
  tiktok: 'TikTok',
  facebook: 'Facebook',
  instagram: 'Instagram',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  x: 'X (Twitter)',
};

const ASPECT_OPTIONS: { id: ProjectAspectFormat; label: string; hint: string }[] = [
  { id: '16:9', label: '16:9', hint: 'YouTube, presentaciones' },
  { id: '9:16', label: '9:16', hint: 'Shorts, TikTok, Reels' },
  { id: '1:1', label: '1:1', hint: 'Feed cuadrado' },
  { id: '4:5', label: '4:5', hint: 'Feed vertical (estilo redes)' },
];

const FPS_OPTIONS = [24, 25, 30, 60] as const;
const DURATION_OPTIONS = [30, 60, 90, 120] as const;

const BACKGROUND_PRESETS: { color: string; label: string }[] = [
  { color: '#0d0d0d', label: 'Oscuro' },
  { color: '#1a1a2e', label: 'Azul noche' },
  { color: '#0f172a', label: 'Pizarra' },
  { color: '#ffffff', label: 'Blanco' },
];

const labelClass =
  'mb-1.5 block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--os-text-muted)]';
const legendClass =
  'mb-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--os-text-muted)]';
const hintClass = 'text-[11px] leading-relaxed text-[var(--os-text-muted)]';
const rowChoiceBase =
  'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors duration-[var(--os-duration-fast)] has-[:focus-visible]:shadow-[var(--os-focus-ring)]';
const aspectCardBase =
  'flex cursor-pointer flex-col rounded-lg border px-2.5 py-2.5 text-left transition-colors duration-[var(--os-duration-fast)] has-[:focus-visible]:shadow-[var(--os-focus-ring)]';

function defaultWizardValues(): NewProjectWizardValues {
  return {
    name: '',
    startMode: 'blank',
    templateId: BUILTIN_TEMPLATES[0]?.id ?? null,
    aspect: '16:9',
    fps: 30,
    durationSeconds: 60,
    sceneBackground: '#0d0d0d',
    socialExport: null,
  };
}

export type NewProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Devuelve `false` para mantener el diálogo abierto (p. ej. usuario canceló una confirmación). */
  onComplete: (project: Project) => Promise<void | boolean>;
  title?: string;
};

export function NewProjectDialog({
  open,
  onOpenChange,
  onComplete,
  title = 'Nuevo proyecto',
}: NewProjectDialogProps) {
  const titleId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<NewProjectWizardValues>(defaultWizardValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedTemplate = values.templateId
    ? BUILTIN_TEMPLATES.find((t) => t.id === values.templateId)
    : undefined;

  const reset = useCallback(() => {
    setValues(defaultWizardValues());
    setError(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(reset);
    const t = window.requestAnimationFrame(() => {
      nameInputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(t);
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange, submitting]);

  useEffect(() => {
    if (!open) return;
    const el = panelRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusable.length === 0) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    el.addEventListener('keydown', trap);
    return () => el.removeEventListener('keydown', trap);
  }, [open]);

  const setStartMode = (startMode: NewProjectWizardValues['startMode']) => {
    setValues((v) => {
      const next = { ...v, startMode };
      if (startMode === 'template') {
        next.aspect = '16:9';
        if (!next.templateId && BUILTIN_TEMPLATES[0]) {
          next.templateId = BUILTIN_TEMPLATES[0].id;
        }
      }
      return next;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const project = buildProjectFromWizard(values);
      const close = await onComplete(project);
      if (close === false) return;
      onOpenChange(false);
      reset();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'No se pudo crear el proyecto.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const templateMode = values.startMode === 'template';
  const socialLocksCanvas = !templateMode && values.socialExport !== null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[6px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onOpenChange(false);
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--os-border-default)] bg-[var(--os-media-card-bg)] shadow-[0_8px_30px_rgba(0,0,0,0.35),0_1px_0_rgba(255,255,255,0.04)_inset]"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--os-border-default)] pb-4">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-[var(--os-text-primary)]">
              {title}
            </h2>
            <button
              type="button"
              className="shrink-0 rounded-[var(--os-button-radius)] p-2 text-[var(--os-text-muted)] transition-colors duration-[var(--os-duration-fast)] hover:bg-[var(--os-bg-hover)] hover:text-[var(--os-text-primary)] focus-visible:shadow-[var(--os-focus-ring)] focus-visible:outline-none"
              onClick={() => !submitting && onOpenChange(false)}
              aria-label="Cerrar"
            >
              <X size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>

          <div>
            <label htmlFor="new-project-name" className={labelClass}>
              Nombre del proyecto
            </label>
            <input
              ref={nameInputRef}
              id="new-project-name"
              className="ui-input"
              autoComplete="off"
              maxLength={120}
              placeholder="Ej. Anuncio redes — marzo"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            />
          </div>

          <fieldset className="m-0 border-0 p-0">
            <legend className={legendClass}>Origen</legend>
            <div className="flex flex-wrap gap-2">
              <label
                className={cn(
                  rowChoiceBase,
                  values.startMode === 'blank'
                    ? 'border-[var(--os-border-accent)] bg-[var(--os-timeline-selection)] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]'
                    : 'border-[var(--os-border-default)] bg-[var(--os-surface-1)] hover:bg-[var(--os-bg-hover)]'
                )}
              >
                <input
                  type="radio"
                  name="startMode"
                  checked={values.startMode === 'blank'}
                  onChange={() => setStartMode('blank')}
                  className="accent-[var(--os-accent-primary)]"
                />
                <span className="text-xs font-medium text-[var(--os-text-primary)]">En blanco</span>
              </label>
              <label
                className={cn(
                  rowChoiceBase,
                  values.startMode === 'template'
                    ? 'border-[var(--os-border-accent)] bg-[var(--os-timeline-selection)] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]'
                    : 'border-[var(--os-border-default)] bg-[var(--os-surface-1)] hover:bg-[var(--os-bg-hover)]'
                )}
              >
                <input
                  type="radio"
                  name="startMode"
                  checked={values.startMode === 'template'}
                  onChange={() => setStartMode('template')}
                  className="accent-[var(--os-accent-primary)]"
                />
                <span className="text-xs font-medium text-[var(--os-text-primary)]">Plantilla</span>
              </label>
            </div>
          </fieldset>

          {templateMode && (
            <div className="rounded-xl border border-[var(--os-border-default)] bg-[var(--os-surface-1)]/50 p-4">
              <label htmlFor="new-project-template" className={labelClass}>
                Plantilla
              </label>
              <select
                id="new-project-template"
                className="ui-select"
                value={values.templateId ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, templateId: e.target.value || null }))}
              >
                {BUILTIN_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.source})
                  </option>
                ))}
              </select>
              {selectedTemplate ? (
                <p className={cn(hintClass, 'mt-2')} aria-live="polite">
                  {selectedTemplate.description}
                </p>
              ) : null}
              <p className={cn(hintClass, 'mt-2')}>
                Las plantillas usan lienzo{' '}
                <strong className="font-medium text-[var(--os-text-secondary)]">16:9</strong> (1920×1080). El formato se
                fija automáticamente.
              </p>
            </div>
          )}

          <fieldset className="m-0 border-0 p-0" disabled={templateMode || socialLocksCanvas}>
            <legend className={legendClass}>
              Formato del lienzo
              {templateMode ? <span className="sr-only">(bloqueado en modo plantilla)</span> : null}
            </legend>
            {socialLocksCanvas ? (
              <p className={cn(hintClass, 'mb-2')}>
                El tamaño del lienzo lo define el preset de redes (resolución recomendada).
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ASPECT_OPTIONS.map((opt) => {
                const checked = values.aspect === opt.id;
                const locked = templateMode || socialLocksCanvas;
                return (
                  <label
                    key={opt.id}
                    className={cn(
                      aspectCardBase,
                      checked
                        ? 'border-[var(--os-border-accent)] bg-[var(--os-timeline-selection)] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]'
                        : 'border-[var(--os-border-default)] bg-[var(--os-surface-1)] hover:bg-[var(--os-bg-hover)]',
                      locked && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <input
                      type="radio"
                      name="aspect"
                      className="sr-only"
                      checked={checked}
                      onChange={() => setValues((v) => ({ ...v, aspect: opt.id }))}
                      disabled={locked}
                    />
                    <span className="text-xs font-semibold text-[var(--os-text-primary)]">{opt.label}</span>
                    <span className="mt-0.5 text-[10px] leading-tight text-[var(--os-text-muted)]">{opt.hint}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="m-0 border-0 p-0">
            <legend className={legendClass}>Optimizar para redes (MP4)</legend>
            <p className={cn(hintClass, 'mb-3')}>
              {templateMode
                ? 'Opcional. El lienzo de la plantilla sigue en 16:9; al exportar MP4 se usarán bitrate y resolución del preset.'
                : 'Opcional. Si eliges una red, el lienzo usará resolución y FPS del formato de publicación.'}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label htmlFor="new-project-social-platform" className={labelClass}>
                  Plataforma
                </label>
                <select
                  id="new-project-social-platform"
                  className="ui-select w-full"
                  value={values.socialExport?.platform ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (!raw) {
                      setValues((v) => ({ ...v, socialExport: null }));
                      return;
                    }
                    const platform = raw as SocialExportPlatform;
                    const first = SOCIAL_VARIANTS_BY_PLATFORM[platform][0];
                    setValues((v) => ({
                      ...v,
                      socialExport: first ? { platform, variantId: first.id } : null,
                    }));
                  }}
                >
                  <option value="">Sin optimización específica</option>
                  {(Object.keys(SOCIAL_VARIANTS_BY_PLATFORM) as SocialExportPlatform[]).map((p) => (
                    <option key={p} value={p}>
                      {PLATFORM_LABELS[p]}
                    </option>
                  ))}
                </select>
              </div>
              {values.socialExport ? (
                <div className="min-w-0 flex-1">
                  <label htmlFor="new-project-social-variant" className={labelClass}>
                    Formato de publicación
                  </label>
                  <select
                    id="new-project-social-variant"
                    className="ui-select w-full"
                    value={values.socialExport.variantId}
                    onChange={(e) =>
                      setValues((v) =>
                        v.socialExport
                          ? {
                              ...v,
                              socialExport: {
                                ...v.socialExport,
                                variantId: e.target.value,
                              },
                            }
                          : v
                      )
                    }
                  >
                    {SOCIAL_VARIANTS_BY_PLATFORM[values.socialExport.platform].map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.label} ({variant.width}×{variant.height})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="new-project-fps" className={labelClass}>
                FPS
              </label>
              <select
                id="new-project-fps"
                className="ui-select"
                value={values.fps}
                disabled={socialLocksCanvas}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    fps: Number(e.target.value) as NewProjectWizardValues['fps'],
                  }))
                }
              >
                {FPS_OPTIONS.map((fps) => (
                  <option key={fps} value={fps}>
                    {fps} fps
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="new-project-duration" className={labelClass}>
                Duración inicial (timeline)
              </label>
              <select
                id="new-project-duration"
                className="ui-select"
                value={values.durationSeconds}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    durationSeconds: Number(e.target.value) as NewProjectWizardValues['durationSeconds'],
                  }))
                }
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} segundos
                  </option>
                ))}
              </select>
            </div>
          </div>

          <fieldset className="m-0 border-0 p-0">
            <legend className={legendClass}>Fondo de escena</legend>
            <div className="flex flex-wrap gap-2">
              {BACKGROUND_PRESETS.map((bg) => {
                const checked = values.sceneBackground === bg.color;
                return (
                  <label
                    key={bg.color}
                    className={cn(
                      rowChoiceBase,
                      'rounded-full py-1.5 text-xs',
                      checked
                        ? 'border-[var(--os-border-accent)] bg-[var(--os-timeline-selection)] text-[var(--os-text-primary)] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]'
                        : 'border-[var(--os-border-default)] bg-[var(--os-surface-1)] text-[var(--os-text-secondary)] hover:bg-[var(--os-bg-hover)]'
                    )}
                  >
                    <input
                      type="radio"
                      name="sceneBg"
                      className="sr-only"
                      checked={checked}
                      onChange={() => setValues((v) => ({ ...v, sceneBackground: bg.color }))}
                    />
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-[var(--os-border-default)]"
                      style={{ backgroundColor: bg.color }}
                      aria-hidden
                    />
                    {bg.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {error ? (
            <p className="text-xs text-[var(--os-error)]" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-[var(--os-border-default)] pt-4">
            <Button type="button" variant="ghost" size="sm" disabled={submitting} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={submitting}>
              {submitting ? 'Creando…' : 'Crear proyecto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
