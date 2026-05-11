import { getDesktopBridge } from '@/shared/platform/desktop';

export type AgentProviderPreset = 'openai' | 'openrouter' | 'custom';

export interface AgentSettings {
  provider: AgentProviderPreset;
  /** Base URL sin barra final, ej. https://api.openai.com/v1 */
  baseUrl: string;
  model: string;
  apiKey: string;
}

const STORAGE_KEY = 'openstudio:agent:byok';

const PRESETS: Record<Exclude<AgentProviderPreset, 'custom'>, string> = {
  openai: 'https://api.openai.com/v1',
  openrouter: 'https://openrouter.ai/api/v1',
};

export function defaultBaseUrlForPreset(p: AgentProviderPreset): string {
  if (p === 'custom') return 'https://api.openai.com/v1';
  return PRESETS[p];
}

export function defaultAgentSettings(): AgentSettings {
  return {
    provider: 'openai',
    baseUrl: PRESETS.openai,
    model: 'gpt-4o-mini',
    apiKey: '',
  };
}

export async function loadAgentSettings(): Promise<AgentSettings> {
  const defaults = defaultAgentSettings();
  try {
    const desktop = getDesktopBridge();
    if (desktop?.storageGet) {
      const raw = await desktop.storageGet(STORAGE_KEY);
      if (raw && typeof raw === 'object') {
        return { ...defaults, ...(raw as Partial<AgentSettings>) };
      }
    }
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AgentSettings>;
        return { ...defaults, ...parsed };
      }
    }
  } catch {
    /* ignore */
  }
  return defaults;
}

export async function saveAgentSettings(settings: AgentSettings): Promise<void> {
  const desktop = getDesktopBridge();
  if (desktop?.storageSet) {
    await desktop.storageSet(STORAGE_KEY, settings);
    return;
  }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}
