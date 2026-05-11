'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  loadAgentSettings,
  saveAgentSettings,
  defaultBaseUrlForPreset,
  type AgentProviderPreset,
  type AgentSettings,
} from '@/core/lib/agentSettings';
import { chatCompletionOpenAICompatible } from '@/features/editor/lib/agentCompletion';
import { useEditorStore } from '@/features/editor/store/editorStore';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { getDesktopBridge } from '@/shared/platform/desktop';
import { cn } from '@/shared/utils';

const HYPERFRAMES_SYSTEM = `You are helping author a HeyGen Hyperframes composition: HTML with data attributes on a root #stage element, optional GSAP/Tailwind v4 patterns.
Respond with a single complete HTML document when asked for composition. Prefer minimal external URLs; use placeholder paths if needed.
Wrap the HTML in a markdown fenced block like \`\`\`html ... \`\`\` when including code.
Official docs: https://github.com/heygen-com/hyperframes and https://hyperframes.heygen.com/introduction`;

function extractHtmlFromAssistant(content: string): string | null {
  const fence = content.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fence?.[1]?.trim()) return fence[1].trim();
  const trimmed = content.trim();
  if (trimmed.includes('<!DOCTYPE') || /<html[\s>]/i.test(trimmed)) return trimmed;
  return null;
}

