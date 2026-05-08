# OpenStudio Editor Architecture

## Modulos principales

- `apps/web/src/components/editor`: UI del editor (timeline, canvas, paneles).
- `apps/web/src/stores/editorStore.ts`: estado global y reducer de edicion.
- `apps/web/src/lib/editor`: logica de dominio (subtitles, interchange, proxy).
- `apps/web/src/lib/ffmpeg.ts`: operaciones de transcode y export.
- `apps/openstudio-shorts-service`: jobs externos (cola/worker) para cargas largas.

## Contratos de datos

- `Project`: timeline, tracks, renderQueue, subtitles, multicam, interchange.
- `MediaFile`: metadatos + proxy (`proxyUrl`, `proxyReady`) y datos de multicam.

## Reglas de integracion

1. UI nunca muta estado directo; solo `dispatch`.
2. Toda feature nueva debe tener:
   - estado tipado en `types/index.ts`,
   - servicio en `lib/editor/*` o `lib/*`,
   - pruebas basicas de flujo.
3. Features pesadas de render/proxy deben poder ejecutarse en worker/cola.
