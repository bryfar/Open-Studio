'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { createClip, createTrack, useEditorStore } from '@/features/editor/store/editorStore';
import { exportSubtitles, importSubtitles } from '@/features/editor/lib/subtitles';

export function SubtitleTrackPanel({ onNotice }: { onNotice?: (msg: string) => void }) {
  const { project, dispatch, currentTime } = useEditorStore();
  const [format, setFormat] = useState<'srt' | 'vtt'>('srt');
  const [raw, setRaw] = useState('');
  const cues = project?.subtitles?.cues ?? [];

  const updateCues = (next: typeof cues, generatedBy: 'manual' | 'asr' = 'manual') => {
    if (!project) return;
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        subtitles: {
          cues: next,
          sourceLanguage: project.subtitles?.sourceLanguage ?? 'es',
          generatedBy,
        },
      },
    });
  };

  const addCueAtPlayhead = () => {
    const cue = {
      id: `cue_${Date.now()}`,
      start: currentTime,
      end: currentTime + 2.5,
      text: 'Nuevo subtítulo',
      track: 1,
    };
    updateCues([...cues, cue]);
  };

  const importFromRaw = () => {
    const parsed = importSubtitles(raw);
    updateCues(parsed);
    onNotice?.(`Subtítulos importados: ${parsed.length}`);
  };

  const exportToRaw = () => {
    setRaw(exportSubtitles(cues, format));
  };

  const pushToTimelineTextTrack = () => {
    if (!project) return;
    let textTrack = project.tracks.find((t) => t.type === 'text');
    if (!textTrack) {
      textTrack = createTrack('Subtitle Track', 'text');
      dispatch({ type: 'ADD_TRACK', payload: textTrack });
    }
    for (const cue of cues) {
      const clip = createClip(textTrack.id, 'text', cue.text.slice(0, 28), cue.start, cue.end - cue.start);
      clip.text = cue.text;
      clip.fontSize = 34;
      clip.color = '#ffffff';
      dispatch({ type: 'ADD_CLIP', payload: { trackId: textTrack.id, clip } });
    }
    onNotice?.('Subtítulos enviados a timeline.');
  };

  return (
    <div className="space-y-3 text-xs text-zinc-300">
      <p className="text-[11px] text-zinc-400">Subtítulos nativos (cues) con import/export SRT/VTT.</p>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" onClick={addCueAtPlayhead}>Add cue at playhead</Button>
        <Button type="button" variant="ghost" onClick={pushToTimelineTextTrack}>Push to text track</Button>
      </div>
      <div className="grid grid-cols-3 gap-2 items-center">
        <label className="text-[11px] text-zinc-500">Formato</label>
        <select className="col-span-2 rounded border border-zinc-700 bg-zinc-900 px-2 py-1" value={format} onChange={(e) => setFormat(e.target.value as 'srt' | 'vtt')}>
          <option value="srt">SRT</option>
          <option value="vtt">VTT</option>
        </select>
      </div>
      <textarea
        rows={8}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="Pega aquí SRT/VTT o usa Export para generarlo..."
        className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-2 text-[11px]"
      />
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" onClick={importFromRaw}>Import</Button>
        <Button type="button" variant="secondary" onClick={exportToRaw}>Export</Button>
      </div>
      <p className="text-[11px] text-zinc-500">Cues actuales: {cues.length}</p>
    </div>
  );
}
