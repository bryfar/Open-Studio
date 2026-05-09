export interface DesktopSaveFilter {
  name: string;
  extensions: string[];
}

export interface DesktopSaveResult {
  canceled: boolean;
  filePath?: string;
}

export interface DesktopOpenExternalResult {
  ok: boolean;
}

export interface DesktopBridge {
  isDesktop: boolean;
  storageGet: (key: string) => Promise<unknown>;
  storageSet: (key: string, value: unknown) => Promise<boolean>;
  storageDel: (key: string) => Promise<boolean>;
  saveBytes: (payload: {
    defaultFileName: string;
    bytes: Uint8Array;
    filters?: DesktopSaveFilter[];
  }) => Promise<DesktopSaveResult>;
  saveText: (payload: {
    defaultFileName: string;
    text: string;
    filters?: DesktopSaveFilter[];
  }) => Promise<DesktopSaveResult>;
  /** Abre una URL en el navegador del sistema (solo escritorio empaquetado). */
  openExternal?: (url: string) => Promise<DesktopOpenExternalResult>;
}

declare global {
  interface Window {
    openStudioDesktop?: DesktopBridge;
  }
}

export function getDesktopBridge(): DesktopBridge | null {
  if (typeof window === 'undefined') return null;
  if (!window.openStudioDesktop?.isDesktop) return null;
  return window.openStudioDesktop;
}

export function isDesktopRuntime(): boolean {
  return Boolean(getDesktopBridge());
}

/**
 * URL para iniciar sesión / vincular cuenta web desde la app de escritorio.
 * Define `NEXT_PUBLIC_WEB_ACCOUNT_LOGIN_URL` (https…) para producción; si no, usa el origen actual + `/login`.
 */
export function resolveWebAccountLoginUrl(): string {
  const fromEnv =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WEB_ACCOUNT_LOGIN_URL
      ? process.env.NEXT_PUBLIC_WEB_ACCOUNT_LOGIN_URL.trim()
      : '';
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    return fromEnv;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/login`;
  }
  return 'http://127.0.0.1:3000/login';
}
