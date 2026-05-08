/**
 * Extended Effects Library - Inspired by CapCut, Premiere Pro, DaVinci Resolve
 * Comprehensive list of video effects, filters, and transitions
 */

// =====================
// VIDEO EFFECTS
// =====================

export type EffectCategory = 
  | 'blur'
  | 'color'
  | 'distort'
  | 'stylize'
  | 'generate'
  | 'keying'
  | 'transform'
  | 'time'
  | 'lighting'
  | 'noise';

export interface VideoEffect {
  id: string;
  name: string;
  nameEs: string;
  category: EffectCategory;
  supportedNow: boolean;
  description?: string;
  hint?: string;
  previewType: 'gradient' | 'animated' | 'icon';
  intensity?: number;
}

export const EXTENDED_EFFECTS: VideoEffect[] = [
  // BLUR EFFECTS
  { id: 'gaussian-blur', name: 'Gaussian Blur', nameEs: 'Desenfoque gaussiano', category: 'blur', supportedNow: true, hint: 'Suavizado general', previewType: 'gradient' },
  { id: 'motion-blur', name: 'Motion Blur', nameEs: 'Desenfoque de movimiento', category: 'blur', supportedNow: true, hint: 'Efecto de velocidad', previewType: 'animated' },
  { id: 'radial-blur', name: 'Radial Blur', nameEs: 'Desenfoque radial', category: 'blur', supportedNow: true, hint: 'Desenfoque desde centro', previewType: 'gradient' },
  { id: 'zoom-blur', name: 'Zoom Blur', nameEs: 'Desenfoque de zoom', category: 'blur', supportedNow: true, hint: 'Efecto zoom', previewType: 'animated' },
  { id: 'direction-blur', name: 'Directional Blur', nameEs: 'Desenfoque direccional', category: 'blur', supportedNow: true, hint: 'Desenfoque direccionado', previewType: 'animated' },
  { id: 'tilt-blur', name: 'Tilt Blur', nameEs: 'Desenfoque inclinación', category: 'blur', supportedNow: true, hint: 'Tilt-shift effect', previewType: 'gradient' },
  { id: 'surface-blur', name: 'Surface Blur', nameEs: 'Desenfoque de superficie', category: 'blur', supportedNow: true, hint: 'Suaviza texturas', previewType: 'gradient' },

  // COLOR EFFECTS
  { id: 'brightness', name: 'Brightness', nameEs: 'Brillo', category: 'color', supportedNow: true, previewType: 'gradient' },
  { id: 'contrast', name: 'Contrast', nameEs: 'Contraste', category: 'color', supportedNow: true, previewType: 'gradient' },
  { id: 'saturation', name: 'Saturation', nameEs: 'Saturación', category: 'color', supportedNow: true, previewType: 'gradient' },
  { id: 'hue-rotate', name: 'Hue Rotate', nameEs: 'Rotar tono', category: 'color', supportedNow: true, hint: 'Cambiar colores', previewType: 'gradient' },
  { id: 'temperature', name: 'Temperature', nameEs: 'Temperatura', category: 'color', supportedNow: true, hint: 'Tibia/Fría', previewType: 'gradient' },
  { id: 'tint', name: 'Tint', nameEs: 'Tinte', category: 'color', supportedNow: true, hint: 'Agregar tinte de color', previewType: 'gradient' },
  { id: 'vibrance', name: 'Vibrance', nameEs: 'Intensidad', category: 'color', supportedNow: true, hint: 'Colores intensos', previewType: 'gradient' },
  { id: 'color-balance', name: 'Color Balance', nameEs: 'Balance de color', category: 'color', supportedNow: true, hint: 'Ajustar RGB', previewType: 'gradient' },
  { id: 'gamma', name: 'Gamma', nameEs: 'Gamma', category: 'color', supportedNow: true, hint: 'Corrección de gamma', previewType: 'gradient' },

  // DISTORT EFFECTS
  { id: 'spherize', name: 'Spherize', nameEs: 'Esferizar', category: 'distort', supportedNow: true, hint: 'Efecto globo', previewType: 'animated' },
  { id: 'twirl', name: 'Twirl', nameEs: 'Girar', category: 'distort', supportedNow: true, hint: 'Efecto torbellino', previewType: 'animated' },
  { id: 'wave-warp', name: 'Wave Warp', nameEs: 'Onda', category: 'distort', supportedNow: true, hint: 'Efecto onda', previewType: 'animated' },
  { id: 'bulge', name: 'Bulge', nameEs: 'Protuberancia', category: 'distort', supportedNow: true, hint: 'Efecto lente', previewType: 'animated' },
  { id: 'pinch', name: 'Pinch', nameEs: 'Apretar', category: 'distort', supportedNow: true, hint: 'Contraer centro', previewType: 'animated' },
  { id: 'magnify', name: 'Magnify', nameEs: 'Ampliar', category: 'distort', supportedNow: true, hint: 'Lente de aumento', previewType: 'animated' },
  { id: 'mirror', name: 'Mirror', nameEs: 'Espejo', category: 'distort', supportedNow: true, hint: 'Reflejar', previewType: 'animated' },
  { id: 'displacement', name: 'Displacement', nameEs: 'Desplazamiento', category: 'distort', supportedNow: true, hint: 'Distorsión con mapa', previewType: 'animated' },
  { id: 'lens-distortion', name: 'Lens Distortion', nameEs: 'Distorsión lente', category: 'distort', supportedNow: true, hint: 'Aberración', previewType: 'animated' },
  { id: 'water-ripple', name: 'Water Ripple', nameEs: 'Rizado de agua', category: 'distort', supportedNow: true, hint: 'Efecto agua', previewType: 'animated' },

  // STYLIZE EFFECTS
  { id: 'grayscale', name: 'Grayscale', nameEs: 'Escala de grises', category: 'stylize', supportedNow: true, previewType: 'gradient' },
  { id: 'sepia', name: 'Sepia', nameEs: 'Sepia', category: 'stylize', supportedNow: true, previewType: 'gradient' },
  { id: 'invert', name: 'Invert', nameEs: 'Invertir', category: 'stylize', supportedNow: true, previewType: 'gradient' },
  { id: 'posterize', name: 'Posterize', nameEs: 'Posterizar', category: 'stylize', supportedNow: true, hint: 'Reducir colores', previewType: 'gradient' },
  { id: 'mosaic', name: 'Mosaic', nameEs: 'Mosaico', category: 'stylize', supportedNow: true, hint: 'Efecto pixelado', previewType: 'gradient' },
  { id: 'find-edges', name: 'Find Edges', nameEs: 'Detectar bordes', category: 'stylize', supportedNow: true, hint: 'Resaltar contornos', previewType: 'gradient' },
  { id: 'emboss', name: 'Emboss', nameEs: 'Relieve', category: 'stylize', supportedNow: true, hint: 'Efecto grabado', previewType: 'gradient' },
  { id: 'alpha-glow', name: 'Alpha Glow', nameEs: 'Brillo alfa', category: 'stylize', supportedNow: true, hint: 'Glow en bordes', previewType: 'animated' },
  { id: 'roughen', name: 'Roughen Edges', nameEs: 'Bordes ásperos', category: 'stylize', supportedNow: true, hint: 'Efecto destruido', previewType: 'animated' },
  { id: 'strobe', name: 'Strobe', nameEs: 'Estroboscopio', category: 'stylize', supportedNow: true, hint: 'Parpadeo', previewType: 'animated' },
  { id: 'flicker', name: 'Flicker', nameEs: 'Flicker', category: 'stylize', supportedNow: true, hint: 'Parpadeo cine', previewType: 'animated' },

  // GENERATE EFFECTS
  { id: 'lens-flare', name: 'Lens Flare', nameEs: 'Refljo de lente', category: 'generate', supportedNow: true, hint: 'Luz de sol', previewType: 'animated' },
  { id: 'light-leak', name: 'Light Leak', nameEs: 'Fuga de luz', category: 'generate', supportedNow: true, hint: 'Efecto cámara vintage', previewType: 'animated' },
  { id: 'grid', name: 'Grid', nameEs: 'Cuadrícula', category: 'generate', supportedNow: true, hint: 'Líneas de grid', previewType: 'gradient' },
  { id: 'circle', name: 'Circle', nameEs: 'Círculo', category: 'generate', supportedNow: true, hint: 'Generar círculo', previewType: 'gradient' },
  { id: 'ramp', name: 'Gradient Ramp', nameEs: 'Rampa de gradiente', category: 'generate', supportedNow: true, hint: 'Fondo degradado', previewType: 'gradient' },
  { id: 'noise', name: 'Noise', nameEs: 'Ruido', category: 'generate', supportedNow: true, hint: 'Grano de film', previewType: 'gradient' },
  { id: 'scan-lines', name: 'Scan Lines', nameEs: 'Líneas de escaneo', category: 'generate', supportedNow: true, hint: 'Efecto TV antigua', previewType: 'animated' },
  { id: 'vignette', name: 'Vignette', nameEs: 'Viñeta', category: 'generate', supportedNow: true, hint: 'Bordes oscuros', previewType: 'gradient' },

  // LIGHTING EFFECTS
  { id: 'glow', name: 'Glow', nameEs: 'Brillo', category: 'lighting', supportedNow: true, hint: 'Efecto resplandor', previewType: 'animated' },
  { id: 'bloom', name: 'Bloom', nameEs: 'Florescencia', category: 'lighting', supportedNow: true, hint: 'Luz difusa', previewType: 'animated' },
  { id: 'lens-reflection', name: 'Lens Reflection', nameEs: 'Reflejo de lente', category: 'lighting', supportedNow: true, hint: 'Brillo lente', previewType: 'animated' },
  { id: 'ambient-light', name: 'Ambient Light', nameEs: 'Luz ambiental', category: 'lighting', supportedNow: true, hint: 'Iluminación ambiente', previewType: 'gradient' },
  { id: 'sun-flare', name: 'Sun Flare', nameEs: 'Destello solar', category: 'lighting', supportedNow: true, hint: 'Luz del sol', previewType: 'animated' },
  { id: 'neon-glow', name: 'Neon Glow', nameEs: 'Brillo neón', category: 'lighting', supportedNow: true, hint: 'Efecto neón', previewType: 'animated' },

  // NOISE EFFECTS
  { id: 'film-grain', name: 'Film Grain', nameEs: 'Grano de película', category: 'noise', supportedNow: true, hint: 'Grano clásico', previewType: 'gradient' },
  { id: 'digital-noise', name: 'Digital Noise', nameEs: 'Ruido digital', category: 'noise', supportedNow: true, hint: 'Noise ISO', previewType: 'gradient' },
  { id: 'scratch', name: 'Scratches', nameEs: 'Rayones', category: 'noise', supportedNow: true, hint: 'Película dañada', previewType: 'animated' },
  { id: 'dust', name: 'Dust', nameEs: 'Polvo', category: 'noise', supportedNow: true, hint: 'Partículas', previewType: 'animated' },

  // KEYING EFFECTS
  { id: 'green-screen', name: 'Green Screen', nameEs: 'Pantalla verde', category: 'keying', supportedNow: true, hint: 'Chroma key', previewType: 'gradient' },
  { id: 'blue-screen', name: 'Blue Screen', nameEs: 'Pantalla azul', category: 'keying', supportedNow: true, hint: 'Chroma key azul', previewType: 'gradient' },
  { id: 'color-key', name: 'Color Key', nameEs: 'Clave de color', category: 'keying', supportedNow: true, hint: 'Eliminar color', previewType: 'gradient' },
  { id: 'luma-key', name: 'Luma Key', nameEs: 'Clave de luminancia', category: 'keying', supportedNow: true, hint: 'Key por brillo', previewType: 'gradient' },

  // TIME EFFECTS
  { id: 'time-reverse', name: 'Time Reverse', nameEs: 'Invertir tiempo', category: 'time', supportedNow: true, hint: 'Video invertido', previewType: 'animated' },
  { id: 'time-stop', name: 'Time Stop', nameEs: 'Detener tiempo', category: 'time', supportedNow: true, hint: 'Freeze frame', previewType: 'animated' },
  { id: 'pixelate', name: 'Pixelate', nameEs: 'Pixelar', category: 'time', supportedNow: true, hint: 'Efecto pixel', previewType: 'gradient' },
];

