# Feature Template

Copy this folder structure when creating a new feature:

```txt
<feature-name>/
  components/
  hooks/
  lib/
  services/
  store/
  types/
  pages/
  index.ts
```

Rules:

- Keep feature internals private by default.
- Export public contracts from `index.ts`.
- Move code to `shared/` or `core/` only when reused across features.
