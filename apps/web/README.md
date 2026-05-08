# OpenStudio Web App

This workspace represents the web application layer in the monorepo.

Current implementation remains at repository root while monorepo scripts orchestrate:

- Web: Next.js (root project)
- API: `apps/openstudio-shorts-service` (FastAPI)

This allows incremental migration without breaking current development flow.

## Architecture Convention

Feature-first structure and folder rules are documented in:

- `docs/WEB_FEATURE_STRUCTURE.md`

## Create New Feature

Use the scaffold command:

- `npm run create:feature -- auth`
- `npm run create:feature -- user-profile`

Options:

- `--force`: overwrite base files (`index.ts`, `README.md`, `.gitkeep`)
