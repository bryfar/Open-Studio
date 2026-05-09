'use client';

import { Button } from '@/shared/components/ui/Button';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { buildProxyForMedia } from '@/features/editor/lib/proxyWorkflow';
import type { Project } from '@/shared/types';
import { cn } from '@/shared/utils';
import { ep } from '@/features/editor/components/editorPanelUi';

const defaultMulticam: NonNullable<Project['multicam']> = {
  enabled: false,
  activeAngle: 1,
  proxyEnabled: false,
  proxyScale: 0.5,
};

export function MulticamProxyPanel({ onNotice }: { onNotice?: (msg: string) => void }) {
  const { project, dispatch, mediaFiles } = useEditorStore();
  const multicam = project?.multicam ?? defaultMulticam;
  const patch = (next: NonNullable<Project['multicam']>) =>
    dispatch({ type: 'UPDATE_PROJECT', payload: { multicam: next } });
  const cameraSources = mediaFiles.filter((m) => m.type.startsWith('video')).length;
  const proxyReadyCount = mediaFiles.filter((m) => m.proxyReady).length;
  const videoSources = mediaFiles
    .filter((m) => m.type.startsWith('video'))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const generateProxies = async () => {
    const scale = Number(multicam.proxyScale ?? 0.5);
    let done = 0;
    let failed = 0;
    for (const media of mediaFiles) {
      if (!media.type.startsWith('video')) continue;
      const previousProxy = media.proxyUrl;
      const proxy = await buildProxyForMedia(media, scale);
      if (previousProxy && previousProxy !== proxy.proxyUrl) {
        URL.revokeObjectURL(previousProxy);
      }
      dispatch({
        type: 'UPDATE_MEDIA_FILE',
        payload: {
          id: media.id,
          updates: {
            proxyUrl: proxy.proxyUrl,
            proxyReady: proxy.proxyReady,
            sourceUrl: media.sourceUrl ?? media.url,
          },
        },
      });
      if (!proxy.proxyReady) failed += 1;
      done += 1;
    }
    const message =
      failed > 0
        ? `Proxy workflow parcial (${done} clips, ${failed} fallos).`
        : `Proxy workflow completado (${done} clips procesados).`;
    onNotice?.(message);
  };

  const syncFromMediaMetadata = () => {
    const offsets: Record<string, number> = {};
    for (const media of videoSources) {
      const raw = media.cameraOffsetSec ?? 0;
      offsets[media.id] = Number.isFinite(raw) ? raw : 0;
    }
    patch({
      ...multicam,
      syncOffsets: offsets,
    });
    onNotice?.(`Sincronización multicam aplicada (${videoSources.length} fuentes).`);
  };

  const insertAngleCut = () => {
    const head = useEditorStore.getState().currentTime;
    const cuts = Array.isArray(multicam.angleCuts) ? multicam.angleCuts : [];
    patch({
      ...multicam,
      angleCuts: [
        ...cuts,
        {
          id: `${Date.now()}`,
          time: head,
          angle: multicam.activeAngle,
        },
      ],
    });
    onNotice?.(`Angle cut añadido en ${head.toFixed(2)}s (Cam ${multicam.activeAngle}).`);
  };

  return (
    <div className={ep.root}>
      <label className={ep.checkboxRow}>
        <input
          type="checkbox"
          checked={multicam.enabled}
          onChange={(e) => patch({ ...multicam, enabled: e.target.checked })}
        />
        Multicam mode
      </label>
      <p className={ep.hint}>Fuentes detectadas: {cameraSources}</p>
      <div className="grid grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            className={cn(
              'rounded-lg border px-2 py-1.5 text-[11px] font-medium',
              multicam.activeAngle === n ? ep.segOn : ep.segOff
            )}
            onClick={() => patch({ ...multicam, activeAngle: n })}
          >
            Cam {n}
          </button>
        ))}
      </div>
      <label className={ep.checkboxRow}>
        <input
          type="checkbox"
          checked={multicam.proxyEnabled}
          onChange={(e) => patch({ ...multicam, proxyEnabled: e.target.checked })}
        />
        Proxy workflow
      </label>
      <input
        type="range"
        min={0.2}
        max={1}
        step={0.1}
        value={multicam.proxyScale}
        onChange={(e) => patch({ ...multicam, proxyScale: Number(e.target.value) })}
        className={ep.range}
      />
      <p className={ep.hint}>
        Proxies listos: {proxyReadyCount}/{cameraSources}
      </p>
      <Button type="button" variant="secondary" className="w-full text-[11px]" onClick={() => void generateProxies()}>
        Generar proxies
      </Button>
      <Button type="button" variant="secondary" className="w-full text-[11px]" onClick={syncFromMediaMetadata}>
        Sincronizar offsets de cámara
      </Button>
      <Button type="button" variant="ghost" className="w-full text-[11px]" onClick={insertAngleCut}>
        Insertar angle cut en playhead
      </Button>
      <div className={ep.card}>
        <p className="text-[11px] text-[var(--os-text-secondary)]">Cámara activa: Cam {multicam.activeAngle}</p>
        <p className="text-[11px] text-[var(--os-text-muted)]">Cortes: {multicam.angleCuts?.length ?? 0}</p>
      </div>
    </div>
  );
}
