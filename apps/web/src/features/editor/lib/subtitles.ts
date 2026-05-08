import type { Project } from '@/shared/types';

export interface SubtitleCue {
  id: string;
  start: number;
  end: number;
  text: string;
  track: number;
}

function toTimestamp(sec: number, vtt: boolean): string {
  const totalMs = Math.max(0, Math.round(sec * 1000));
  const hh = Math.floor(totalMs / 3600000);
  const mm = Math.floor((totalMs % 3600000) / 60000);
  const ss = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  const msSep = vtt ? '.' : ',';
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}${msSep}${String(ms).padStart(3, '0')}`;
}

function parseTimestamp(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  const parts = normalized.split(':');
  if (parts.length !== 3) return null;
  const hh = Number(parts[0]);
  const mm = Number(parts[1]);
  const secParts = parts[2].split('.');
  const ss = Number(secParts[0]);
  const ms = Number(secParts[1] ?? 0);
  if ([hh, mm, ss, ms].some(Number.isNaN)) return null;
  return hh * 3600 + mm * 60 + ss + ms / 1000;
}

export function exportSubtitles(cues: SubtitleCue[], format: 'srt' | 'vtt'): string {
  const sorted = [...cues].sort((a, b) => a.start - b.start);
  const body = sorted
    .map((cue, idx) => {
      const start = toTimestamp(cue.start, format === 'vtt');
      const end = toTimestamp(cue.end, format === 'vtt');
      return `${idx + 1}\n${start} --> ${end}\n${cue.text.trim()}`;
    })
    .join('\n\n');
  return format === 'vtt' ? `WEBVTT\n\n${body}\n` : `${body}\n`;
}

export function importSubtitles(raw: string): SubtitleCue[] {
  const chunks = raw
    .replace(/^WEBVTT\s*/i, '')
    .split(/\n\s*\n/g)
    .map((c) => c.trim())
    .filter(Boolean);
  const cues: SubtitleCue[] = [];
  for (const chunk of chunks) {
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
    const timeLineIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeLineIdx < 0) continue;
    const [left, right] = lines[timeLineIdx].split('-->').map((s) => s.trim());
    const start = parseTimestamp(left);
    const end = parseTimestamp(right);
    if (start == null || end == null || end <= start) continue;
    const text = lines.slice(timeLineIdx + 1).join(' ').trim();
    if (!text) continue;
    cues.push({
      id: `cue_${cues.length + 1}_${Math.random().toString(36).slice(2, 8)}`,
      start,
      end,
      text,
      track: 1,
    });
  }
  return cues;
}

export function ensureSubtitles(project: Project): Project {
  if (project.subtitles) return project;
  return {
    ...project,
    subtitles: {
      cues: [],
      sourceLanguage: 'es',
      generatedBy: 'manual',
    },
  };
}
