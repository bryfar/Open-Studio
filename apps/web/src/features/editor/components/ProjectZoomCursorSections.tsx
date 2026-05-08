'use client';

import type { Project } from '@/shared/types';
import { DEFAULT_SCREEN_CURSOR } from '@/shared/types';
import type { ScreenCursorClickEffect, ScreenCursorStyle } from '@/shared/types';
import { Slider } from '@/shared/components/ui/Slider';
import { Input } from '@/shared/components/ui/Input';
import { icons } from '@/shared/components/icons';
import { cn, generateId } from '@/shared/utils';
import { createZoomFragment } from '@/features/editor/lib/zoomEngine';
import {
  applyScreenCursorStylePreset,
  applyTutorialZoomPreset,
  SCREEN_CURSOR_STYLE_PRESETS,
  TUTORIAL_ZOOM_PRESETS,
} from '@/features/editor/lib/projectStylePresets';

export type ProjectZoomCursorSectionsProps = {
  project: Project;
  currentTime: number;
  updateProjectStyle: (patch: Record<string, unknown>) => void;
  className?: string;
};

/** Zoom tutorial + cursor simulado (nivel proyecto). Pensado para el panel lateral de herramientas. */
export function ProjectZoomCursorSections({
  project,
  currentTime,
  updateProjectStyle,
  className,
}: ProjectZoomCursorSectionsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <icons.maximize size={14} />
          Zoom tutorial
        </h4>
        <p className="text-[10px] leading-snug text-zinc-600">
          Acercamiento suave hacia un punto del encuadre. Fuera del fragmento, el zoom vuelve a 1× con la misma
          suavidad.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TUTORIAL_ZOOM_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.subtitle}
              className="rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-[10px] text-zinc-200 hover:border-sky-500/60 hover:bg-zinc-800"
              onClick={() => {
                const fragment = applyTutorialZoomPreset(project, currentTime, p.id);
                if (!fragment) return;
                updateProjectStyle({
                  zoomFragments: [...(project.zoomFragments ?? []), fragment],
                });
              }}
            >
              {p.title}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-2 py-2 text-[11px] text-zinc-200 hover:bg-zinc-800"
          onClick={() => {
            const start = Math.max(0, Math.min(currentTime, project.duration - 0.25));
            const end = Math.min(project.duration, start + 2);
            const next = createZoomFragment(start, end);
            const list = project.zoomFragments ?? [];
            updateProjectStyle({ zoomFragments: [...list, next] });
          }}
        >
          + Añadir zoom en cabezal (2 s)
        </button>
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {(project.zoomFragments ?? []).length === 0 && (
            <p className="text-[10px] text-zinc-600">Sin fragmentos de zoom.</p>
          )}
          {(project.zoomFragments ?? []).map((f) => (
            <div key={f.id} className="space-y-2 rounded-lg border border-zinc-700 bg-zinc-900/50 p-2">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate font-mono text-[10px] text-zinc-500">{f.id.slice(0, 12)}…</span>
                <button
                  type="button"
                  className="text-[10px] text-red-400 hover:text-red-300"
                  onClick={() => {
                    updateProjectStyle({
                      zoomFragments: (project.zoomFragments ?? []).filter((x) => x.id !== f.id),
                    });
                  }}
                >
                  Quitar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <label className="text-[10px] text-zinc-500">Inicio (s)</label>
                  <Input
                    type="number"
                    step="0.1"
                    className="h-8 text-xs"
                    value={f.startTime}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isNaN(v)) return;
                      const list = project.zoomFragments ?? [];
                      updateProjectStyle({
                        zoomFragments: list.map((x) =>
                          x.id === f.id ? { ...x, startTime: Math.max(0, v) } : x
                        ),
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500">Fin (s)</label>
                  <Input
                    type="number"
                    step="0.1"
                    className="h-8 text-xs"
                    value={f.endTime}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isNaN(v)) return;
                      const list = project.zoomFragments ?? [];
                      updateProjectStyle({
                        zoomFragments: list.map((x) =>
                          x.id === f.id ? { ...x, endTime: Math.max(x.startTime + 0.1, v) } : x
                        ),
                      });
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-500">Nivel 1–10 (más = más zoom)</label>
                <Slider
                  value={f.zoomLevel}
                  min={1}
                  max={10}
                  step={0.5}
                  onChange={(v) => {
                    const list = project.zoomFragments ?? [];
                    updateProjectStyle({
                      zoomFragments: list.map((x) => (x.id === f.id ? { ...x, zoomLevel: v } : x)),
                    });
                  }}
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500">Velocidad transición 1–10</label>
                <Slider
                  value={f.speed}
                  min={1}
                  max={10}
                  step={0.5}
                  onChange={(v) => {
                    const list = project.zoomFragments ?? [];
                    updateProjectStyle({
                      zoomFragments: list.map((x) => (x.id === f.id ? { ...x, speed: v } : x)),
                    });
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <label className="text-[10px] text-zinc-500">Foco X %</label>
                  <Slider
                    value={f.focusX}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(v) => {
                      const list = project.zoomFragments ?? [];
                      updateProjectStyle({
                        zoomFragments: list.map((x) => (x.id === f.id ? { ...x, focusX: v } : x)),
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500">Foco Y %</label>
                  <Slider
                    value={f.focusY}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(v) => {
                      const list = project.zoomFragments ?? [];
                      updateProjectStyle({
                        zoomFragments: list.map((x) => (x.id === f.id ? { ...x, focusY: v } : x)),
                      });
                    }}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-[10px] text-zinc-400">
                <input
                  type="checkbox"
                  checked={!!f.movementEnabled}
                  onChange={(e) => {
                    const list = project.zoomFragments ?? [];
                    updateProjectStyle({
                      zoomFragments: list.map((x) =>
                        x.id === f.id
                          ? {
                              ...x,
                              movementEnabled: e.target.checked,
                              movementEndX: x.movementEndX ?? x.focusX,
                              movementEndY: x.movementEndY ?? x.focusY,
                            }
                          : x
                      ),
                    });
                  }}
                />
                Mover foco durante la pausa
              </label>
              {f.movementEnabled && (
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <label className="text-[10px] text-zinc-500">Fin foco X %</label>
                    <Slider
                      value={f.movementEndX ?? f.focusX}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(v) => {
                        const list = project.zoomFragments ?? [];
                        updateProjectStyle({
                          zoomFragments: list.map((x) =>
                            x.id === f.id ? { ...x, movementEndX: v } : x
                          ),
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500">Fin foco Y %</label>
                    <Slider
                      value={f.movementEndY ?? f.focusY}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(v) => {
                        const list = project.zoomFragments ?? [];
                        updateProjectStyle({
                          zoomFragments: list.map((x) =>
                            x.id === f.id ? { ...x, movementEndY: v } : x
                          ),
                        });
                      }}
                    />
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 text-[10px] text-zinc-400">
                <input
                  type="checkbox"
                  checked={!!f.enable3D}
                  onChange={(e) => {
                    const list = project.zoomFragments ?? [];
                    updateProjectStyle({
                      zoomFragments: list.map((x) =>
                        x.id === f.id
                          ? {
                              ...x,
                              enable3D: e.target.checked,
                              perspective3DIntensity: x.perspective3DIntensity ?? 40,
                              perspective3DAngleX: x.perspective3DAngleX ?? 12,
                              perspective3DAngleY: x.perspective3DAngleY ?? -10,
                            }
                          : x
                      ),
                    });
                  }}
                />
                Perspectiva 3D (preview)
              </label>
              {f.enable3D && (
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500">Intensidad 3D</label>
                  <Slider
                    value={f.perspective3DIntensity ?? 40}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(v) => {
                      const list = project.zoomFragments ?? [];
                      updateProjectStyle({
                        zoomFragments: list.map((x) =>
                          x.id === f.id ? { ...x, perspective3DIntensity: v } : x
                        ),
                      });
                    }}
                  />
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      <label className="text-[10px] text-zinc-500">Ángulo X</label>
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        value={f.perspective3DAngleX ?? 0}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isNaN(v)) return;
                          const list = project.zoomFragments ?? [];
                          updateProjectStyle({
                            zoomFragments: list.map((x) =>
                              x.id === f.id ? { ...x, perspective3DAngleX: v } : x
                            ),
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500">Ángulo Y</label>
                      <Input
                        type="number"
                        className="h-8 text-xs"
                        value={f.perspective3DAngleY ?? 0}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isNaN(v)) return;
                          const list = project.zoomFragments ?? [];
                          updateProjectStyle({
                            zoomFragments: list.map((x) =>
                              x.id === f.id ? { ...x, perspective3DAngleY: v } : x
                            ),
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t border-zinc-800 pt-3">
        <h4 className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <icons.move size={14} />
          Cursor pantalla
        </h4>
        <p className="text-[10px] leading-snug text-zinc-600">
          Cursor simulado encima del vídeo. Añade puntos en la línea de tiempo para animar la posición (porcentaje del
          lienzo).
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SCREEN_CURSOR_STYLE_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.subtitle}
              className="rounded-md border border-zinc-700 bg-zinc-900/80 px-2 py-1.5 text-[10px] text-zinc-200 hover:border-sky-500/60 hover:bg-zinc-800"
              onClick={() => {
                updateProjectStyle({
                  screenCursor: applyScreenCursorStylePreset(project.screenCursor, p.id),
                });
              }}
            >
              {p.title}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[11px] text-zinc-300">
          <input
            type="checkbox"
            checked={(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).visible}
            onChange={(e) => {
              const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
              updateProjectStyle({ screenCursor: { ...sc, visible: e.target.checked } });
            }}
          />
          Mostrar cursor
        </label>
        <div>
          <label className="text-[10px] text-zinc-500">Estilo</label>
          <select
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200"
            value={(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).style}
            onChange={(e) => {
              const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
              updateProjectStyle({
                screenCursor: {
                  ...sc,
                  style: e.target.value as ScreenCursorStyle,
                },
              });
            }}
          >
            <option value="mac">Flecha (mac)</option>
            <option value="dot">Punto</option>
            <option value="ring">Anillo</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-zinc-500">Efecto al clic</label>
          <select
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-200"
            value={(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).clickEffect}
            onChange={(e) => {
              const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
              updateProjectStyle({
                screenCursor: {
                  ...sc,
                  clickEffect: e.target.value as ScreenCursorClickEffect,
                },
              });
            }}
          >
            <option value="none">Ninguno</option>
            <option value="ring">Anillo</option>
            <option value="ripple">Onda</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-zinc-500">Tamaño</label>
          <Slider
            value={(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).size}
            min={16}
            max={64}
            step={1}
            onChange={(v) => {
              const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
              updateProjectStyle({ screenCursor: { ...sc, size: v } });
            }}
          />
        </div>
        <div>
          <label className="text-[10px] text-zinc-500">Suavizado trayectoria</label>
          <Slider
            value={(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).smoothing}
            min={0}
            max={100}
            step={1}
            onChange={(v) => {
              const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
              updateProjectStyle({ screenCursor: { ...sc, smoothing: v } });
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-zinc-500">Color</label>
            <Input
              type="color"
              className="h-8 border-zinc-700 p-0"
              value={(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).color}
              onChange={(e) => {
                const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                updateProjectStyle({ screenCursor: { ...sc, color: e.target.value } });
              }}
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500">Anillo</label>
            <Input
              type="color"
              className="h-8 border-zinc-700 p-0"
              value={(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).ringColor}
              onChange={(e) => {
                const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                updateProjectStyle({ screenCursor: { ...sc, ringColor: e.target.value } });
              }}
            />
          </div>
        </div>
        <button
          type="button"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/80 px-2 py-2 text-[11px] text-zinc-200 hover:bg-zinc-800"
          onClick={() => {
            const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
            const nextKf = {
              id: generateId(),
              time: currentTime,
              x: 50,
              y: 50,
              clicking: false,
            };
            updateProjectStyle({
              screenCursor: {
                ...sc,
                keyframes: [...sc.keyframes, nextKf].sort((a, b) => a.time - b.time),
              },
            });
          }}
        >
          + Punto de cursor en cabezal (50%, 50%)
        </button>
        <div className="max-h-32 space-y-1 overflow-y-auto">
          {(project.screenCursor ?? DEFAULT_SCREEN_CURSOR).keyframes.map((k) => (
            <div
              key={k.id}
              className="flex items-center gap-1 rounded border border-zinc-800 px-1 py-1 text-[10px] text-zinc-400"
            >
              <span className="w-14 shrink-0 font-mono">{k.time.toFixed(2)}s</span>
              <Input
                type="number"
                className="h-7 w-12 px-1 text-[10px]"
                value={k.x}
                title="X %"
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isNaN(v)) return;
                  const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                  updateProjectStyle({
                    screenCursor: {
                      ...sc,
                      keyframes: sc.keyframes.map((x) =>
                        x.id === k.id ? { ...x, x: Math.max(0, Math.min(100, v)) } : x
                      ),
                    },
                  });
                }}
              />
              <Input
                type="number"
                className="h-7 w-12 px-1 text-[10px]"
                value={k.y}
                title="Y %"
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isNaN(v)) return;
                  const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                  updateProjectStyle({
                    screenCursor: {
                      ...sc,
                      keyframes: sc.keyframes.map((x) =>
                        x.id === k.id ? { ...x, y: Math.max(0, Math.min(100, v)) } : x
                      ),
                    },
                  });
                }}
              />
              <label className="flex shrink-0 items-center gap-0.5" title="Clic">
                <input
                  type="checkbox"
                  checked={!!k.clicking}
                  onChange={(e) => {
                    const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                    updateProjectStyle({
                      screenCursor: {
                        ...sc,
                        keyframes: sc.keyframes.map((x) =>
                          x.id === k.id ? { ...x, clicking: e.target.checked } : x
                        ),
                      },
                    });
                  }}
                />
              </label>
              <button
                type="button"
                className="ml-auto text-[10px] text-red-400"
                onClick={() => {
                  const sc = project.screenCursor ?? DEFAULT_SCREEN_CURSOR;
                  updateProjectStyle({
                    screenCursor: {
                      ...sc,
                      keyframes: sc.keyframes.filter((x) => x.id !== k.id),
                    },
                  });
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
