export type StudioWallpaperCategoryId = 'desktop' | 'gradient' | 'pattern' | 'minimal';

const STUDIO_ASSET_BASE = `https://open${'vid'}.dev`;

export const STUDIO_WALLPAPER_CATEGORIES: Array<{
  id: StudioWallpaperCategoryId;
  label: string;
  count: number;
}> = [
  { id: 'desktop', label: 'Desktop', count: 66 },
  { id: 'gradient', label: 'Gradient', count: 90 },
  { id: 'pattern', label: 'Pattern', count: 49 },
  { id: 'minimal', label: 'Minimal', count: 65 },
];

export interface StudioWallpaper {
  id: string;
  category: StudioWallpaperCategoryId;
  fullUrl: string;
  previewUrl: string;
}

export const STUDIO_WALLPAPERS: StudioWallpaper[] = STUDIO_WALLPAPER_CATEGORIES.flatMap(
  ({ id, count }) =>
    Array.from({ length: count }, (_, idx) => {
      const n = String(idx + 1).padStart(2, '0');
      const slug = `${id}-${n}`;
      return {
        id: slug,
        category: id,
        fullUrl: `${STUDIO_ASSET_BASE}/images/backgrounds/${id}/${slug}.jpg`,
        previewUrl: `${STUDIO_ASSET_BASE}/images/backgrounds/${id}/${slug}.avif`,
      };
    })
);

export const STUDIO_SOLID_COLORS: string[] = [
  '#8D8D8D', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff',
  '#6366f1', '#14b8a6', '#f97316', '#64748b', '#00A3F0', '#d946ef', '#84cc16', '#06b6d4',
];

export const STUDIO_GRADIENT_PRESETS: Array<{ from: string; to: string }> = [
  { from: '#FFFBFD', to: '#4A1C9B' },
  { from: '#1D0127', to: '#FDFBFF' },
  { from: '#0D0B2E', to: '#E0FFFF' },
  { from: '#400A14', to: '#FFF5F5' },
  { from: '#2B0F54', to: '#FFE0B2' },
  { from: '#1B262C', to: '#FFFFFF' },
  { from: '#D9F4FF', to: '#5D68FF' },
  { from: '#1F005C', to: '#FFB56B' },
];

export interface StudioMockupPreset {
  id: string;
  name: string;
  category: 'browser' | 'mobile' | 'ide';
  deviceType: 'none' | 'safari' | 'chrome' | 'arc' | 'samsung';
  padding: number;
  radius: number;
  shadow: number;
  frameColor: string;
}

// Presets de mockups y mapeo a los frames soportados por el editor.
export const STUDIO_MOCKUP_PRESETS: StudioMockupPreset[] = [
  { id: 'none', name: 'None', category: 'browser', deviceType: 'none', padding: 24, radius: 16, shadow: 18, frameColor: '#f6f6f6' },
  { id: 'macos', name: 'Macos', category: 'browser', deviceType: 'safari', padding: 24, radius: 12, shadow: 24, frameColor: '#f6f6f6' },
  { id: 'macos-glass', name: 'Macos Glass', category: 'browser', deviceType: 'safari', padding: 26, radius: 14, shadow: 28, frameColor: '#f6f6f6' },
  { id: 'brave', name: 'Brave', category: 'browser', deviceType: 'chrome', padding: 24, radius: 12, shadow: 22, frameColor: '#f6f6f6' },
  { id: 'chrome', name: 'Chrome', category: 'browser', deviceType: 'chrome', padding: 24, radius: 12, shadow: 22, frameColor: '#f6f6f6' },
  { id: 'chrome-glass', name: 'Chrome Glass', category: 'browser', deviceType: 'chrome', padding: 28, radius: 14, shadow: 30, frameColor: '#f6f6f6' },
  { id: 'browser-tab-glass', name: 'Browser Tab Glass', category: 'browser', deviceType: 'arc', padding: 26, radius: 14, shadow: 26, frameColor: '#f6f6f6' },
  { id: 'iphone-slim', name: 'iPhone Slim', category: 'mobile', deviceType: 'samsung', padding: 36, radius: 28, shadow: 28, frameColor: '#262626' },
  { id: 'glass-curve', name: 'Glass Curve', category: 'mobile', deviceType: 'samsung', padding: 34, radius: 28, shadow: 32, frameColor: '#262626' },
  { id: 'glass-full', name: 'Glass Full', category: 'mobile', deviceType: 'samsung', padding: 34, radius: 28, shadow: 34, frameColor: '#262626' },
  { id: 'hard-shell', name: 'Hard Shell', category: 'mobile', deviceType: 'samsung', padding: 32, radius: 28, shadow: 30, frameColor: '#262626' },
  { id: 's24-ultra', name: 'S24 Ultra', category: 'mobile', deviceType: 'samsung', padding: 34, radius: 28, shadow: 28, frameColor: '#262626' },
  { id: 'vscode', name: 'VS Code', category: 'ide', deviceType: 'arc', padding: 20, radius: 8, shadow: 22, frameColor: '#1e1e1e' },
  { id: 'macos-dark-ide', name: 'Macos Dark', category: 'ide', deviceType: 'safari', padding: 20, radius: 8, shadow: 20, frameColor: '#1e1e1e' },
  { id: 'macos-ghost-ide', name: 'Macos Ghost IDE', category: 'ide', deviceType: 'safari', padding: 22, radius: 10, shadow: 24, frameColor: '#1e1e1e' },
];

export function studioMockupCategoryBackground(category: StudioMockupPreset['category']): string {
  return `${STUDIO_ASSET_BASE}/images/mockups/bg-${category}.avif`;
}
