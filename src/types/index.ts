export interface Keyframe {
  id: string;
  time: number;
  value: number;
  easing:
    | 'linear'
    | 'ease-in'
    | 'ease-out'
    | 'ease-in-out'
    | 'smooth'
    | 'overshoot'
    | 'bounce'
    | 'elastic';
}

export interface Transform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
}

/**
 * Región visible del medio (vídeo/imagen) en coordenadas normalizadas 0–1 del fotograma fuente.
 * Por defecto cubre el encuadre completo.
 */
export interface MediaCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const DEFAULT_MEDIA_CROP: MediaCropRect = {
  x: 0,
  y: 0,
  width: 1,
  height: 1,
};

/** Máscara por bordes (fracción 0..0.9 del frame visible). */
export interface MediaMaskInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_MEDIA_MASK: MediaMaskInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export interface Effect {
  id: string;
  type:
    | 'blur'
    | 'brightness'
    | 'contrast'
    | 'color-overlay'
    | 'shadow'
    | 'shake'
    | 'chromatic-aberration'
    | 'glow'
    | 'motion-blur'
    | 'grayscale'
    | 'sepia'
    | 'saturate'
    | 'hue-rotate'
    | 'invert';
  value: number;
  enabled: boolean;
}

export interface TimeRemapKeyframe {
  id: string;
  time: number;
  speed: number;
  curve?: 'linear' | 'smooth';
}

export interface TransitionPreset {
  id: string;
  name: string;
  duration: number;
}

export interface EffectPreset {
  id: string;
  name: string;
  supportedNow: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  supportedNow: boolean;
}

/** Cómo escala el vídeo/imagen dentro del lienzo (equivalente a object-fit / «scale to frame» en NLE). */
export type ClipMediaLayout = 'cover' | 'contain' | 'fill';

/** Opciones estilo Premiere / DaVinci: guías, snap, etc. */
export interface ProEditorSettings {
  /** Muestra marco «title safe» (~10 % desde bordes). */
  showTitleSafe: boolean;
  /** Muestra marco «action safe» (~5 % desde bordes). */
  showActionSafe: boolean;
  /** Redondea el tiempo del cabezal al fotograma más cercano (1/FPS). */
  snapPlayheadToFrame: boolean;
}

export const DEFAULT_PRO_EDITOR: ProEditorSettings = {
  showTitleSafe: false,
  showActionSafe: false,
  snapPlayheadToFrame: false,
};

export interface Clip {
  id: string;
  trackId: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'image' | 'background';
  startTime: number;
  duration: number;
  volume?: number;
  /** Segundo de inicio dentro del archivo de media (para trims/splits). Por defecto 0. */
  mediaStart?: number;
  mediaUrl?: string;
  mediaType?: string;
  /** Encuadre del clip en el lienzo (cover = rellena recortando, contain = ajusta con bandas, fill = estira). */
  mediaLayout?: ClipMediaLayout;
  /**
   * Seguimiento facial (Chrome/Edge con FaceDetector). Ajusta el encuadre hacia la cara detectada.
   * El offset se guarda en `faceFramingNudge` para exportación aproximada.
   */
  trackFace?: boolean;
  /** Offset de encuadre por cara, -1…1 por eje (fracción del movimiento máximo). */
  faceFramingNudge?: { x: number; y: number };
  speed?: number;
  reverse?: boolean;
  timeMap?: TimeRemapKeyframe[];
  inTransition?: TransitionPreset | null;
  outTransition?: TransitionPreset | null;
  transform: Transform;
  /** Recorte del archivo de media (preview y exportación). */
  mediaCrop?: MediaCropRect;
  /** Máscara visual por bordes aplicada en preview/composición. */
  mediaMask?: MediaMaskInsets;
  effects: Effect[];
  keyframes: {
    positionX: Keyframe[];
    positionY: Keyframe[];
    scaleX: Keyframe[];
    scaleY: Keyframe[];
    rotation: Keyframe[];
    opacity: Keyframe[];
  };
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  /** Relleno de escena cuando type === 'background' (pista de fondo en timeline). */
  sceneBackground?: BackgroundStyle;
}

export interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'image' | 'background';
  clips: Clip[];
  muted: boolean;
  locked: boolean;
  visible: boolean;
}

/** Zoom tipo tutorial (fragmentos con acercamiento y punto focal) para grabaciones de pantalla. */
export interface ZoomFragment {
  id: string;
  startTime: number;
  endTime: number;
  /** 1–10 → factor de escala interpolado */
  zoomLevel: number;
  /** 1–10 → transición más rápida o más lenta */
  speed: number;
  /** Punto focal horizontal (0–100 % del lienzo) */
  focusX: number;
  focusY: number;
  movementEnabled?: boolean;
  movementEndX?: number;
  movementEndY?: number;
  movementStartOffset?: number;
  movementEndOffset?: number;
  enable3D?: boolean;
  perspective3DIntensity?: number;
  perspective3DAngleX?: number;
  perspective3DAngleY?: number;
}

export type ScreenCursorStyle = 'mac' | 'dot' | 'ring';

export type ScreenCursorClickEffect = 'none' | 'ring' | 'ripple';

export interface CursorOverlayKeyframe {
  id: string;
  time: number;
  x: number;
  y: number;
  clicking?: boolean;
}

