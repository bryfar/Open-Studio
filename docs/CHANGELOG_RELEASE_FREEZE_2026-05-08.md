# Changelog de Entrega - Release Freeze (2026-05-08)

## Contexto de esta entrega

Este changelog resume el estado **actual en working tree** usado para congelar release.
No se realizaron commits ni tags automáticos durante esta preparación.

## Cambios principales incluidos

### 1) Reestructuración a monorepo por apps
- Se consolidó estructura por workspaces (`apps/*`) en el root.
- Se movió la app web a `apps/web` (con scripts y estructura feature-first).
- Se añadió la app de escritorio en `apps/desktop` (Electron + electron-builder).

### 2) Nuevo servicio backend de OpenShorts
- Se incorporó `apps/openstudio-shorts-service` con FastAPI + worker.
- Se añadieron módulos para generación de clips/shorts, cola de jobs y almacenamiento de artefactos.
- Se documentaron endpoints y flujo local del servicio.

### 3) Integración de rutas y módulos OpenShorts en web
- Se agregaron rutas dedicadas para experiencias de shorts y clip generator.
- Se conectaron componentes/librerías de editor y módulos asociados.

### 4) Soporte de release desktop
- Se añadió configuración de build y empaquetado para desktop.
- Existe workflow de release para desktop en `.github/workflows/desktop-release.yml`.

### 5) Documentación y compliance
- Se añadió `GPL_COMPLIANCE.md`.
- Se actualizaron READMEs por app (`apps/web`, `apps/desktop`, `apps/openstudio-shorts-service`).

## Notas de alcance y riesgos conocidos

- El repositorio está en transición de estructura; hay cambios masivos sin publicar.
- Existen artefactos locales no versionables (por ejemplo, `apps/desktop/dist` y `node_modules`) que deben excluirse antes del release.
- La versión en `package.json` root y workspaces está en `0.1.0`; definir si este freeze publica `v0.1.0` o `v0.1.1`.

## Evidencia mínima recomendada antes de publicar

- Verificar lint web: `npm run lint`
- Verificar que el backend de shorts arranca: `npm run dev:api` (smoke manual)
- Verificar build web: `npm run build`
- Verificar build desktop (si aplica release desktop): `npm run build:desktop`
