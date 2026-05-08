export interface DesktopSaveFilter {
  name: string;
  extensions: string[];
}

export interface DesktopSaveResult {
  canceled: boolean;
  filePath?: string;
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
