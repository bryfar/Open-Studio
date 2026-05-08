# OpenStudio Desktop

Electron wrapper for the web editor with:

- Offline-ready packaged UI
- Local persistence bridge (filesystem-backed key-value store)
- Native save dialogs for exports
- Auto-update integration (GitHub Releases)

## Development

```bash
npm run dev:desktop
```

## Platform structure

```bash
apps/desktop/
  build/
    common/   # Shared electron-builder base config
    windows/  # Windows installer config and output
    macos/    # macOS installer config and output
    linux/    # Linux installer config and output
  dist/
    windows/
    macos/
    linux/
```

## Build installers by platform

```bash
npm run desktop:dist:windows
npm run desktop:dist:macos
npm run desktop:dist:linux
```

## Build unpacked app by platform

```bash
npm run desktop:pack:windows
npm run desktop:pack:macos
npm run desktop:pack:linux
```

## Auto-select current OS

```bash
npm run desktop:dist
npm run desktop:pack
```

## Auto-update and release publishing

- Local builds use `--publish never` (no release upload).
- Tagged CI builds (`v*`) publish artifacts and update metadata to GitHub Releases.
- Required environment for publish steps:
  - `GH_TOKEN`
  - `GH_OWNER`
  - `GH_REPO`
