'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { Project, SocialExportPlatform } from '@/types';
import { Button } from '@/components/ui/Button';
import { BUILTIN_TEMPLATES } from '@/lib/templates';
import {
  buildProjectFromWizard,
  type NewProjectWizardValues,
} from '@/lib/createProjectFromWizard';
import type { ProjectAspectFormat } from '@/lib/projectFactory';
import { SOCIAL_VARIANTS_BY_PLATFORM } from '@/lib/socialExport';

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
    reset();
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
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
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[#2a3348] bg-[#0f1522] shadow-xl"
      >
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={titleId} className="text-base font-semibold text-[#eef3ff]">
                {title}
              </h2>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg p-1.5 text-[#90a2c8] hover:bg-[#1a2438] hover:text-[#eef3ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
              onClick={() => !submitting && onOpenChange(false)}
              aria-label="Cerrar"
            >
              <span aria-hidden className="text-lg leading-none">
                ×
              </span>
            </button>
          </div>

          <div className="pt-[10px]">
            <label htmlFor="new-project-name" className="block text-xs font-medium text-[#b9c7e8] mb-1">
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

          <fieldset className="border-0 p-0 m-0">
            <legend className="text-xs font-medium text-[#b9c7e8] mb-2">Origen</legend>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 rounded-lg border border-[#2a3348] bg-[#121827] px-3 py-2 cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-400/50">
                <input
                  type="radio"
                  name="startMode"
                  checked={values.startMode === 'blank'}
                  onChange={() => setStartMode('blank')}
                  className="accent-sky-500"
                />
                <span className="text-xs text-[#dce6ff]">En blanco</span>
              </label>
              <label className="inline-flex items-center gap-2 rounded-lg border border-[#2a3348] bg-[#121827] px-3 py-2 cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-400/50">
                <input
                  type="radio"
                  name="startMode"
                  checked={values.startMode === 'template'}
                  onChange={() => setStartMode('template')}
                  className="accent-sky-500"
                />
                <span className="text-xs text-[#dce6ff]">Plantilla</span>
              </label>
            </div>
          </fieldset>

          {templateMode && (
            <div>
              <label htmlFor="new-project-template" className="block text-xs font-medium text-[#b9c7e8] mb-1">
                Plantilla
              </label>
              <select
                id="new-project-template"
                className="ui-select"
                value={values.templateId ?? ''}
                onChange={(e) =>
                  setValues((v) => ({ ...v, templateId: e.target.value || null }))
                }
              >
                {BUILTIN_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.source})
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <p className="text-[11px] text-[#7f8db0] mt-2" aria-live="polite">
                  {selectedTemplate.description}
                </p>
              )}
              <p className="text-[11px] text-[#6c7a9a] mt-2">
                Las plantillas están pensadas para lienzo <strong className="font-medium text-[#9eb0d6]">16:9</strong>{' '}
                (1920×1080). El formato se fija automáticamente.
              </p>
            </div>
          )}

          <fieldset className="border-0 p-0 m-0" disabled={templateMode || socialLocksCanvas}>
            <legend className="text-xs font-medium text-[#b9c7e8] mb-2">
              Formato del lienzo
              {templateMode && (
                <span className="sr-only">(bloqueado en modo plantilla)</span>
              )}
            </legend>
            {socialLocksCanvas && (
              <p className="text-[11px] text-[#8fa0c5] mb-2">
                El tamaño del lienzo lo define el preset de redes (resolución recomendada).
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ASPECT_OPTIONS.map((opt) => {
                const checked = values.aspect === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex flex-col rounded-lg border px-2 py-2 cursor-pointer text-left transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-400/50 ${
                      checked
                        ? 'border-sky-400 bg-sky-400/10'
                        : 'border-[#2a3348] bg-[#121827] opacity-100'
                    } ${templateMode || socialLocksCanvas ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="aspect"
                      className="sr-only"
                      checked={checked}
                      onChange={() => setValues((v) => ({ ...v, aspect: opt.id }))}
                      disabled={templateMode || socialLocksCanvas}
                    />
                    <span className="text-xs font-semibold text-[#eef3ff]">{opt.label}</span>
                    <span className="text-[10px] text-[#7f8db0] leading-tight mt-0.5">{opt.hint}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="border-0 p-0 m-0">
            <legend className="text-xs font-medium text-[#b9c7e8] mb-2">
              Optimizar para redes (MP4)
            </legend>
            <p className="text-[11px] text-[#6c7a9a] mb-2">
              {templateMode
                ? 'Opcional. El lienzo de la plantilla sigue en 16:9; al exportar MP4 se usarán bitrate y resolución del preset.'
                : 'Opcional. Si eliges una red, el lienzo usará resolución y FPS del formato de publicación.'}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="new-project-social-platform"
                  className="block text-xs font-medium text-[#b9c7e8] mb-1"
                >
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
              {values.socialExport && (
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="new-project-social-variant"
                    className="block text-xs font-medium text-[#b9c7e8] mb-1"
                  >
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
              )}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-project-fps" className="block text-xs font-medium text-[#b9c7e8] mb-1">
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
              <label htmlFor="new-project-duration" className="block text-xs font-medium text-[#b9c7e8] mb-1">
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

          <fieldset className="border-0 p-0 m-0">
            <legend className="text-xs font-medium text-[#b9c7e8] mb-2">Fondo de escena</legend>
            <div className="flex flex-wrap gap-2">
              {BACKGROUND_PRESETS.map((bg) => {
                const checked = values.sceneBackground === bg.color;
                return (
                  <label
                    key={bg.color}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-400/50 ${
                      checked ? 'border-sky-400 bg-sky-400/10 text-white' : 'border-[#2a3348] text-[#b9c7e8]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="sceneBg"
                      className="sr-only"
                      checked={checked}
                      onChange={() => setValues((v) => ({ ...v, sceneBackground: bg.color }))}
                    />
                    <span
                      className="h-3 w-3 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: bg.color }}
                      aria-hidden
                    />
                    {bg.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {error && (
            <p className="text-xs text-red-300" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-[10px] border-t border-[#1c2436]">
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
