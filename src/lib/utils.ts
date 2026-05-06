import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

/** HH:MM:SS:FF para cabezal / duración (FPS del proyecto). */
export function formatTimecode(seconds: number, fps: number): string {
  const safeFps = Math.max(1, Math.round(fps));
  const clamped = Math.max(0, seconds);
  const wholeSeconds = Math.floor(clamped);
  const h = Math.floor(wholeSeconds / 3600);
  const m = Math.floor((wholeSeconds % 3600) / 60);
  const s = wholeSeconds % 60;
  const frameMax = Math.max(0, safeFps - 1);
  const f = Math.min(
    frameMax,
    Math.max(0, Math.floor((clamped - wholeSeconds) * safeFps + 1e-9))
  );
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function getEffectiveClipDuration(duration: number, speed?: number): number {
  return duration / Math.max(0.1, speed ?? 1);
}

export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

export function isVideoFile(type: string): boolean {
  return type.startsWith('video/');
}

export function isAudioFile(type: string): boolean {
  return type.startsWith('audio/');
}

export function isImageFile(type: string): boolean {
  return type.startsWith('image/');
}

export async function createThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (file.type.startsWith('video/') || file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      resolve(url);
    } else {
      resolve('');
    }
  });
}

export const timelineColors = {
  video: '#35b7f5',
  audio: '#7fd0ff',
  text: '#a98cff',
  image: '#59d6a9',
  background: '#5a6578',
};