export interface ScreenCursorOverlay {
  visible: boolean;
  style: ScreenCursorStyle;
  size: number;
  color: string;
  ringColor: string;
  smoothing: number;
  clickEffect: ScreenCursorClickEffect;
  keyframes: CursorOverlayKeyframe[];
}

export const DEFAULT_SCREEN_CURSOR: ScreenCursorOverlay = {
  visible: false,
  style: 'mac',
  size: 28,
  color: '#ffffff',
  ringColor: '#3b82f6',
  smoothing: 50,
  clickEffect: 'ring',
  keyframes: [],
};

/** Red social de destino para export MP4 optimizado (preset codificación + tamaño de lienzo recomendado). */
export type SocialExportPlatform =
  | 'tiktok'
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'linkedin'
  | 'x';

export interface SocialExportSettings {
  platform: SocialExportPlatform;
  variantId: string;
}

export interface Project {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
  /** Si existe, el editor y la exportación usan estos presets (y pueden alinear resolución/FPS del lienzo). */
  socialExport?: SocialExportSettings;
  background?: BackgroundStyle;
  deviceFrame?: DeviceFrameStyle;
  camera?: CameraAnimation;
  zoomFragments?: ZoomFragment[];
  screenCursor?: ScreenCursorOverlay;
  /** Herramientas tipo editor profesional (guías, snap). */
  proEditor?: ProEditorSettings;
  /**
   * Notas o guion para edición orientada a texto (una línea por frase o con marcas [MM:SS]).
   * Inspirado en editores que permiten planificar cortes desde el texto.
   */
  textWorkflowNotes?: string;
}

export interface MediaFile {
  id: string;
  name: string;
  type: string;
  url: string;
  duration?: number;
  width?: number;
  height?: number;
  thumbnail?: string;
}

export type PlaybackState = 'playing' | 'paused' | 'stopped';

export interface EditorState {
  project: Project | null;
  currentTime: number;
  playbackState: PlaybackState;
  selectedTrackId: string | null;
  selectedClipId: string | null;
  selectedClipIds: string[];
  zoom: number;
  mediaFiles: MediaFile[];
  isRecording: boolean;
  ffmpegLoaded: boolean;
}

export type EditorAction =
  | { type: 'SET_PROJECT'; payload: Project }
  | { type: 'REPLACE_SNAPSHOT'; payload: { project: Project | null; mediaFiles: MediaFile[] } }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_PLAYBACK_STATE'; payload: PlaybackState }
  | { type: 'SET_SELECTED_TRACK'; payload: string | null }
  | { type: 'SET_SELECTED_CLIP'; payload: string | null }
  | { type: 'SET_SELECTED_CLIP_IDS'; payload: string[] }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'ADD_MEDIA_FILE'; payload: MediaFile }
  | { type: 'UPDATE_MEDIA_FILE'; payload: { id: string; updates: Partial<MediaFile> } }
  | { type: 'REMOVE_MEDIA_FILE'; payload: string }
  | { type: 'ADD_TRACK'; payload: Track }
  | { type: 'REMOVE_TRACK'; payload: string }
  | { type: 'ADD_CLIP'; payload: { trackId: string; clip: Clip } }
  | { type: 'REMOVE_CLIP'; payload: { trackId: string; clipId: string } }
  | { type: 'UPDATE_CLIP'; payload: { trackId: string; clip: Clip } }
  | { type: 'SET_CLIP_SPEED'; payload: { trackId: string; clipId: string; speed: number } }
  | { type: 'SET_CLIP_REVERSE'; payload: { trackId: string; clipId: string; reverse: boolean } }
  | {
      type: 'SET_CLIP_TIME_MAP';
      payload: { trackId: string; clipId: string; timeMap: TimeRemapKeyframe[] };
    }
  | {
      type: 'SET_CLIP_TRANSITION_IN';
      payload: { trackId: string; clipId: string; transition: TransitionPreset | null };
    }
  | {
      type: 'SET_CLIP_TRANSITION_OUT';
      payload: { trackId: string; clipId: string; transition: TransitionPreset | null };
    }
  | { type: 'SPLIT_AT_PLAYHEAD'; payload: { time: number } }
  | { type: 'SET_RECORDING'; payload: boolean }
  | { type: 'SET_FFMPEG_LOADED'; payload: boolean }
  | { type: 'UPDATE_PROJECT'; payload: Partial<Project> }
  | { type: 'UNDO' }
  | { type: 'REDO' };

export interface BackgroundStyle {
  type: 'solid' | 'gradient' | 'image' | 'none';
  color: string;
  gradientFrom?: string;
  gradientTo?: string;
  imageUrl?: string;
  blur: number;
  padding?: number;
  radius?: number;
  shadow?: number;
}

export interface DeviceFrameStyle {
  enabled: boolean;
  type: 'none' | 'safari' | 'chrome' | 'arc' | 'samsung';
  padding: number;
  radius: number;
  shadow: number;
}

export interface CameraKeyframe {
  id: string;
  time: number;
  zoom: number;
  tiltX: number;
  tiltY: number;
}

export interface CameraAnimation {
  keyframes: CameraKeyframe[];
  defaultZoom: number;
  defaultTiltX: number;
  defaultTiltY: number;
}

export const PRESETS = {
  '4k': { width: 3840, height: 2160 },
  '1080p': { width: 1920, height: 1080 },
  '720p': { width: 1280, height: 720 },
  '480p': { width: 854, height: 480 },
} as const;

export const DEFAULT_TRANSFORM: Transform = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  opacity: 1,
};