'use client';

import type { BackgroundStyle, Project } from '@/shared/types';
import { DEFAULT_PRO_EDITOR } from '@/shared/types';
import { Slider } from '@/shared/components/ui/Slider';
import { cn } from '@/shared/utils';
import {
  getDimensionsForAspect,
  type ProjectAspectFormat,
} from '@/features/editor/lib/projectFactory';
import { ep } from '@/features/editor/components/editorPanelUi';

export type ProjectLienzoPanelProps = {
  project: Project;
  resolvedCanvasBackground: BackgroundStyle | null;
  patchSceneBackground: (patch: Partial<BackgroundStyle>) => void;
  updateProjectStyle: (patch: Record<string, unknown>) => void;
};

/** Estilo de lienzo (canvas) y cámara global. Zoom y cursor: panel izquierdo → «Zoom / Cursor». */
export function ProjectLienzoPanel({
  project,
  resolvedCanvasBackground,
  patchSceneBackground,
  updateProjectStyle,
}: ProjectLienzoPanelProps) {
  const applyCanvasAspect = (format: ProjectAspectFormat) => {
    const dims = getDimensionsForAspect(format);
    const hasClips = project.tracks.some((t) => t.clips.length > 0);
    if (
      hasClips &&
      !window.confirm(
        'Cambiar la relación de aspecto del lienzo puede desajustar el encuadre de los clips. ¿Continuar?'
      )
    ) {
      return;
    }
    updateProjectStyle({
      width: dims.width,
      height: dims.height,
      socialExport: undefined,
    });
  };

  return (
    <div className={cn(ep.root, 'border-b border-[var(--os-border-default)] bg-[var(--os-bg-app)]/50 p-3')}>
      <div className={ep.callout}>
        <p className={ep.calloutTitle}>Reencuadre del lienzo</p>
        <p className={ep.calloutBody}>
          Un clic para 16:9, vertical (Shorts/Reels), cuadrado o 4:5. Equivale a «reframe para plataforma»; el
          encabezado también puede aplicar presets por red social.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {(
            [
              ['16:9', '16:9' as const],
              ['9:16', '9:16' as const],
              ['1:1', '1:1' as const],
              ['4:5', '4:5' as const],
            ] as const
          ).map(([label, format]) => (
            <button
              key={format}
              type="button"
              className={cn(
                'rounded-md border py-1.5 text-[11px] font-medium transition-colors',
                'border-[var(--os-border-default)] bg-[var(--os-surface-1)] text-[var(--os-text-primary)]',
                'hover:border-[var(--os-border-accent)]/50 hover:bg-[var(--os-bg-hover)]'
              )}
              onClick={() => applyCanvasAspect(format)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-[var(--os-text-muted)]">
          Tamaño actual: {project.width}×{project.height}px
        </p>
      </div>

      <div className={ep.callout}>
        <p className={ep.calloutTitle}>Lienzo · Cámara</p>
        <p className={ep.calloutBody}>
          Blur, marco de dispositivo y cámara por defecto del proyecto. El{' '}
          <span className="text-[var(--os-text-primary)]">zoom tutorial</span> y el{' '}
          <span className="text-[var(--os-text-primary)]">cursor</span> están en la barra lateral izquierda (icono
          pantalla → Zoom / Cursor).
        </p>
      </div>

      <div className="space-y-3">
        <h4 className={ep.sectionTitle}>Canvas Style</h4>
        <label className={ep.label}>Background Blur</label>
        <Slider
          value={resolvedCanvasBackground?.blur ?? project.background?.blur ?? 0}
          min={0}
          max={32}
          step={1}
          onChange={(v) => patchSceneBackground({ blur: v })}
          label="px"
        />
        <label className={ep.label}>Device Frame</label>
        <select
          className={ep.select}
          value={project.deviceFrame?.type ?? 'none'}
          onChange={(e) =>
            updateProjectStyle({
              deviceFrame: {
                ...(project.deviceFrame ?? {
                  enabled: false,
                  type: 'none',
                  padding: 24,
                  radius: 16,
                  shadow: 24,
                }),
                enabled: e.target.value !== 'none',
                type: e.target.value,
              },
            })
          }
        >
          <option value="none">None</option>
          <option value="safari">Safari</option>
          <option value="chrome">Chrome</option>
          <option value="arc">Arc</option>
          <option value="samsung">Samsung</option>
        </select>
      </div>

      <div className="space-y-3 border-t border-[var(--os-border-default)] pt-3">
        <h4 className={ep.sectionTitle}>Camera</h4>
        <label className={ep.label}>Default Zoom</label>
        <Slider
          value={project.camera?.defaultZoom ?? 1}
          min={0.5}
          max={3}
          step={0.1}
          onChange={(v) =>
            updateProjectStyle({
              camera: {
                ...(project.camera ?? {
                  keyframes: [],
                  defaultZoom: 1,
                  defaultTiltX: 0,
                  defaultTiltY: 0,
                }),
                defaultZoom: v,
              },
            })
          }
          label="x"
        />
        <label className={ep.label}>Default Tilt X</label>
        <Slider
          value={project.camera?.defaultTiltX ?? 0}
          min={-30}
          max={30}
          step={1}
          onChange={(v) =>
            updateProjectStyle({
              camera: {
                ...(project.camera ?? {
                  keyframes: [],
                  defaultZoom: 1,
                  defaultTiltX: 0,
                  defaultTiltY: 0,
                }),
                defaultTiltX: v,
              },
            })
          }
          label="deg"
        />
        <label className={ep.label}>Default Tilt Y</label>
        <Slider
          value={project.camera?.defaultTiltY ?? 0}
          min={-30}
          max={30}
          step={1}
          onChange={(v) =>
            updateProjectStyle({
              camera: {
                ...(project.camera ?? {
                  keyframes: [],
                  defaultZoom: 1,
                  defaultTiltX: 0,
                  defaultTiltY: 0,
                }),
                defaultTiltY: v,
              },
            })
          }
          label="deg"
        />
      </div>

      <div className="space-y-3 border-t border-[var(--os-border-default)] pt-3">
        <h4 className={ep.sectionTitle}>Herramientas pro (Premiere / DaVinci)</h4>
        <p className={ep.hint}>
          Guías de seguridad para títulos y acción, y snap del cabezal a fotogramas enteros al mover el tiempo en el
          timeline.
        </p>
        <label className={ep.checkboxRow}>
          <input
            type="checkbox"
            checked={project.proEditor?.showTitleSafe ?? DEFAULT_PRO_EDITOR.showTitleSafe}
            onChange={(e) =>
              updateProjectStyle({
                proEditor: {
                  ...DEFAULT_PRO_EDITOR,
                  ...project.proEditor,
                  showTitleSafe: e.target.checked,
                },
              })
            }
          />
          Title safe (~10 % desde bordes)
        </label>
        <label className={ep.checkboxRow}>
          <input
            type="checkbox"
            checked={project.proEditor?.showActionSafe ?? DEFAULT_PRO_EDITOR.showActionSafe}
            onChange={(e) =>
              updateProjectStyle({
                proEditor: {
                  ...DEFAULT_PRO_EDITOR,
                  ...project.proEditor,
                  showActionSafe: e.target.checked,
                },
              })
            }
          />
          Action safe (~5 % desde bordes)
        </label>
        <label className={ep.checkboxRow}>
          <input
            type="checkbox"
            checked={
              project.proEditor?.snapPlayheadToFrame ?? DEFAULT_PRO_EDITOR.snapPlayheadToFrame
            }
            onChange={(e) =>
              updateProjectStyle({
                proEditor: {
                  ...DEFAULT_PRO_EDITOR,
                  ...project.proEditor,
                  snapPlayheadToFrame: e.target.checked,
                },
              })
            }
          />
          Snap del cabezal al fotograma (1/FPS)
        </label>
      </div>
    </div>
  );
}
