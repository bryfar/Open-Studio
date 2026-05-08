# Web Feature Structure Guide

This document defines the canonical folder structure for `apps/web/src` and how to place new code.

## Canonical `src` Layout

```txt
src/
  app/
  core/
  shared/
  features/
  assets/
  styles/
```

## Responsibility by Layer

- `app/`: Next.js App Router entrypoints (routes, layouts, global providers, route-level middleware glue).
- `core/`: cross-feature business/infrastructure logic (API clients, domain rules, shared validators, constants).
- `shared/`: generic reusable building blocks (UI components, shared hooks, common utils, common types).
- `features/`: vertical slices by use case/domain (each feature owns components, hooks, services, types, state).
- `assets/`: static assets imported from source (images/icons/videos used by code).
- `styles/`: global styles and cross-feature design tokens.

## Import Rules

- Prefer absolute aliases using `@/`.
- Feature code can import from:
  - itself (`@/features/<feature-name>/...`)
  - `@/shared/...`
  - `@/core/...`
- Feature code should not depend directly on sibling feature internals.
- `app/` can orchestrate feature entrypoints, but avoid placing feature logic in routes.

## Feature Template (Copy This)

Create new features under `src/features/<feature-name>/` with this baseline:

```txt
src/features/<feature-name>/
  components/
  hooks/
  lib/
  services/
  store/
  types/
  pages/
  index.ts
```

Minimal `index.ts` example:

```ts
export * from './components';
export * from './hooks';
export * from './types';
```

## Naming Conventions

- Folders: `kebab-case` (`clip-generator`, `user-profile`).
- React components: `PascalCase.tsx`.
- Hooks: `useSomething.ts`.
- Utilities/services: `camelCase.ts`.
- Types: colocate by feature in `types/` and only promote to `shared/types` when truly global.

## Definition of Done for New Features

- Feature folder follows the template.
- Route/page only composes feature modules and shared/core dependencies.
- No relative imports that cross feature boundaries.
- Shared abstractions promoted to `shared` or `core` when reused by 2+ features.
