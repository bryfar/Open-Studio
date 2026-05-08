'use client';

import { useEditorStore } from '@/features/editor/store/editorStore';
import type { Keyframe } from '@/shared/types';
import { useState } from 'react';

const EASINGS = ['linear', 'ease-in', 'ease-out', 'ease-in-out', 'smooth', 'overshoot', 'bounce', 'elastic'] as const;
type Channel = 'positionX' | 'positionY' | 'scaleX' | 'scaleY' | 'rotation' | 'opacity';

export function KeyframesGraphPanel({ onNotice }: { onNotice?: (msg: string) => void }) {
  const { project, selectedClipId, dispatch } = useEditorStore();
  const [channel, setChannel] = useState<Channel>('positionX');
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  if (!project || !selectedClipId) {
    return <p className="text-xs text-zinc-500">Selecciona un clip para editar curvas/keyframes.</p>;
  }

  const target = project.tracks
    .flatMap((t) => t.clips.map((c) => ({ t, c })))
    .find((x) => x.c.id === selectedClipId);
  if (!target) return null;

  const currentChannel = target.c.keyframes[channel];
  const selectedKey = currentChannel.find((k) => k.id === selectedKeyId) ?? currentChannel[0] ?? null;

  const applyEasing = (easing: typeof EASINGS[number]) => {
    const clip = target.c;
    const keys = clip.keyframes;
    const mutate = (arr: Keyframe[]) =>
      arr.map((k) => {
        if (!selectedKey) return k;
        return k.id === selectedKey.id ? { ...k, easing } : k;
      });
    const next = {
      ...clip,
      keyframes: {
        positionX: mutate(keys.positionX),
        positionY: mutate(keys.positionY),
        scaleX: mutate(keys.scaleX),
        scaleY: mutate(keys.scaleY),
        rotation: mutate(keys.rotation),
        opacity: mutate(keys.opacity),
      },
    };
    dispatch({ type: 'UPDATE_CLIP', payload: { trackId: target.t.id, clip: next } });
    onNotice?.(selectedKey ? `Easing aplicado (${channel}): ${easing}` : 'No hay keyframe seleccionado');
  };

  return (
    <div className="space-y-2 text-xs text-zinc-300">
      <p className="text-[11px] text-zinc-400">Graph editor por canal y punto.</p>
      <div>
        <label className="text-[10px] uppercase tracking-wide text-zinc-500">Canal</label>
        <select
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1"
          value={channel}
          onChange={(e) => {
            const next = e.target.value as Channel;
            setChannel(next);
            setSelectedKeyId(target.c.keyframes[next][0]?.id ?? null);
          }}
        >
          <option value="positionX">Position X</option>
          <option value="positionY">Position Y</option>
          <option value="scaleX">Scale X</option>
          <option value="scaleY">Scale Y</option>
          <option value="rotation">Rotation</option>
          <option value="opacity">Opacity</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wide text-zinc-500">Punto</label>
        <select
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1"
          value={selectedKey?.id ?? ''}
          onChange={(e) => setSelectedKeyId(e.target.value || null)}
        >
          {currentChannel.map((k) => (
            <option key={k.id} value={k.id}>
              t={k.time.toFixed(2)} v={k.value.toFixed(2)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {EASINGS.map((e) => (
          <button key={e} type="button" className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 hover:bg-zinc-800 disabled:opacity-40" onClick={() => applyEasing(e)} disabled={!selectedKey}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
