# AI Agent Instructions

This file provides guidance for AI agents working on this codebase.

## Project Overview

Open Studio is an open source browser-based video editor with:
- Multi-track timeline (video, audio, text)
- AI-assisted short video generation
- Desktop app (Electron)
- Shorts processing service (FastAPI)

## Key Directories

- `apps/web` - Next.js frontend
- `apps/desktop` - Electron desktop app
- `apps/openstudio-shorts-service` - Python FastAPI service
- `docs` - Technical documentation

## Important Files

- `package.json` - Monorepo root with scripts
- `apps/web/package.json` - Web app dependencies
- `apps/desktop/package.json` - Desktop app configuration

## Common Tasks

### Running the project
```bash
npm install        # Install all dependencies
npm run dev         # Start web app
npm run dev:desktop # Start desktop app
npm run dev:api     # Start API service
```

### Building
```bash
npm run build         # Build web
npm run dist:windows  # Build Windows installer
npm run lint          # Run linting
```

### Testing
```bash
npm run test        # Run unit tests
npm run e2e         # Run e2e tests
```

## Guidelines

- Always run `npm run lint` before committing
- Use TypeScript
- Write tests for new features
- Update documentation when changing APIs

## Getting Help

See `docs/` directory for architecture details.