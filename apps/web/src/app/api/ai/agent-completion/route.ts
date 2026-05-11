import { NextResponse } from 'next/server';

/**
 * Proxy OpenAI-compatible chat/completions. The API key is only forwarded in this request
 * and is not persisted on the server. (Static export / packaged desktop does not include this route;
 * Electron uses IPC instead.)
 */
export async function POST(req: Request) {
  let body: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    messages?: Array<{ role: string; content: string }>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { apiKey, baseUrl, model, messages } = body;
  if (!apiKey || !baseUrl || !model || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Missing apiKey, baseUrl, model, or messages' }, { status: 400 });
  }

  const base = String(baseUrl).replace(/\/$/, '');
  const url = `${base}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });

  const text = await res.text();
  if (!res.ok) {
    return NextResponse.json({ error: text.slice(0, 4000) }, { status: res.status });
  }

  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: 'Upstream returned non-JSON' }, { status: 502 });
  }
}
