'use client';

import { useEffect, useMemo, useState } from 'react';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { ep } from '@/features/editor/components/editorPanelUi';

export function ScopesPanel() {
  const { project, currentTime } = useEditorStore();
  const [realScopes, setRealScopes] = useState<{
    waveform: number;
    vectorscope: number;
    histogram: number;
  } | null>(null);

  useEffect(() => {
    const video = document.querySelector('[data-openstudio-preview="video"]') as HTMLVideoElement | null;
    if (!video) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const sample = () => {
      if (!video.videoWidth || !video.videoHeight) return;
      const w = 120;
      const h = 68;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let lumaAcc = 0;
      let chromaAcc = 0;
      const bins = new Array<number>(8).fill(0);
      const pixels = w * h;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        lumaAcc += luma;
        chromaAcc += Math.abs(r - g) + Math.abs(g - b);
        bins[Math.min(7, Math.floor(luma / 32))] += 1;
      }
      const waveform = Math.min(100, Math.round((lumaAcc / pixels / 255) * 100));
      const vectorscope = Math.min(100, Math.round((chromaAcc / pixels / 510) * 100));
      const maxBin = Math.max(...bins);
      const histogram = Math.min(100, Math.round((maxBin / pixels) * 100 * 2));
      setRealScopes({ waveform, vectorscope, histogram });
    };
    const id = window.setInterval(sample, 350);
    sample();
    return () => window.clearInterval(id);
  }, [currentTime]);

  const metrics = useMemo(() => {
    if (realScopes) return realScopes;
    const clipCount = project?.tracks.reduce((acc, t) => acc + t.clips.length, 0) ?? 0;
    const signal = Math.min(100, Math.round((currentTime * 7 + clipCount * 3) % 101));
    return {
      waveform: signal,
      vectorscope: Math.min(100, (signal + 21) % 100),
      histogram: Math.min(100, (signal + 47) % 100),
    };
  }, [project, currentTime, realScopes]);

  return (
    <div className={ep.root}>
      <p className={ep.intro}>
        Scopes de color ({realScopes ? 'señal real del preview' : 'fallback sintético'}).
      </p>
      {Object.entries(metrics).map(([name, value]) => (
        <div key={name} className={ep.card}>
          <p className="mb-1 text-[11px] font-medium capitalize text-[var(--os-text-secondary)]">{name}</p>
          <div className={ep.meterTrack}>
            <div className={ep.meterFill} style={{ width: `${value}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