// =====================
// FILTERS (COLOR GRADING)
// =====================

export type FilterCategory = 
  | 'cinematic'
  | 'mood'
  | 'vintage'
  | 'artistic'
  | 'season'
  | 'social';

export interface VideoFilter {
  id: string;
  name: string;
  nameEs: string;
  category: FilterCategory;
  supportedNow: boolean;
  description?: string;
  hint?: string;
  previewColors: string[];
}

export const EXTENDED_FILTERS: VideoFilter[] = [
  // CINEMATIC FILTERS
  { id: 'cinematic-teal', name: 'Cinematic Teal', nameEs: 'Cine Teal', category: 'cinematic', supportedNow: true, hint: 'Teal & orange', previewColors: ['#1a3a4a', '#0d1b2a', '#ff6b35'] },
  { id: 'cinematic-orange', name: 'Cinematic Orange', nameEs: 'Cine Naranja', category: 'cinematic', supportedNow: true, hint: 'Warm cinematic', previewColors: ['#2a1a1a', '#4a2a1a', '#ff8c42'] },
  { id: 'cinematic-moody', name: 'Cinematic Moody', nameEs: 'Cine Oscuro', category: 'cinematic', supportedNow: true, hint: 'Dark moody', previewColors: ['#0a0a0a', '#1a1a1a', '#4a4a4a'] },
  { id: 'cinematic-vibrant', name: 'Cinematic Vibrant', nameEs: 'Cine Vibrante', category: 'cinematic', supportedNow: true, hint: 'High saturation', previewColors: ['#ff3366', '#ffcc00', '#00ccff'] },
  { id: 'cinematic-faded', name: 'Cinematic Faded', nameEs: 'Cine Desvanecido', category: 'cinematic', supportedNow: true, hint: 'Desaturated', previewColors: ['#666', '#777', '#888'] },
  { id: 'cinematic-film', name: 'Film Look', nameEs: 'Look de película', category: 'cinematic', supportedNow: true, hint: '35mm film', previewColors: ['#2a2a1a', '#3a3525', '#d4c4a8'] },

  // MOOD FILTERS
  { id: 'mood-dark', name: 'Dark Mood', nameEs: 'Ánimo oscuro', category: 'mood', supportedNow: true, hint: 'Dark & dramatic', previewColors: ['#0d0d0d', '#1a1a2a', '#2a2a3a'] },
  { id: 'mood-light', name: 'Light Mood', nameEs: 'Ánimo ligero', category: 'mood', supportedNow: true, hint: 'Bright & airy', previewColors: ['#f5f5f5', '#e5e5e5', '#d5d5d5'] },
  { id: 'mood-warm', name: 'Warm Mood', nameEs: 'Ánimo cálido', category: 'mood', supportedNow: true, hint: 'Warm tones', previewColors: ['#ff9f43', '#ee5253', '#ff6b6b'] },
  { id: 'mood-cool', name: 'Cool Mood', nameEs: 'Ánimo frío', category: 'mood', supportedNow: true, hint: 'Cool tones', previewColors: ['#2e86de', '#0abde3', '#48dbfb'] },
  { id: 'mood-mysterious', name: 'Mysterious', nameEs: 'Misterioso', category: 'mood', supportedNow: true, hint: 'Eerie vibe', previewColors: ['#1a1a2e', '#2d1b4e', '#4a2c6a'] },
  { id: 'mood-dreamy', name: 'Dreamy', nameEs: 'Soñador', category: 'mood', supportedNow: true, hint: 'Soft & dreamy', previewColors: ['#ffeaa7', '#fab1a0', '#81ecec'] },

  // VINTAGE FILTERS
  { id: 'vintage-70s', name: '70s Retro', nameEs: 'Retro 70s', category: 'vintage', supportedNow: true, hint: '70s vibe', previewColors: ['#d4a574', '#8b6914', '#c9a227'] },
  { id: 'vintage-80s', name: '80s Retro', nameEs: 'Retro 80s', category: 'vintage', supportedNow: true, hint: 'Neon 80s', previewColors: ['#ff00ff', '#00ffff', '#ff6b6b'] },
  { id: 'vintage-90s', name: '90s Retro', nameEs: 'Retro 90s', category: 'vintage', supportedNow: true, hint: '90s aesthetic', previewColors: ['#f8b4c4', '#f8e4c4', '#c4f8e4'] },
  { id: 'vintage-vhs', name: 'VHS', nameEs: 'VHS', category: 'vintage', supportedNow: true, hint: 'Video home system', previewColors: ['#2a2a3a', '#4a4a5a', '#8a8a9a'] },
  { id: 'vintage-film', name: 'Film', nameEs: 'Película', category: 'vintage', supportedNow: true, hint: 'Classic film', previewColors: ['#d4c4a8', '#a89878', '#7a6858'] },
  { id: 'vintage-polaroid', name: 'Polaroid', nameEs: 'Polaroid', category: 'vintage', supportedNow: true, hint: 'Instant photo', previewColors: ['#f0f0e0', '#d0d0c0', '#b0b0a0'] },
  { id: 'vintage-sepia', name: 'Sepia', nameEs: 'Sepia', category: 'vintage', supportedNow: true, hint: 'Classic sepia', previewColors: ['#704214', '#a0522d', '#8b4513'] },

  // ARTISTIC FILTERS
  { id: 'artistic-noir', name: 'Noir', nameEs: 'Noir', category: 'artistic', supportedNow: true, hint: 'Film noir', previewColors: ['#000000', '#333333', '#666666'] },
  { id: 'artistic-duotone', name: 'Duotone', nameEs: 'Duotono', category: 'artistic', supportedNow: true, hint: 'Two colors', previewColors: ['#1a1a4a', '#ff6b6b', '#ffffff'] },
  { id: 'artistic-split', name: 'Split Tone', nameEs: 'Tono dividido', category: 'artistic', supportedNow: true, hint: 'Two-tone grading', previewColors: ['#ff6b6b', '#6b6bff', '#ffffff'] },
  { id: 'artistic-chromatic', name: 'Chromatic', nameEs: 'Cromático', category: 'artistic', supportedNow: true, hint: 'Color aberration', previewColors: ['#ff0000', '#00ff00', '#0000ff'] },
  { id: 'artistic-cross-process', name: 'Cross Process', nameEs: 'Proceso cruzado', category: 'artistic', supportedNow: true, hint: 'Alternative process', previewColors: ['#ff6b6b', '#6bff6b', '#6b6bff'] },
  { id: 'artistic-pastel', name: 'Pastel', nameEs: 'Pastel', category: 'artistic', supportedNow: true, hint: 'Soft colors', previewColors: ['#ffe4e1', '#e6e6fa', '#f0fff0'] },

  // SEASON FILTERS
  { id: 'season-spring', name: 'Spring', nameEs: 'Primavera', category: 'season', supportedNow: true, hint: 'Fresh greens', previewColors: ['#98fb98', '#90ee90', '#87ceeb'] },
  { id: 'season-summer', name: 'Summer', nameEs: 'Verano', category: 'season', supportedNow: true, hint: 'Bright & warm', previewColors: ['#ffd700', '#ff8c00', '#ff6347'] },
  { id: 'season-autumn', name: 'Autumn', nameEs: 'Otoño', category: 'season', supportedNow: true, hint: 'Warm oranges', previewColors: ['#ff7f50', '#daa520', '#cd853f'] },
  { id: 'season-winter', name: 'Winter', nameEs: 'Invierno', category: 'season', supportedNow: true, hint: 'Cold blues', previewColors: ['#b0e0e6', '#add8e6', '#e0ffff'] },

  // SOCIAL MEDIA FILTERS
  { id: 'social-tiktok', name: 'TikTok', nameEs: 'TikTok', category: 'social', supportedNow: true, hint: 'Popular on TikTok', previewColors: ['#ff0050', '#00f2ea', '#ffffff'] },
  { id: 'social-instagram', name: 'Instagram', nameEs: 'Instagram', category: 'social', supportedNow: true, hint: 'IG aesthetic', previewColors: ['#833ab4', '#fd1d1d', '#fcb045'] },
  { id: 'social-youtube', name: 'YouTube', nameEs: 'YouTube', category: 'social', supportedNow: true, hint: 'YT thumb style', previewColors: ['#ff0000', '#ffffff', '#282828'] },
  { id: 'social-sunset', name: 'Sunset', nameEs: 'Atardecer', category: 'social', supportedNow: true, hint: 'Golden hour', previewColors: ['#ff7e5f', '#feb47b', '#ffcb7d'] },
  { id: 'social-ocean', name: 'Ocean', nameEs: 'Océano', category: 'social', supportedNow: true, hint: 'Blue tones', previewColors: ['#1cb5e0', '#000046', '#373b44'] },
  { id: 'social-forest', name: 'Forest', nameEs: 'Bosque', category: 'social', supportedNow: true, hint: 'Green vibes', previewColors: ['#134e5e', '#71b280', '#2d5a27'] },
];

