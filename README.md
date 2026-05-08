# Open Studio

Monorepo de Open Studio con tres aplicaciones principales:

- `apps/web`: editor web (Next.js)
- `apps/desktop`: app de escritorio (Electron)
- `apps/openstudio-shorts-service`: API/worker para OpenShorts (FastAPI)

## Estructura del repositorio

```text
Open-Studio/
  apps/
    web/
    desktop/
      build/
        common/
        windows/
        macos/
        linux/
    openstudio-shorts-service/
  docs/
  landing/
```

## Requisitos

- Node.js 20+
- npm 10+
- Python 3.10+ (para `openstudio-shorts-service`)

## Instalacion

```bash
git clone https://github.com/bryfar/Open-Studio.git
cd Open-Studio
npm install
```

## Desarrollo

- Web: `npm run dev` o `npm run dev:app`
- Desktop (Electron + web): `npm run dev:desktop`
- API FastAPI: `npm run dev:api`
- Worker de jobs: `npm run dev:worker`
- Todo junto (web + api + worker): `npm run dev:full`

Rutas clave de la app web:

- `http://localhost:3000/`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/editor`
- `http://localhost:3000/clip-generator`
- `http://localhost:3000/ai-shorts`

Health del backend:

- `http://localhost:8000/health`

## Build y empaquetado Desktop por sistema operativo

La app de escritorio esta separada por plataforma, cada una con su config y salida:

- Windows config: `apps/desktop/build/windows/electron-builder.windows.json`
- macOS config: `apps/desktop/build/macos/electron-builder.macos.json`
- Linux config: `apps/desktop/build/linux/electron-builder.linux.json`
- Base compartida: `apps/desktop/build/common/electron-builder.base.json`

Comandos:

- Auto OS actual:
  - `npm run desktop:dist`
  - `npm run desktop:pack`
- Especificos por OS:
  - `npm run desktop:dist:windows`
  - `npm run desktop:dist:macos`
  - `npm run desktop:dist:linux`
  - `npm run desktop:pack:windows`
  - `npm run desktop:pack:macos`
  - `npm run desktop:pack:linux`

Salidas esperadas:

- `apps/desktop/dist/windows`
- `apps/desktop/dist/macos`
- `apps/desktop/dist/linux`

Tipos de instalador por plataforma:

- Windows: NSIS (`.exe`)
- macOS: DMG (`.dmg`)
- Linux: AppImage (`.AppImage`) y DEB (`.deb`)

## Testing y calidad

- Lint web: `npm run lint`
- E2E: `npm run e2e`
- E2E UI: `npm run e2e:ui`

## Notas de release

- Workflow CI Desktop: `.github/workflows/desktop-release.yml`
- Checklist manual: `docs/RELEASE_CHECKLIST.md`
- Changelog de freeze: `docs/CHANGELOG_RELEASE_FREEZE_2026-05-08.md`

## Variables y servicios externos

En el servicio de shorts usa `apps/openstudio-shorts-service/.env.example` como base.

Claves comunes para integraciones:

- `GEMINI_API_KEY`
- `FAL_KEY`
- `ELEVENLABS_API_KEY`
- `UPLOAD_POST_API_KEY`

## Licencia

- Codigo principal: MIT (ver `LICENSE`)
- Notas de cumplimiento de dependencias/compatibilidad: `GPL_COMPLIANCE.md`