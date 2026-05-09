'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { useEditorStore } from '@/features/editor/store/editorStore';
import type { Project } from '@/shared/types';
import { cn } from '@/shared/utils';
import { ep } from '@/features/editor/components/editorPanelUi';

const defaultAudioPro: NonNullable<Project['audioPro']> = {
  masterDb: 0,
  duckingEnabled: false,
  duckingAmountDb: -9,
  buses: [
    { id: 'dialog', name: 'Dialog', gainDb: 0 },
    { id: 'music', name: 'Music', gainDb: -6 },
    { id: 'sfx', name: 'SFX', gainDb: -3 },
  ],
};

export function AudioProPanel({ onNotice }: { onNotice?: (msg: string) => void }) {
  const { project, dispatch } = useEditorStore();
  const [meterL, setMeterL] = useState(0);
  const [meterR, setMeterR] = useState(0);
  const audioPro = project?.audioPro ?? defaultAudioPro;

  const patch = (next: NonNullable<Project['audioPro']>) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { audioPro: next } });
  };

  useEffect(() => {
    const video = document.querySelector('[data-openstudio-preview="video"]') as HTMLVideoElement | null;
    if (!video) return;
    const ACtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ACtx) return;
    const audioContext = new ACtx();
    let source: MediaElementAudioSourceNode | null = null;
    try {
      source = audioContext.createMediaElementSource(video);
    } catch {
      void audioContext.close();
      return;
    }
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const timer = window.setInterval(() => {
      analyser.getByteFrequencyData(data);
      let leftAcc = 0;
      let rightAcc = 0;
      const half = Math.floor(data.length / 2);
      for (let i = 0; i < half; i += 1) leftAcc += data[i];
      for (let i = half; i < data.length; i += 1) rightAcc += data[i];
      const left = Math.min(100, Math.round((leftAcc / Math.max(1, half) / 255) * 100));
      const right = Math.min(100, Math.round((rightAcc / Math.max(1, data.length - half) / 255) * 100));
      setMeterL(left);
      setMeterR(right);
    }, 200);
    return () => {
      window.clearInterval(timer);
      source?.disconnect();
      analyser.disconnect();
      void audioContext.close();
    };
  }, []);

  return (
    <div className={ep.root}>
      <p className={ep.intro}>Audio Pro: buses, ducking y mezcla base.</p>
      <div className={ep.card}>
        <label className={ep.label}>Master gain (dB)</label>
        <input
          type="range"
          min={-24}
          max={12}
          step={1}
          value={audioPro.masterDb}
          onChange={(e) => patch({ ...audioPro, masterDb: Number(e.target.value) })}
          className={ep.range}
        />
        <p className="text-[11px] text-[var(--os-text-secondary)]">{audioPro.masterDb} dB</p>
      </div>
      <div className={ep.card}>
        <label className={ep.checkboxRow}>
          <input
            type="checkbox"
            checked={audioPro.duckingEnabled}
            onChange={(e) => patch({ ...audioPro, duckingEnabled: e.target.checked })}
          />
          Ducking automatico (voz sobre musica)
        </label>
        <label className={cn(ep.label, 'mt-2')}>Ducking amount</label>
        <input
          type="range"
          min={-24}
          max={-3}
          step={1}
          value={audioPro.duckingAmountDb}
          onChange={(e) => patch({ ...audioPro, duckingAmountDb: Number(e.target.value) })}
          className={ep.range}
        />
      </div>
      <div className="space-y-2">
        <div className={ep.card}>
          <p className="text-[11px] font-medium text-[var(--os-text-primary)]">Runtime meters</p>
          <div className="mt-2 space-y-1.5">
            <div className={ep.meterTrack}>
              <div className={ep.meterFill} style={{ width: `${meterL}%` }} />
            </div>
            <div className={ep.meterTrack}>
              <div className={ep.meterFillAlt} style={{ width: `${meterR}%` }} />
            </div>
          </div>
        </div>
        {audioPro.buses.map((bus, idx) => (
          <div key={bus.id} className={ep.card}>
            <p className="text-[11px] font-medium text-[var(--os-text-primary)]">{bus.name}</p>
            <input
              type="range"
              min={-24}
              max={12}
              step={1}
              value={bus.gainDb}
              onChange={(e) => {
                const next = [...audioPro.buses];
                next[idx] = { ...next[idx], gainDb: Number(e.target.value) };
                patch({ ...audioPro, buses: next });
              }}
              className={ep.range}
            />
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-full text-[11px]"
        onClick={() => onNotice?.('Audio Pro configurado en proyecto.')}
      >
        Aplicar configuracion Audio Pro
      </Button>
    </div>
  );
}
