import { getDesktopBridge } from '@/shared/platform/desktop';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type OpenAICompatResponse = {
  choices?: Array<{ message?: { role: string; content: string | null } }>;
  error?: { message?: string };
};

export type AgentCompletionResult =
  | { ok: true; data: OpenAICompatResponse }
  | { ok: false; status: number; error: string };

export async function chatCompletionOpenAICompatible(payload: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ChatMessage[];
}): Promise<AgentCompletionResult> {
  const desktop = getDesktopBridge();
  if (desktop?.aiChatCompletion) {
    const r = await desktop.aiChatCompletion(payload);
    if (!r.ok) return r;
    return { ok: true, data: r.data as OpenAICompatResponse };
  }

  const res = await fetch('/api/ai/agent-completion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, error: text.slice(0, 2000) };
  }
  try {
    const data = JSON.parse(text) as OpenAICompatResponse;
    return { ok: true, data };
  } catch {
    return { ok: false, status: 500, error: 'Invalid JSON from proxy' };
  }
}
