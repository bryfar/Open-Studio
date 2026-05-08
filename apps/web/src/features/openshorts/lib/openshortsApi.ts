export const OPENSHORTS_API_BASE =
  process.env.NEXT_PUBLIC_OPENSHORTS_API_URL ?? 'http://localhost:8000';

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data?.detail ?? data?.error ?? message;
    } catch {
      // ignore json parse failure
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export interface ClipAnalyzeResponse {
  job_id: string;
}

export interface AIAnalyzeResponse {
  job_id: string;
}

export interface JobStatusResponse<T = unknown> {
  job_id: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  logs: string[];
  result?: T;
  error?: string;
}

export async function analyzeClipGenerator(
  formData: FormData,
  apiKey?: string
): Promise<ClipAnalyzeResponse> {
  const res = await fetch(`${OPENSHORTS_API_BASE}/api/clip-generator/analyze`, {
    method: 'POST',
    headers: apiKey ? { 'X-Gemini-Key': apiKey } : undefined,
    body: formData,
  });
  return parseResponse<ClipAnalyzeResponse>(res);
}

export async function generateClipGenerator(
  payload: { job_id: string; target_platform: string },
  apiKey?: string
): Promise<ClipAnalyzeResponse> {
  const res = await fetch(`${OPENSHORTS_API_BASE}/api/clip-generator/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'X-Gemini-Key': apiKey } : {}),
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<ClipAnalyzeResponse>(res);
}

export async function analyzeAIShorts(
  payload: {
    url?: string;
    description?: string;
    num_scripts: number;
    style: string;
    language: string;
    actor_gender: string;
  },
  geminiApiKey: string
): Promise<AIAnalyzeResponse> {
  const res = await fetch(`${OPENSHORTS_API_BASE}/api/ai-shorts/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Gemini-Key': geminiApiKey,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<AIAnalyzeResponse>(res);
}

export async function generateAIShorts(
  payload: {
    job_id: string;
    selected_script: number;
    video_mode: 'lowcost' | 'premium';
    voice_id?: string;
    actor_description?: string;
  },
  keys: { falKey: string; elevenLabsKey: string }
): Promise<AIAnalyzeResponse> {
  const res = await fetch(`${OPENSHORTS_API_BASE}/api/ai-shorts/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Fal-Key': keys.falKey,
      'X-ElevenLabs-Key': keys.elevenLabsKey,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<AIAnalyzeResponse>(res);
}

export async function getJobStatus<T = unknown>(jobId: string): Promise<JobStatusResponse<T>> {
  const res = await fetch(`${OPENSHORTS_API_BASE}/api/jobs/${jobId}`, {
    method: 'GET',
    cache: 'no-store',
  });
  return parseResponse<JobStatusResponse<T>>(res);
}

export function resolveArtifactUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return pathOrUrl;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  return `${OPENSHORTS_API_BASE}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

export async function publishShort(
  payload: { job_id: string; platforms: string[]; schedule_at?: string },
  uploadPostApiKey: string
) {
  const res = await fetch(`${OPENSHORTS_API_BASE}/api/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Upload-Post-Key': uploadPostApiKey,
    },
    body: JSON.stringify(payload),
  });
  return parseResponse<{ ok: boolean; detail: string }>(res);
}
