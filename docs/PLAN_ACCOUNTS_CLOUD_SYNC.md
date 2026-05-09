# Plan: cuentas, backend y sincronización en la nube (Open Studio)

Documento orientado a ejecución por fases, alineado con el monorepo actual: **Next.js** (`apps/web`, App Router, export estático para escritorio), **Electron** (`apps/desktop`, bundle servido desde `resources/web-out` vía `serve-handler` en `main.cjs`), **FastAPI** (`apps/openstudio-shorts-service`) y dependencia cliente **Supabase** ya presente en raíz (`@supabase/supabase-js`, `NEXT_PUBLIC_SUPABASE_*` en `apps/web/src/core/lib/supabase.ts`).

---

## 1. Autenticación y sesiones

| Opción | Pros | Contras / notas |
|--------|------|------------------|
| **Supabase Auth** | Ya hay cliente y variables; RLS nativa; almacenamiento y firmas URL para blobs | Acoplamiento al proveedor; políticas y migraciones a mantener |
| **Auth.js (NextAuth)** en `apps/web` | Integración idiomatica con Next; muchos proveedores OIDC | Requiere backend de sesión o JWT; modelo de datos propio para proyectos |
| **Clerk / Auth0 / etc.** | Velocidad de integración | Coste y modelo de datos externo |

**Recomendación MVP:** Supabase Auth (email magic link u OAuth) más tabla `profiles` y políticas RLS, reutilizando el stack ya importado.

**Sesión en web:** cookies httpOnly vía middleware de Next (si se usa servidor) o sesión en cliente con refresh token de Supabase; evitar tokens de larga duración en `localStorage` sin cifrado.

**Sesión en Electron:** mismo flujo de login que la web (misma URL o embedded); persistir refresh de forma segura con `safeStorage` de Electron cuando esté disponible, con degradación documentada.

---

## 2. Modelo de datos en la nube

- **Metadatos en Postgres (Supabase):** `projects` (id, user_id, nombre, `updated_at`, `version` o `revision`, checksum de timeline, flags), `project_members` (fase colaboración), `sync_state` opcional por dispositivo.
- **Blobs grandes (object storage, p. ej. S3 compatible o Supabase Storage):** archivos de media, exportaciones, thumbnails; rutas guardadas en DB; URLs firmadas para subida/descarga.
- **RLS:** `user_id = auth.uid()` en filas de proyecto; políticas explícitas para lectura/escritura y para Storage por prefijo `user_id/project_id/`.

---

## 3. Local-first y almacenamiento offline

**Estado actual en repo (referencia):**

- `apps/web/src/core/lib/storage.ts`: **idb-keyval** (IndexedDB) con fallback a **localStorage**; en Electron, bridge a almacenamiento en **userData** (`main.cjs`: `local-storage/kv-store.json`).

**Dirección:**

| Capa | Uso sugerido |
|------|----------------|
| IndexedDB | Índice de proyectos, metadatos, colas de sincronización, punteros a blobs locales |
| OPFS / File System Access | Ficheros de video/audio grandes en web cuando el navegador lo permita; progresivo |
| Electron | Misma API de app; persistencia ya en disco bajo `app.getPath('userData')`; valorar `safeStorage` para secretos |

---

## 4. Estrategias de sincronización

1. **MVP:** última escritura gana (LWW) por recurso, con entero `version` o timestamp `updated_at` en servidor; cliente rechaza push si `version` local menor que la del servidor (409) y descarga la nube.
2. **Fase 2:** cola de operaciones idempotentes (crear proyecto, subir blob, parche de metadatos) con reintentos y orden por `client_mutation_id`.
3. **Colaboración / CRDT:** solo si hay edición simultánea multiusuario en la misma línea de tiempo; evaluar coste frente a bloqueo por “quien edita” o ramas de proyecto. No es requisito para backup y sync un usuario.

---

## 5. API y ficheros grandes

- **Superficie:** REST bien acotado o **tRPC** si todo el cliente es TypeScript y se centraliza en Next o en un BFF; el servicio Python puede seguir en jobs async (shorts) sin mezclar con sync de proyecto hasta integrarlo.
- **Subidas:** multipart o PUT firmado a Storage; **reanudación** con upload por chunks (tus resumable o equivalente en el proveedor).
- **Contratos:** versionado de API (`/v1/...`); errores tipados para conflictos y cuotas.

---

## 6. Paridad web vs escritorio

| Tema | Web | Electron |
|------|-----|----------|
| Login | Redirect OAuth o magic link en ventana | Misma web empaquetada; deep links `openstudio://` si hace falta callback |
| Tokens | Cookies o almacenamiento seguro según elección | `safeStorage` + mismo modelo de refresh |
| Datos locales | IndexedDB + fallback LS | Mismo código + bridge IPC a KV en disco |

---

## 7. Hitos por fases

| Fase | Objetivo | Entregables |
|------|-----------|---------------|
| **0 – Descubrimiento** | Inventario y límites | Mapa de `storage.ts`, tamaños típicos de proyecto, requisitos legales (RGPD), elección proveedor auth/storage |
| **1 – Auth + backup unidireccional** | Cuenta y copia a la nube | Registro/login, subida manual o automática de snapshot de proyecto, listado en dashboard |
| **2 – Sync bidireccional** | Dos dispositivos, un usuario | Pull/push con `version`, cola offline, detección de 409 |
| **3 – UI de conflictos** | Resolución explícita | Pantalla “versión local vs remota”, merge manual o descartar una copia |
| **4 – Colaboración (opcional)** | Varios editores | Invitaciones, RLS por miembro, posible evolución a CRDT u operaciones |

---

## 8. Riesgos y pruebas

**Riesgos:** pérdida de datos si LWW mal implementado; límites de cuota Storage; tokens en disco sin cifrar en Electron antiguo; export estático del editor sin cookies de servidor si se asume solo cliente.

**Pruebas:** e2e (Playwright ya en monorepo) para flujo login + crear proyecto + sync simulado; escenarios de conflicto (dos pestañas, dos `version`); pruebas manuales en build `pack:windows` con `web-out` presente.

---

## 9. Resumen ejecutivo

Priorizar **Supabase Auth + Postgres + Storage** coherente con dependencias actuales; **metadatos en filas versionadas**, **medios en object storage**; cliente **local-first** reforzando el patrón IndexedDB + bridge Electron; **MVP LWW**, luego **cola de operaciones**; **paridad** web/desktop en login y almacenamiento de secretos; hitos de **descubrimiento → backup → sync → conflictos → colaboración opcional**.
