# Claude AI Integration Guide

This file provides additional context for Claude when working with Open Studio.

## Project Context

Open Studio is a video editor built with:
- **Frontend**: Next.js + React + TypeScript
- **Desktop**: Electron with electron-builder
- **Backend**: FastAPI (Python) for AI shorts processing

## Architecture Highlights

### Web App (apps/web)
- Next.js 14+ with App Router
- Timeline editor with canvas-based rendering
- Video export via FFmpeg.wasm

### Desktop App (apps/desktop)
- Electron 37+
- Context isolation enabled
- Secure IPC communication

### Shorts Service (apps/openstudio-shorts-service)
- FastAPI + Celery for async processing
- Queue system for video processing jobs

## Common Patterns

- Use Zustand for state management
- Follow existing component patterns in `apps/web/src/`
- Keep API calls in dedicated hooks

## Testing

- Unit: Vitest
- E2E: Playwright
- Run `npm run e2e` before significant changes

## Documentation

- Update relevant README in `apps/` when changing APIs
- Keep architecture docs in `docs/` current
- CHANGELOG follows semver