// =====================
// TRANSITIONS
// =====================

export type TransitionCategory = 
  | 'dissolve'
  | 'wipe'
  | 'slide'
  | 'zoom'
  | 'glitch'
  | 'blur'
  | 'shape';

export interface VideoTransition {
  id: string;
  name: string;
  nameEs: string;
  category: TransitionCategory;
  supportedNow: boolean;
  duration: number;
  description?: string;
  hint?: string;
}

export const EXTENDED_TRANSITIONS: VideoTransition[] = [
  // DISSOLVE TRANSITIONS
  { id: 'dissolve-basic', name: 'Dissolve', nameEs: 'Fundido', category: 'dissolve', supportedNow: true, duration: 0.35 },
  { id: 'dissolve-additive', name: 'Additive Dissolve', nameEs: 'Fundido aditivo', category: 'dissolve', supportedNow: true, duration: 0.4 },
  { id: 'dissolve-cross', name: 'Cross Dissolve', nameEs: 'Cross dissolve', category: 'dissolve', supportedNow: true, duration: 0.35 },
  { id: 'dissolve-dip-black', name: 'Dip to Black', nameEs: 'Dip a negro', category: 'dissolve', supportedNow: true, duration: 0.5 },
  { id: 'dissolve-dip-white', name: 'Dip to White', nameEs: 'Dip a blanco', category: 'dissolve', supportedNow: true, duration: 0.5 },
  { id: 'dissolve-film', name: 'Film Dissolve', nameEs: 'Fundido film', category: 'dissolve', supportedNow: true, duration: 0.6, hint: 'With grain' },

  // WIPE TRANSITIONS
  { id: 'wipe-left', name: 'Wipe Left', nameEs: 'Barrido izquierda', category: 'wipe', supportedNow: true, duration: 0.35 },
  { id: 'wipe-right', name: 'Wipe Right', nameEs: 'Barrido derecha', category: 'wipe', supportedNow: true, duration: 0.35 },
  { id: 'wipe-up', name: 'Wipe Up', nameEs: 'Barrido arriba', category: 'wipe', supportedNow: true, duration: 0.35 },
  { id: 'wipe-down', name: 'Wipe Down', nameEs: 'Barrido abajo', category: 'wipe', supportedNow: true, duration: 0.35 },
  { id: 'wipe-clock', name: 'Wipe Clock', nameEs: 'Barrido reloj', category: 'wipe', supportedNow: true, duration: 0.4 },
  { id: 'wipe-radial', name: 'Radial Wipe', nameEs: 'Barrido radial', category: 'wipe', supportedNow: true, duration: 0.4 },
  { id: 'wipe-gradient', name: 'Gradient Wipe', nameEs: 'Barrido degradado', category: 'wipe', supportedNow: true, duration: 0.5 },

  // SLIDE TRANSITIONS
  { id: 'slide-push', name: 'Push', nameEs: 'Empuje', category: 'slide', supportedNow: true, duration: 0.35 },
  { id: 'slide-slide', name: 'Slide', nameEs: 'Deslizar', category: 'slide', supportedNow: true, duration: 0.4 },
  { id: 'slide-split', name: 'Split', nameEs: 'Dividir', category: 'slide', supportedNow: true, duration: 0.35 },
  { id: 'slide-center-split', name: 'Center Split', nameEs: 'División centro', category: 'slide', supportedNow: true, duration: 0.35 },
  { id: 'slide-cube', name: 'Cube', nameEs: 'Cubo', category: 'slide', supportedNow: true, duration: 0.5, hint: '3D cube' },
  { id: 'slide-flip', name: 'Flip', nameEs: 'Voltear', category: 'slide', supportedNow: true, duration: 0.45 },

  // ZOOM TRANSITIONS
  { id: 'zoom-cross', name: 'Cross Zoom', nameEs: 'Zoom cruzado', category: 'zoom', supportedNow: true, duration: 0.45, hint: 'Scale + fade' },
  { id: 'zoom-in', name: 'Zoom In', nameEs: 'Zoom entrada', category: 'zoom', supportedNow: true, duration: 0.35 },
  { id: 'zoom-out', name: 'Zoom Out', nameEs: 'Zoom salida', category: 'zoom', supportedNow: true, duration: 0.35 },
  { id: 'zoom-ripple', name: 'Zoom Ripple', nameEs: 'Zoom ondulación', category: 'zoom', supportedNow: true, duration: 0.5 },
  { id: 'zoom-spin', name: 'Zoom Spin', nameEs: 'Zoom rotación', category: 'zoom', supportedNow: true, duration: 0.5 },

  // GLITCH TRANSITIONS
  { id: 'glitch-basic', name: 'Glitch', nameEs: 'Glitch', category: 'glitch', supportedNow: true, duration: 0.3 },
  { id: 'glitch-rgb', name: 'RGB Split', nameEs: 'Separación RGB', category: 'glitch', supportedNow: true, duration: 0.35 },
  { id: 'glitch-digital', name: 'Digital Glitch', nameEs: 'Glitch digital', category: 'glitch', supportedNow: true, duration: 0.28 },
  { id: 'glitch-scan', name: 'Scan Lines', nameEs: 'Líneas de escaneo', category: 'glitch', supportedNow: true, duration: 0.35 },
  { id: 'glitch-displacement', name: 'Displacement', nameEs: 'Desplazamiento', category: 'glitch', supportedNow: true, duration: 0.4 },

  // BLUR TRANSITIONS
  { id: 'blur-basic', name: 'Motion Blur', nameEs: 'Desenfoque movimiento', category: 'blur', supportedNow: true, duration: 0.4 },
  { id: 'blur-directional', name: 'Directional Blur', nameEs: 'Desenfoque direccional', category: 'blur', supportedNow: true, duration: 0.45 },
  { id: 'blur-spin', name: 'Spin Blur', nameEs: 'Desenfoque giro', category: 'blur', supportedNow: true, duration: 0.5 },

  // SHAPE TRANSITIONS
  { id: 'shape-circle', name: 'Circle', nameEs: 'Círculo', category: 'shape', supportedNow: true, duration: 0.4 },
  { id: 'shape-square', name: 'Square', nameEs: 'Cuadrado', category: 'shape', supportedNow: true, duration: 0.4 },
  { id: 'shape-diamond', name: 'Diamond', nameEs: 'Diamante', category: 'shape', supportedNow: true, duration: 0.4 },
  { id: 'shape-star', name: 'Star', nameEs: 'Estrella', category: 'shape', supportedNow: true, duration: 0.5 },
  { id: 'shape-heart', name: 'Heart', nameEs: 'Corazón', category: 'shape', supportedNow: true, duration: 0.5 },
];

