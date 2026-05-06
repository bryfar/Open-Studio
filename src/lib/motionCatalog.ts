/**
 * Catálogos de efectos, filtros y transiciones.
 * Nomenclatura alineada con flujos de edición web y transiciones de escritorio
 * y composición con keyframes (enfoque Remotion: animación explícita en el tiempo).
 * 
 * Ahora usando la librería extendida inspirada en CapCut, Premiere Pro, DaVinci Resolve
 */
import { 
  EXTENDED_EFFECTS, 
  EXTENDED_FILTERS, 
  EXTENDED_TRANSITIONS,
  EFFECT_CATEGORIES,
  FILTER_CATEGORIES,
  TRANSITION_CATEGORIES
} from './effectsLibrary';

export type MotionPreset = {
  id: string;
  name: string;
  nameEs: string;
  kind: 'effect' | 'filter' | 'transition';
  category?: string;
  supportedNow: boolean;
  duration?: number;
  hint?: string;
  previewType?: 'gradient' | 'animated' | 'icon';
  previewColors?: string[];
};

// Mapear efectos extendidos al formato anterior para compatibilidad
export const EFFECT_PRESETS: MotionPreset[] = EXTENDED_EFFECTS.map(effect => ({
  id: effect.id,
  name: effect.name,
  nameEs: effect.nameEs,
  kind: 'effect',
  category: effect.category,
  supportedNow: effect.supportedNow,
  hint: effect.hint,
  previewType: effect.previewType,
}));

// Mapear filtros extendidos
export const FILTER_PRESETS: MotionPreset[] = EXTENDED_FILTERS.map(filter => ({
  id: filter.id,
  name: filter.name,
  nameEs: filter.nameEs,
  kind: 'filter',
  category: filter.category,
  supportedNow: filter.supportedNow,
  hint: filter.hint,
  previewColors: filter.previewColors,
}));

// Mapear transiciones extendidas
export const TRANSITION_PRESETS: MotionPreset[] = EXTENDED_TRANSITIONS.map(transition => ({
  id: transition.id,
  name: transition.name,
  nameEs: transition.nameEs,
  kind: 'transition',
  category: transition.category,
  supportedNow: transition.supportedNow,
  duration: transition.duration,
  hint: transition.hint,
}));

// Exportar categorías para la UI
export const EFFECT_CATEGORIES_LIST = EFFECT_CATEGORIES;
export const FILTER_CATEGORIES_LIST = FILTER_CATEGORIES;
export const TRANSITION_CATEGORIES_LIST = TRANSITION_CATEGORIES;

// Exportar funciones helper
export { getEffectsByCategory, getFiltersByCategory, getTransitionsByCategory } from './effectsLibrary';

// =====================
// LEGACY COMPATIBILITY - Keep old format for existing code
// =====================

export interface LegacyMotionPreset {
  id: string;
  name: string;
  kind: 'effect' | 'filter' | 'transition';
  supportedNow: boolean;
  duration?: number;
  hint?: string;
}

export const LEGACY_EFFECT_PRESETS: LegacyMotionPreset[] = [
  { id: 'blur', name: 'Desenfoque', kind: 'effect', supportedNow: true, hint: 'Desenfoque base' },
  { id: 'motion-blur', name: 'Motion blur', kind: 'effect', supportedNow: true, hint: 'Movimiento' },
  { id: 'brightness', name: 'Brillo', kind: 'effect', supportedNow: true },
  { id: 'contrast', name: 'Contraste', kind: 'effect', supportedNow: true },
  { id: 'saturate', name: 'Saturación', kind: 'effect', supportedNow: true, hint: 'HSL' },
  { id: 'hue-rotate', name: 'Tono (matiz)', kind: 'effect', supportedNow: true },
  { id: 'grayscale', name: 'Escala de grises', kind: 'effect', supportedNow: true },
  { id: 'sepia', name: 'Sepia', kind: 'effect', supportedNow: true },
  { id: 'invert', name: 'Inverso', kind: 'effect', supportedNow: true },
  { id: 'shadow', name: 'Sombra', kind: 'effect', supportedNow: true },
  { id: 'glow', name: 'Brillo / resplandor', kind: 'effect', supportedNow: true },
  { id: 'chromatic-aberration', name: 'Aberración cromática', kind: 'effect', supportedNow: true },
  { id: 'shake', name: 'Temblor', kind: 'effect', supportedNow: true },
];

export const LEGACY_FILTER_PRESETS: LegacyMotionPreset[] = [
  { id: 'cinematic', name: 'Cine (contraste)', kind: 'filter', supportedNow: true, hint: 'Teal & sombra' },
  { id: 'vivid', name: 'Vívido', kind: 'filter', supportedNow: true },
  { id: 'warm', name: 'Cálido', kind: 'filter', supportedNow: true },
  { id: 'cool', name: 'Frío', kind: 'filter', supportedNow: true },
  { id: 'mono', name: 'Monocromo', kind: 'filter', supportedNow: true, hint: 'Alta ley' },
  { id: 'retro', name: 'Retro / VHS', kind: 'filter', supportedNow: true },
  { id: 'bleach', name: 'Blanqueado', kind: 'filter', supportedNow: true, hint: 'Alta luz' },
  { id: 'noir', name: 'Noir', kind: 'filter', supportedNow: true, hint: 'Contraste duro' },
  { id: 'pastel', name: 'Pastel', kind: 'filter', supportedNow: true },
];

export const LEGACY_TRANSITION_PRESETS: LegacyMotionPreset[] = [
  { id: 'cut', name: 'Corte', kind: 'transition', supportedNow: true, duration: 0 },
  { id: 'fade', name: 'Fundido', kind: 'transition', supportedNow: true, duration: 0.35, hint: 'Dissolve' },
  { id: 'cross-zoom', name: 'Zoom cruzado', kind: 'transition', supportedNow: true, duration: 0.45, hint: 'Escala + fundido' },
  { id: 'slide-left', name: 'Deslizar ←', kind: 'transition', supportedNow: true, duration: 0.35 },
  { id: 'slide-right', name: 'Deslizar →', kind: 'transition', supportedNow: true, duration: 0.35 },
  { id: 'slide-up', name: 'Deslizar ↑', kind: 'transition', supportedNow: true, duration: 0.35 },
  { id: 'slide-down', name: 'Deslizar ↓', kind: 'transition', supportedNow: true, duration: 0.35 },
  { id: 'flash', name: 'Flash', kind: 'transition', supportedNow: true, duration: 0.22, hint: 'Entrada luminosa' },
  { id: 'glitch', name: 'Glitch', kind: 'transition', supportedNow: true, duration: 0.28, hint: 'RGB desplazado' },
];