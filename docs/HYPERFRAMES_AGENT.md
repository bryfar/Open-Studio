# Hyperframes e IA (BYOK) en Open Studio

## Dónde está en la app

- Editor → panel izquierdo **Estudio** → **Hyperframes IA**
- Configura **proveedor**, **base URL**, **modelo** y **API key** (solo en tu dispositivo: `localStorage` en web, KV de Electron en escritorio).

## Web (`npm run dev` / despliegue con servidor Next)

Las llamadas al modelo pasan por **`POST /api/ai/agent-completion`**, que reenvía a tu endpoint OpenAI-compatible (`/v1/chat/completions`). La clave **no se guarda en el servidor**; solo viaja en esa petición.

**Export estático del escritorio** (`OPENSTUDIO_DESKTOP_EXPORT=1`) **no incluye** rutas API: en la app empaquetada el chat usa **IPC** (`desktop:ai:chat-completion`).

## Escritorio (Electron)

- **Chat**: el proceso principal hace `fetch` a tu API con la key que envía la UI (misma semántica que el proxy web).
- **Render MP4**: botón **Render MP4 (solo escritorio)** ejecuta `npx hyperframes render` en un directorio temporal con tu `index.html` generado.

### Requisitos para render local

- **Node.js** y **`npx`** disponibles en el PATH del sistema (no solo del IDE).
- **FFmpeg** instalado ([Hyperframes docs](https://github.com/heygen-com/hyperframes)).
- Primera ejecución puede descargar el paquete `hyperframes` vía `npx`.

Si el comando falla, revisa el **log** que muestra el panel.

## Skills y documentación HeyGen

Para que **Cursor / otros agentes** escriban composiciones correctas:

```bash
npx skills add heygen-com/hyperframes
```

Referencia: [hyperframes.heygen.com](https://hyperframes.heygen.com/introduction), repositorio [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes).

## Seguridad

- Las API keys son **responsabilidad del usuario**; no las subas al repositorio ni las pegues en issues.
- La vista previa HTML usa `iframe` con **sandbox**; contenido no confiable puede seguir siendo peligroso: usa solo salidas de modelos que controles.