// =====================
// HELPER FUNCTIONS
// =====================

export function getEffectsByCategory(category: EffectCategory): VideoEffect[] {
  return EXTENDED_EFFECTS.filter(e => e.category === category);
}

export function getFiltersByCategory(category: FilterCategory): VideoFilter[] {
  return EXTENDED_FILTERS.filter(f => f.category === category);
}

export function getTransitionsByCategory(category: TransitionCategory): VideoTransition[] {
  return EXTENDED_TRANSITIONS.filter(t => t.category === category);
}

export const EFFECT_CATEGORIES: { id: EffectCategory; name: string; nameEs: string }[] = [
  { id: 'blur', name: 'Blur', nameEs: 'Desenfoque' },
  { id: 'color', name: 'Color', nameEs: 'Color' },
  { id: 'distort', name: 'Distort', nameEs: 'Distorsión' },
  { id: 'stylize', name: 'Stylize', nameEs: 'Estilizar' },
  { id: 'generate', name: 'Generate', nameEs: 'Generar' },
  { id: 'lighting', name: 'Lighting', nameEs: 'Iluminación' },
  { id: 'noise', name: 'Noise', nameEs: 'Ruido' },
  { id: 'keying', name: 'Keying', nameEs: 'Clave' },
  { id: 'time', name: 'Time', nameEs: 'Tiempo' },
];

