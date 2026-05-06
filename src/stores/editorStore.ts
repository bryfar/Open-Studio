import { create } from 'zustand';
import {
  EditorState,
  EditorAction,
  Project,
  Track,
  Clip,
  DEFAULT_TRANSFORM,
  DEFAULT_MEDIA_CROP,
  DEFAULT_MEDIA_MASK,
  PRESETS,
  DEFAULT_SCREEN_CURSOR,
  DEFAULT_PRO_EDITOR,
} from '@/types';
import { ensureBackgroundTrack } from '@/lib/sceneTimeline';

const generateId = () => Math.random().toString(36).substring(2, 15);

const MIN_SPLIT_DURATION = 0.05;

function splitKeyframeChannelsLeft(
  keyframes: Clip['keyframes'],
  cutRel: number
): Clip['keyframes'] {
  return {
    positionX: keyframes.positionX.filter((k) => k.time < cutRel).map((k) => ({ ...k })),
    positionY: keyframes.positionY.filter((k) => k.time < cutRel).map((k) => ({ ...k })),
    scaleX: keyframes.scaleX.filter((k) => k.time < cutRel).map((k) => ({ ...k })),
    scaleY: keyframes.scaleY.filter((k) => k.time < cutRel).map((k) => ({ ...k })),
    rotation: keyframes.rotation.filter((k) => k.time < cutRel).map((k) => ({ ...k })),
    opacity: keyframes.opacity.filter((k) => k.time < cutRel).map((k) => ({ ...k })),
  };
}

function splitKeyframeChannelsRight(
  keyframes: Clip['keyframes'],
  cutRel: number
): Clip['keyframes'] {
  return {
    positionX: keyframes.positionX
      .filter((k) => k.time > cutRel)
      .map((k) => ({ ...k, time: k.time - cutRel })),
    positionY: keyframes.positionY
      .filter((k) => k.time > cutRel)
      .map((k) => ({ ...k, time: k.time - cutRel })),
    scaleX: keyframes.scaleX
      .filter((k) => k.time > cutRel)
      .map((k) => ({ ...k, time: k.time - cutRel })),
    scaleY: keyframes.scaleY
      .filter((k) => k.time > cutRel)
      .map((k) => ({ ...k, time: k.time - cutRel })),
    rotation: keyframes.rotation
      .filter((k) => k.time > cutRel)
      .map((k) => ({ ...k, time: k.time - cutRel })),
    opacity: keyframes.opacity
      .filter((k) => k.time > cutRel)
      .map((k) => ({ ...k, time: k.time - cutRel })),
  };
}

function splitClipAtTimelineTime(
  clip: Clip,
  splitTime: number
): { left: Clip; right: Clip } | null {
  const clipEnd = clip.startTime + clip.duration;
  if (splitTime <= clip.startTime + MIN_SPLIT_DURATION || splitTime >= clipEnd - MIN_SPLIT_DURATION) {
    return null;
  }

  const leftDuration = splitTime - clip.startTime;
  const rightDuration = clipEnd - splitTime;
  const cutRel = leftDuration;
  const mediaIn = clip.mediaStart ?? 0;

  const left: Clip = {
    ...clip,
    duration: leftDuration,
    keyframes: splitKeyframeChannelsLeft(clip.keyframes, cutRel),
  };

  const right: Clip = {
    ...clip,
    id: generateId(),
    startTime: splitTime,
    duration: rightDuration,
    mediaStart: mediaIn + cutRel,
    name: `${clip.name} (2)`,
    keyframes: splitKeyframeChannelsRight(clip.keyframes, cutRel),
  };

  return { left, right };
}

