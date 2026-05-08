import { getDesktopBridge, type DesktopSaveFilter } from '@/shared/platform/desktop';

export async function saveBlobWithPlatform(
  blob: Blob,
  defaultFileName: string,
  filters?: DesktopSaveFilter[]
): Promise<boolean> {
  const desktop = getDesktopBridge();
  if (desktop) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const result = await desktop.saveBytes({ defaultFileName, bytes, filters });
    return !result.canceled;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}

export async function saveTextWithPlatform(
  text: string,
  defaultFileName: string,
  filters?: DesktopSaveFilter[]
): Promise<boolean> {
  const desktop = getDesktopBridge();
  if (desktop) {
    const result = await desktop.saveText({ defaultFileName, text, filters });
    return !result.canceled;
  }
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  return saveBlobWithPlatform(blob, defaultFileName, filters);
}
