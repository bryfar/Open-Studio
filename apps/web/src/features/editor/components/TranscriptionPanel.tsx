'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { OPENSHORTS_API_BASE } from '@/features/openshorts/lib/openshortsApi';

interface TranscribeSegment {
  start: number;
  end: number;
  text: string;
}

export function TranscriptionPanel({ onNotice }: { onNotice?: (msg: string) => void }) {
  const { project, dispatch, mediaFiles } = useEditorStore();
  const [language, setLanguage] = useState('es');
  const [running, setRunning] = useState(false);

  const runTranscription = async () => {
    const video = mediaFiles.find((m) => m.type.startsWith('video'));
    if (!project || !video?.url) return;
    setRunning(true);
    try {
      const res = await fetch(`${OPENSHORTS_API_BASE}/api/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_url: video.url, language }),
      });
      if (!res.ok) throw new Error(`Transcribe failed (${res.status})`);
      const data = (await res.json()) as { segments: TranscribeSegment[] };
      const cues = data.segments.map((s, idx) => ({
        id: `asr_${idx}_${Date.now()}`,
        start: s.start,
        end: s.end,
        text: s.text,
        track: 1,
      }));
      dispatch({
        type: 'UPDATE_PROJECT',
        payload: {
          subtitles: {
            cues,
            sourceLanguage: language,
            generatedBy: 'asr',
          },
        },
      });
      onNotice?.(`Transcripción generada (${cues.length} segmentos).`);
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : 'Error transcribiendo');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-3 text-xs text-zinc-300">
      <p className="text-[11px] text-zinc-400">ASR editable: genera cues de subtítulos en el proyecto.</p>
      <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-2">
        <option value="es">Español</option>
        <option value="en">English</option>
        <option value="pt">Português</option>
      </select>
      <Button type="button" variant="secondary" className="w-full" onClick={() => void runTranscription()} disabled={running}>
        {running ? 'Transcribiendo...' : 'Run auto-transcription'}
      </Button>
    </div>
  );
}