const createDefaultProject = (name: string = 'Open Studio Project'): Project => {
  const videoTrack: Track = {
    id: generateId(),
    name: 'Video Track 1',
    type: 'video',
    clips: [],
    muted: false,
    locked: false,
    visible: true,
  };

  const audioTrack: Track = {
    id: generateId(),
    name: 'Audio Track 1',
    type: 'audio',
    clips: [],
    muted: false,
    locked: false,
    visible: true,
  };

  return ensureBackgroundTrack({
    id: generateId(),
    name,
    width: PRESETS['1080p'].width,
    height: PRESETS['1080p'].height,
    fps: 30,
    duration: 60,
    tracks: [videoTrack, audioTrack],
    background: {
      type: 'solid',
      color: '#0d0d0d',
      blur: 0,
      padding: 0,
      radius: 0,
      shadow: 0,
    },
    deviceFrame: {
      enabled: false,
      type: 'none',
      padding: 24,
      radius: 16,
      shadow: 24,
    },
    camera: {
      keyframes: [],
      defaultZoom: 1,
      defaultTiltX: 0,
      defaultTiltY: 0,
    },
    zoomFragments: [],
    screenCursor: { ...DEFAULT_SCREEN_CURSOR, keyframes: [] },
    proEditor: { ...DEFAULT_PRO_EDITOR },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
};

const baseState: EditorState = {
  project: createDefaultProject(),
  currentTime: 0,
  playbackState: 'stopped',
  selectedTrackId: null,
  selectedClipId: null,
  selectedClipIds: [],
  zoom: 100,
  mediaFiles: [],
  isRecording: false,
  ffmpegLoaded: false,
};

type HistoryEntry = Pick<
  EditorState,
  'project' | 'mediaFiles' | 'selectedClipId' | 'selectedClipIds' | 'selectedTrackId' | 'zoom'
>;

interface StoreWithHistory extends EditorState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  dispatch: (action: EditorAction) => void;
}

const historyFromState = (state: EditorState): HistoryEntry => ({
  project: state.project ? structuredClone(state.project) : null,
  mediaFiles: structuredClone(state.mediaFiles),
  selectedClipId: state.selectedClipId,
  selectedClipIds: structuredClone(state.selectedClipIds),
  selectedTrackId: state.selectedTrackId,
  zoom: state.zoom,
});

const initialState: StoreWithHistory = {
  ...baseState,
  past: [],
  future: [],
  dispatch: () => {},
};

const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  switch (action.type) {
    case 'SET_PROJECT':
      return { ...state, project: ensureBackgroundTrack(action.payload) };

    case 'REPLACE_SNAPSHOT':
      return {
        ...state,
        project: action.payload.project
          ? ensureBackgroundTrack(action.payload.project)
          : null,
        mediaFiles: action.payload.mediaFiles,
        selectedClipId: null,
        selectedClipIds: [],
        selectedTrackId: null,
        currentTime: 0,
        playbackState: 'paused',
        zoom: Math.max(25, Math.min(400, state.zoom)),
      };

    case 'SET_CURRENT_TIME': {
      let t = action.payload;
      const p = state.project;
      if (p?.proEditor?.snapPlayheadToFrame && p.fps > 0) {
        const frame = 1 / p.fps;
        t = Math.round(t / frame) * frame;
        t = Math.max(0, Math.min(p.duration, t));
      }
      return { ...state, currentTime: t };
    }

    case 'SET_PLAYBACK_STATE':
      return { ...state, playbackState: action.payload };

    case 'SET_SELECTED_TRACK':
      return { ...state, selectedTrackId: action.payload };

    case 'SET_SELECTED_CLIP':
      return {
        ...state,
        selectedClipId: action.payload,
        selectedClipIds: action.payload ? [action.payload] : [],
      };

    case 'SET_SELECTED_CLIP_IDS':
      return {
        ...state,
        selectedClipId: action.payload.length ? action.payload[action.payload.length - 1] : null,
        selectedClipIds: action.payload,
      };

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(25, Math.min(400, action.payload)) };

    case 'ADD_MEDIA_FILE':
      return { ...state, mediaFiles: [...state.mediaFiles, action.payload] };

    case 'UPDATE_MEDIA_FILE':
      return {
        ...state,
        mediaFiles: state.mediaFiles.map((f) =>
          f.id === action.payload.id ? { ...f, ...action.payload.updates } : f
        ),
      };

    case 'REMOVE_MEDIA_FILE':
      return {
        ...state,
        mediaFiles: state.mediaFiles.filter((f) => f.id !== action.payload),
      };

    case 'ADD_TRACK':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: [...state.project.tracks, action.payload],
          updatedAt: Date.now(),
        },
      };

    case 'REMOVE_TRACK':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.filter((t) => t.id !== action.payload),
          updatedAt: Date.now(),
        },
      };

    case 'ADD_CLIP':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map((track) =>
            track.id === action.payload.trackId
              ? { ...track, clips: [...track.clips, action.payload.clip] }
              : track
          ),
          updatedAt: Date.now(),
        },
      };

    case 'REMOVE_CLIP':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map((track) =>
            track.id === action.payload.trackId
              ? {
                  ...track,
                  clips: track.clips.filter((c) => c.id !== action.payload.clipId),
                }
              : track
          ),
          updatedAt: Date.now(),
        },
      };

    case 'UPDATE_CLIP':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map((track) =>
            track.id === action.payload.trackId
              ? {
                  ...track,
                  clips: track.clips.map((clip) =>
                    clip.id === action.payload.clip.id ? action.payload.clip : clip
                  ),
                }
              : track
          ),
          updatedAt: Date.now(),
        },
      };

    case 'SET_CLIP_SPEED':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map((track) =>
            track.id === action.payload.trackId
              ? {
                  ...track,
                  clips: track.clips.map((clip) =>
                    clip.id === action.payload.clipId
                      ? { ...clip, speed: Math.max(0.1, action.payload.speed) }
                      : clip
                  ),
                }
              : track
          ),
          updatedAt: Date.now(),
        },
      };

    case 'SET_CLIP_REVERSE':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map((track) =>
            track.id === action.payload.trackId
              ? {
                  ...track,
                  clips: track.clips.map((clip) =>
                    clip.id === action.payload.clipId
                      ? { ...clip, reverse: action.payload.reverse }
                      : clip
                  ),
                }
              : track
          ),
          updatedAt: Date.now(),
        },
      };

    case 'SET_CLIP_TIME_MAP':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map((track) =>
            track.id === action.payload.trackId
              ? {
                  ...track,
                  clips: track.clips.map((clip) =>
                    clip.id === action.payload.clipId
                      ? { ...clip, timeMap: action.payload.timeMap }
                      : clip
                  ),
                }
              : track
          ),
          updatedAt: Date.now(),
        },
      };

    case 'SET_CLIP_TRANSITION_IN':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map((track) =>
            track.id === action.payload.trackId
              ? {
                  ...track,
                  clips: track.clips.map((clip) =>
                    clip.id === action.payload.clipId
                      ? { ...clip, inTransition: action.payload.transition }
                      : clip
                  ),
                }
              : track
          ),
          updatedAt: Date.now(),
        },
      };

    case 'SET_CLIP_TRANSITION_OUT':
      if (!state.project) return state;
      return {
        ...state,
        project: {
          ...state.project,
          tracks: state.project.tracks.map((track) =>
            track.id === action.payload.trackId
              ? {
                  ...track,
                  clips: track.clips.map((clip) =>
                    clip.id === action.payload.clipId
                      ? { ...clip, outTransition: action.payload.transition }
                      : clip
                  ),
                }
              : track
          ),
          updatedAt: Date.now(),
        },
      };

    case 'SPLIT_AT_PLAYHEAD': {
      if (!state.project) return state;
      const t = action.payload.time;

      let newSelected = state.selectedClipId;
      const tracks = state.project.tracks.map((track) => {
        const nextClips: Clip[] = [];
        for (const clip of track.clips) {
          if (clip.type === 'background') {
            nextClips.push(clip);
            continue;
          }
          const inside =
            t > clip.startTime + MIN_SPLIT_DURATION &&
            t < clip.startTime + clip.duration - MIN_SPLIT_DURATION;
          if (!inside) {
            nextClips.push(clip);
            continue;
          }
          const pair = splitClipAtTimelineTime(clip, t);
          if (!pair) {
            nextClips.push(clip);
            continue;
          }
          nextClips.push(pair.left, pair.right);
          if (state.selectedClipId === clip.id) {
            newSelected = pair.right.id;
          }
        }
        return { ...track, clips: nextClips };
      });

      return {
        ...state,
        project: {
          ...state.project,
          tracks,
          updatedAt: Date.now(),
        },
        selectedClipId: newSelected,
        selectedClipIds: newSelected ? [newSelected] : [],
      };
    }

    case 'SET_RECORDING':
      return { ...state, isRecording: action.payload };

    case 'SET_FFMPEG_LOADED':
      return { ...state, ffmpegLoaded: action.payload };

    case 'UPDATE_PROJECT':
      if (!state.project) return state;
      return {
        ...state,
        project: { ...state.project, ...action.payload, updatedAt: Date.now() },
      };

    default:
      return state;
  }
};

