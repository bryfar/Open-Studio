# Editor Functional Checklist

## Core Editing
- [x] Create/open project from dashboard.
- [x] Import video/audio/image assets.
- [x] Add clips to timeline tracks.
- [x] Drag, trim, split clips.
- [x] Multi-select and delete clips.
- [x] Undo/redo for timeline and clip mutations.

## Timeline Pro
- [x] Per-clip speed control.
- [x] Per-clip reverse playback.
- [x] Time-remap speed keyframes (basic).
- [x] Transition assignment (in/out).
- [x] Transition indicators in timeline.

## Preview
- [x] Play/pause/stop/frame step.
- [x] Camera keyframes interpolation.
- [x] Text/image keyframe interpolation.
- [x] Speed/reverse respected in preview.
- [x] Fade transition preview support.

## Export
- [x] MP4/WebM/GIF/Image export paths.
- [x] Timeline export with multiple clips.
- [x] Overlay compositor path.
- [x] Audio merge support.
- [x] Fallback notifications for unsupported transitions.

## Recorder
- [x] Screen recording start/stop.
- [x] System audio / microphone options.
- [x] Recorded media auto-added to library.
- [x] MIME fallback (vp9 -> vp8 -> webm/default).

## Quality Gates
- [x] `npm.cmd run lint` (no errors).
- [x] `npm.cmd run build` (passes).
- [x] Playwright smoke tests scaffolded in `tests/e2e`.