export function HyperframesAgentPanel({ onNotice }: { onNotice?: (msg: string) => void }) {
  const project = useEditorStore((s) => s.project);
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [prompt, setPrompt] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [renderLog, setRenderLog] = useState<string | null>(null);
  useEffect(() => {
    void loadAgentSettings().then(setSettings);
  }, []);

  const persist = useCallback(
    async (next: AgentSettings) => {
      setSettings(next);
      await saveAgentSettings(next);
    },
    []
  );

  const onPresetChange = (preset: AgentProviderPreset) => {
    if (!settings) return;
    void persist({
      ...settings,
      provider: preset,
      baseUrl: preset === 'custom' ? settings.baseUrl : defaultBaseUrlForPreset(preset),
    });
  };

  const runGenerate = async () => {
    if (!settings?.apiKey.trim()) {
      onNotice?.('Configura tu API key en el panel.');
      return;
    }
    const userPrompt =
      prompt.trim() ||
      'Generate a simple 10s Hyperframes HTML composition: title fade-in on dark background, 1920x1080.';
    const contextHint = project
      ? `Current editor project name: "${project.name}". Duration ~${project.duration}s.`
      : 'No project loaded.';
    setBusy(true);
    setAssistantReply('');
    setRenderLog(null);
    try {
      const result = await chatCompletionOpenAICompatible({
        apiKey: settings.apiKey.trim(),
        baseUrl: settings.baseUrl.trim(),
        model: settings.model.trim() || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: HYPERFRAMES_SYSTEM },
          {
            role: 'user',
            content: `${contextHint}\n\nUser request:\n${userPrompt}`,
          },
        ],
      });
      if (!result.ok) {
        onNotice?.(`Error API: ${result.error}`);
        setBusy(false);
        return;
      }
      const content = result.data.choices?.[0]?.message?.content ?? '';
      setAssistantReply(typeof content === 'string' ? content : JSON.stringify(content));
      const html = extractHtmlFromAssistant(typeof content === 'string' ? content : '');
      setPreviewHtml(html);
      if (html) onNotice?.('HTML generado. Revisa la vista previa.');
      else onNotice?.('Respuesta sin bloque HTML detectado; revisa el texto.');
    } catch (e) {
      onNotice?.(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const downloadHtml = () => {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hyperframes-composition.html';
    a.click();
    URL.revokeObjectURL(url);
    onNotice?.('Descarga iniciada.');
  };

  const runDesktopRender = async () => {
    if (!previewHtml) {
      onNotice?.('Genera y extrae HTML primero.');
      return;
    }
    const d = getDesktopBridge();
    if (!d?.hyperframesRender) {
      onNotice?.('Render MP4 solo en la app de escritorio (Electron).');
      return;
    }
    setBusy(true);
    setRenderLog(null);
    try {
      const res = await d.hyperframesRender({ html: previewHtml });
      setRenderLog(res.log ?? '');
      if (res.ok && res.outputPath) {
        onNotice?.(`Vídeo generado: ${res.outputPath}`);
      } else if (!res.ok) {
        onNotice?.(res.error);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!settings) {
    return (
      <div className="panel-scroll flex flex-col gap-3 p-3 text-xs text-[var(--os-text-muted)]">
        Cargando…
      </div>
    );
  }

  return (
    <div className="panel-scroll flex flex-col gap-3 p-3">
      <div className="rounded-xl border border-[var(--os-border-default)] bg-[var(--os-bg-panel-2)] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--os-text-secondary)]">
          Proveedor (BYOK)
        </p>
        <div className="mt-2 grid gap-2">
          <select
            className="ui-select h-9 w-full text-xs"
            value={settings.provider}
            onChange={(e) => onPresetChange(e.target.value as AgentProviderPreset)}
          >
            <option value="openai">OpenAI API</option>
            <option value="openrouter">OpenRouter</option>
            <option value="custom">Base URL personalizada</option>
          </select>
          <label className="text-[11px] text-[var(--os-text-secondary)]">
            Base URL
            <Input
              className="mt-1 font-mono text-[11px]"
              value={settings.baseUrl}
              onChange={(e) => void persist({ ...settings, baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
            />
          </label>
          <label className="text-[11px] text-[var(--os-text-secondary)]">
            Modelo
            <Input
              className="mt-1 text-[11px]"
              value={settings.model}
              onChange={(e) => void persist({ ...settings, model: e.target.value })}
              placeholder="gpt-4o-mini"
            />
          </label>
          <label className="text-[11px] text-[var(--os-text-secondary)]">
            API key (solo en este dispositivo)
            <Input
              type="password"
              className="mt-1 font-mono text-[11px]"
              value={settings.apiKey}
              onChange={(e) => void persist({ ...settings, apiKey: e.target.value })}
              placeholder="sk-…"
              autoComplete="off"
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--os-border-default)] bg-[var(--os-bg-panel-2)] p-3">
        <p className="text-[11px] text-[var(--os-text-secondary)]">
          Hyperframes (HeyGen): HTML → vídeo. La app web usa el proxy /api en desarrollo; el escritorio envía la key
          solo al proceso principal.
        </p>
        <textarea
          className={cn(
            'mt-2 min-h-[88px] w-full resize-y rounded-lg border border-[var(--os-border-default)]',
            'bg-[var(--os-bg-app)] px-2 py-2 text-[11px] text-[var(--os-text-primary)] placeholder:text-[var(--os-text-muted)]'
          )}
          placeholder="Describe la composición (título, duración, estilo)…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="mt-2 w-full"
          disabled={busy}
          onClick={() => void runGenerate()}
        >
          {busy ? 'Generando…' : 'Generar con IA'}
        </Button>
      </div>

      {assistantReply ? (
        <div className="rounded-xl border border-[var(--os-border-default)] bg-[var(--os-surface-1)] p-2">
          <p className="text-[10px] font-medium text-[var(--os-text-muted)]">Respuesta</p>
          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[10px] text-[var(--os-text-primary)]">
            {assistantReply.slice(0, 12000)}
            {assistantReply.length > 12000 ? '…' : ''}
          </pre>
        </div>
      ) : null}

      {previewHtml ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={downloadHtml}>
              Descargar HTML
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => void runDesktopRender()}>
              Render MP4 (solo escritorio)
            </Button>
          </div>
          <p className="text-[10px] text-[var(--os-text-muted)]">
            Vista previa (sandbox): puede fallar si el HTML usa recursos externos bloqueados.
          </p>
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-[var(--os-border-default)] bg-black">
            <iframe
              title="Hyperframes preview"
              className="h-full w-full"
              sandbox="allow-scripts allow-same-origin"
              srcDoc={previewHtml}
            />
          </div>
        </div>
      ) : null}

      {renderLog ? (
        <div className="rounded-lg border border-[var(--os-border-default)] bg-[var(--os-bg-canvas)] p-2">
          <p className="text-[10px] font-medium text-[var(--os-text-muted)]">Log render (desktop)</p>
          <pre className="mt-1 max-h-32 overflow-auto text-[10px] text-[var(--os-text-secondary)]">{renderLog}</pre>
        </div>
      ) : null}
    </div>
  );
}