export const FILTER_CATEGORIES: { id: FilterCategory; name: string; nameEs: string }[] = [
  { id: 'cinematic', name: 'Cinematic', nameEs: 'Cinematográfico' },
  { id: 'mood', name: 'Mood', nameEs: 'Ánimo' },
  { id: 'vintage', name: 'Vintage', nameEs: 'Vintage' },
  { id: 'artistic', name: 'Artistic', nameEs: 'Artístico' },
  { id: 'season', name: 'Season', nameEs: 'Temporada' },
  { id: 'social', name: 'Social', nameEs: 'Redes sociales' },
];

export const TRANSITION_CATEGORIES: { id: TransitionCategory; name: string; nameEs: string }[] = [
  { id: 'dissolve', name: 'Dissolve', nameEs: 'Fundido' },
  { id: 'wipe', name: 'Wipe', nameEs: 'Barrido' },
  { id: 'slide', name: 'Slide', nameEs: 'Deslizar' },
  { id: 'zoom', name: 'Zoom', nameEs: 'Zoom' },
  { id: 'glitch', name: 'Glitch', nameEs: 'Glitch' },
  { id: 'blur', name: 'Blur', nameEs: 'Desenfoque' },
  { id: 'shape', name: 'Shape', nameEs: 'Forma' },
];