export const useEditorStore = create<StoreWithHistory>((set) => ({
  ...initialState,
  dispatch: (action) =>
    set((state) => {
      if (action.type === 'UNDO') {
        if (state.past.length === 0) return state;
        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, -1);
        const currentSnapshot = historyFromState(state);
        return {
          ...state,
          ...previous,
          past: newPast,
          future: [currentSnapshot, ...state.future],
        };
      }

      if (action.type === 'REDO') {
        if (state.future.length === 0) return state;
        const [next, ...rest] = state.future;
        const currentSnapshot = historyFromState(state);
        return {
          ...state,
          ...next,
          past: [...state.past, currentSnapshot],
          future: rest,
        };
      }

      if (action.type === 'REPLACE_SNAPSHOT') {
        const updated = editorReducer(state as EditorState, action);
        return {
          ...(state as StoreWithHistory),
          ...updated,
          past: [],
          future: [],
        };
      }

      const mutatingTypes: EditorAction['type'][] = [
        'SET_PROJECT',
        'ADD_TRACK',
        'REMOVE_TRACK',
        'ADD_CLIP',
        'REMOVE_CLIP',
        'UPDATE_CLIP',
        'SET_CLIP_SPEED',
        'SET_CLIP_REVERSE',
        'SET_CLIP_TIME_MAP',
        'SET_CLIP_TRANSITION_IN',
        'SET_CLIP_TRANSITION_OUT',
        'SPLIT_AT_PLAYHEAD',
        'ADD_MEDIA_FILE',
        'UPDATE_MEDIA_FILE',
        'REMOVE_MEDIA_FILE',
        'UPDATE_PROJECT',
      ];

      const shouldRecord = mutatingTypes.includes(action.type);
      const prevState = state as EditorState;
      const updated = editorReducer(prevState, action);
      if (!shouldRecord || updated === prevState) {
        return { ...(state as StoreWithHistory), ...updated };
      }

      const snapshot = historyFromState(prevState);
      const newPast = [...state.past, snapshot].slice(-50);

      return {
        ...(state as StoreWithHistory),
        ...updated,
        past: newPast,
        future: [],
      };
    }),
}));

export const createClip = (
  trackId: string,
  type: Clip['type'],
  name: string,
  startTime: number = 0,
  duration: number = 5,
  mediaUrl?: string,
  mediaType?: string
): Clip => ({
  id: generateId(),
  trackId,
  name,
  type,
  startTime,
  duration,
  volume: 1,
  speed: 1,
  reverse: false,
  timeMap: [],
  inTransition: null,
  outTransition: null,
  mediaUrl,
  mediaType,
  mediaLayout: 'cover',
  trackFace: false,
  transform: { ...DEFAULT_TRANSFORM },
  mediaCrop: { ...DEFAULT_MEDIA_CROP },
  mediaMask: { ...DEFAULT_MEDIA_MASK },
  effects: [],
  keyframes: {
    positionX: [],
    positionY: [],
    scaleX: [],
    scaleY: [],
    rotation: [],
    opacity: [],
  },
});

export const createTrack = (name: string, type: Track['type']): Track => ({
  id: generateId(),
  name,
  type,
  clips: [],
  muted: false,
  locked: false,
  visible: true,
});