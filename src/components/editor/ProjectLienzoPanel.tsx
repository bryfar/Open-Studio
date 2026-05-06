'use client';

import type { BackgroundStyle, Project } from '@/types';
import { DEFAULT_PRO_EDITOR } from '@/types';
import { Slider } from '@/components/ui/Slider';
import {
  getDimensionsForAspect,
  type ProjectAspectFormat,
} from '@/lib/projectFactory';

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
    <div className="space-y-4 border-b border-zinc-800 bg-gradient-to-b from-zinc-950/95 to-zinc-900/80 p-3">
      <div className="space-y-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-200/90">
          Reencuadre del lienzo
        </p>
        <p className="text-[10px] leading-snug text-zinc-500">
          Un clic para 16:9, vertical (Shorts/Reels), cuadrado o 4:5. Equivale a «reframe para plataforma»; el
          encabezado también puede aplicar presets por red social.
        </p>
        <div className="grid grid-cols-2 gap-1.5">
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
              className="rounded-md border border-zinc-600 bg-zinc-800/90 py-1.5 text-[11px] font-medium text-zinc-200 hover:border-amber-500/50 hover:bg-zinc-800"
              onClick={() => applyCanvasAspect(format)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-zinc-600">
          Tamaño actual: {project.width}×{project.height}px
        </p>
      </div>

      <div className="rounded-lg border border-sky-500/35 bg-sky-500/[0.07] px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-400">
          Lienzo · Cámara
        </p>
        <p className="mt-1 text-[10px] leading-snug text-zinc-500">
          Blur, marco de dispositivo y cámara por defecto del proyecto. El{' '}
          <span className="text-zinc-400">zoom tutorial</span> y el{' '}
          <span className="text-zinc-400">cursor</span> están en la barra lateral izquierda (icono pantalla → Zoom /
          Cursor).
        </p>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-medium text-zinc-400">Canvas Style</h4>
        <label className="text-xs text-zinc-500">Background Blur</label>
        <Slider
          value={resolvedCanvasBackground?.blur ?? project.background?.blur ?? 0}
          min={0}
          max={32}
          step={1}
          onChange={(v) => patchSceneBackground({ blur: v })}
          label="px"
        />
        <label className="text-xs text-zinc-500">Device Frame</label>
        <select
          className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200"
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

      <div className="space-y-3 border-t border-zinc-800 pt-3">
        <h4 className="text-xs font-medium text-zinc-400">Camera</h4>
        <label className="text-xs text-zinc-500">Default Zoom</label>
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
        <label className="text-xs text-zinc-500">Default Tilt X</label>
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
        <label className="text-xs text-zinc-500">Default Tilt Y</label>
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

      <div className="space-y-3 border-t border-zinc-800 pt-3">
        <h4 className="text-xs font-medium text-zinc-400">Herramientas pro (Premiere / DaVinci)</h4>
        <p className="text-[10px] leading-snug text-zinc-500">
          Guías de seguridad para títulos y acción, y snap del cabezal a fotogramas enteros al mover el tiempo en el
          timeline.
        </p>
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-zinc-300">
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
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-zinc-300">
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
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-zinc-300">
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
