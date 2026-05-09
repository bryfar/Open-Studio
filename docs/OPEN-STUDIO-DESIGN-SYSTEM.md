# Open Studio Design System

Versión: 1.0  
Base visual: UI minimalista editorial de Open Studio  
Stack objetivo: Next.js + React + Tailwind CSS v4 + TypeScript

> **Implementación en este repo:** la UI compartida vive hoy en `apps/web/src/shared/components/ui/` (no en `shared/ui/`). Los tokens pueden concentrarse en `tokens.css`; `themes.css` es opcional hasta que se extraigan bloques `[data-theme]`. El skill de Cursor `.cursor/skills/open-studio-design-system/` apunta a este archivo.

---

## 1. Objetivo

Este documento define el sistema visual y de interfaz para Open Studio, alineado con la UI propuesta para el editor de video y con la arquitectura del repositorio.

Está pensado para usarse en:

- `apps/web/src/styles/`
- `apps/web/src/shared/components/ui/` (ruta actual del repo)
- `apps/web/src/features/*/components/`

Principios base:

- Claridad antes que decoración.
- Jerarquía visual fuerte.
- Superficies limpias y silenciosas.
- Interacciones sobrias, precisas y rápidas.
- Consistencia entre modo light y modo dark.
- Componentes reutilizables con tokens semánticos, no colores hardcodeados.

---

## 2. Principios de marca y UI

### 2.1 Atributos

- Claro
- Preciso
- Creativo
- Minimalista

### 2.2 Tono visual

- Editorial
- Productivo
- Técnico pero accesible
- Sobrio, sin exceso de efectos
- Enfocado en contenido, timeline y acciones

### 2.3 Reglas generales

- Usar contrastes altos para texto y acciones primarias.
- Reservar color semántico para feedback del sistema.
- Evitar sombras duras, brillos, degradados llamativos o glassmorphism.
- Las superficies deben separar contexto sin competir con el contenido.
- El video preview y la timeline deben ser el foco funcional principal.

---

## 3. Arquitectura recomendada de design system

Objetivo de carpetas (ajustar nombres a lo que ya exista en el monorepo):

```txt
apps/web/src/
  styles/
    tokens.css
    themes.css    # opcional: solo [data-theme] si se separa del resto
    globals.css
  shared/
    components/ui/   # ruta actual: Button, Input, Slider, …
    icons/
    utils/
      cn.ts
  features/
    */components/    # consume tokens + UI compartida
```

### 3.1 Criterios de implementación

- `styles/` concentra tokens y temas globales.
- Los componentes transversales viven bajo `shared/components/ui/` en este repositorio.
- Las features solo consumen el sistema; no redefinen estilos base salvo casos aislados documentados.

---

## 4. Tokens globales

### 4.1 Modo Light

```css
:root,
[data-theme="light"] {
  --os-bg-base: #FFFFFF;
  --os-bg-subtle: #F7F7F5;
  --os-surface: #FFFFFF;
  --os-surface-alt: #F1F1EF;

  --os-text-primary: #191919;
  --os-text-secondary: #5F5E5B;
  --os-text-muted: #8C8A86;
  --os-text-inverse: #FFFFFF;

  --os-border-default: #E7E5E4;
  --os-border-strong: #D6D3D1;
  --os-border-focus: #111111;

  --os-accent: #111111;
  --os-accent-on: #FFFFFF;

  --os-success: #1F7A4D;
  --os-success-soft: #E8F5EE;
  --os-warning: #A16207;
  --os-warning-soft: #FFF4DB;
  --os-error: #B42318;
  --os-error-soft: #FEECEB;

  --os-overlay: rgba(17, 17, 17, 0.48);
  --os-selection: rgba(17, 17, 17, 0.08);
  --os-ring: rgba(17, 17, 17, 0.18);

  --os-timeline-track: #ECEAE7;
  --os-timeline-grid: #DDDAD6;
  --os-timeline-playhead: #111111;
  --os-timeline-clip-video: #D9DDE6;
  --os-timeline-clip-audio: #B9E9C9;
  --os-timeline-clip-text: #E7D6F7;
  --os-timeline-clip-selected: #111111;

  --os-canvas-bg: #0F0F10;
  --os-toolbar-bg: rgba(255, 255, 255, 0.86);
}
```

### 4.2 Modo Dark

```css
[data-theme="dark"] {
  --os-bg-base: #141414;
  --os-bg-subtle: #1C1C1C;
  --os-surface: #232323;
  --os-surface-alt: #2C2C2C;

  --os-text-primary: #F5F5F4;
  --os-text-secondary: #D6D3D1;
  --os-text-muted: #A8A29E;
  --os-text-inverse: #111111;

  --os-border-default: #3A3A3A;
  --os-border-strong: #4A4A4A;
  --os-border-focus: #FFFFFF;

  --os-accent: #FFFFFF;
  --os-accent-on: #111111;

  --os-success: #4ADE80;
  --os-success-soft: rgba(74, 222, 128, 0.14);
  --os-warning: #FBBF24;
  --os-warning-soft: rgba(251, 191, 36, 0.14);
  --os-error: #F87171;
  --os-error-soft: rgba(248, 113, 113, 0.14);

  --os-overlay: rgba(0, 0, 0, 0.56);
  --os-selection: rgba(255, 255, 255, 0.08);
  --os-ring: rgba(255, 255, 255, 0.18);

  --os-timeline-track: #252525;
  --os-timeline-grid: #343434;
  --os-timeline-playhead: #F5F5F4;
  --os-timeline-clip-video: #4A5160;
  --os-timeline-clip-audio: #1F7A4D;
  --os-timeline-clip-text: #6D4AA2;
  --os-timeline-clip-selected: #FFFFFF;

  --os-canvas-bg: #0B0B0C;
  --os-toolbar-bg: rgba(35, 35, 35, 0.86);
}
```

---

## 5. Tokens derivados

### 5.1 Tipografía

```css
:root {
  --os-font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  --os-font-size-xs: 12px;
  --os-font-size-sm: 13px;
  --os-font-size-md: 14px;
  --os-font-size-lg: 16px;
  --os-font-size-xl: 20px;
  --os-font-size-2xl: 28px;
  --os-font-size-3xl: 40px;

  --os-line-height-xs: 16px;
  --os-line-height-sm: 18px;
  --os-line-height-md: 20px;
  --os-line-height-lg: 24px;
  --os-line-height-xl: 28px;
  --os-line-height-2xl: 36px;
  --os-line-height-3xl: 48px;

  --os-font-weight-regular: 400;
  --os-font-weight-medium: 500;
  --os-font-weight-semibold: 600;
  --os-font-weight-bold: 700;

  --os-letter-spacing-tight: -0.02em;
  --os-letter-spacing-normal: 0;
}
```

### 5.2 Escala tipográfica

- Display: `40/48`, 700, tracking `-0.02em`
- H1: `28/36`, 700
- H2: `20/28`, 600
- H3: `16/24`, 600
- Body: `14/20`, 400 o 500
- Small: `13/18`, 400 o 500
- Caption: `12/16`, 400
- Mono opcional para timecode: `ui-monospace, SFMono-Regular, Menlo, monospace`

### 5.3 Espaciado

```css
:root {
  --os-space-1: 4px;
  --os-space-2: 8px;
  --os-space-3: 12px;
  --os-space-4: 16px;
  --os-space-5: 20px;
  --os-space-6: 24px;
  --os-space-8: 32px;
  --os-space-10: 40px;
  --os-space-12: 48px;
}
```

### 5.4 Radio

```css
:root {
  --os-radius-sm: 8px;
  --os-radius-md: 12px;
  --os-radius-lg: 16px;
  --os-radius-xl: 20px;
  --os-radius-pill: 999px;
}
```

### 5.5 Bordes y sombras

```css
:root {
  --os-border-width: 1px;
  --os-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --os-shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.06);
  --os-shadow-md: 0 8px 24px rgba(0, 0, 0, 0.10);
}
```

Regla: sombras mínimas; priorizar borde y contraste de superficie.

### 5.6 Motion

```css
:root {
  --os-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --os-ease-emphasis: cubic-bezier(0.2, 0.8, 0.2, 1);
  --os-duration-fast: 120ms;
  --os-duration-base: 180ms;
  --os-duration-slow: 260ms;
}
```

---

## 6. Semántica de layout

### 6.1 Z-index

```css
:root {
  --os-z-base: 0;
  --os-z-dropdown: 1000;
  --os-z-sticky: 1100;
  --os-z-overlay: 1200;
  --os-z-dialog: 1300;
  --os-z-toast: 1400;
  --os-z-tooltip: 1500;
}
```

### 6.2 Breakpoints sugeridos

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1440px

### 6.3 Grilla del editor

- Topbar: `56px`
- Sidebar izquierda: `240px`
- Inspector derecha: `320px`
- Preview: flexible
- Timeline: `280px` a `360px`

Mobile/tablet: inspector oculto por defecto; sidebar colapsable; timeline expandible abajo.

---

## 7. Tokens Tailwind v4 recomendados

### 7.1 Alias utilitarios (`@theme`)

```css
@theme {
  --color-os-bg-base: var(--os-bg-base);
  --color-os-bg-subtle: var(--os-bg-subtle);
  --color-os-surface: var(--os-surface);
  --color-os-surface-alt: var(--os-surface-alt);
  --color-os-text-primary: var(--os-text-primary);
  --color-os-text-secondary: var(--os-text-secondary);
  --color-os-text-muted: var(--os-text-muted);
  --color-os-border-default: var(--os-border-default);
  --color-os-border-strong: var(--os-border-strong);
  --color-os-accent: var(--os-accent);
  --color-os-accent-on: var(--os-accent-on);
  --color-os-success: var(--os-success);
  --color-os-warning: var(--os-warning);
  --color-os-error: var(--os-error);

  --radius-os-sm: var(--os-radius-sm);
  --radius-os-md: var(--os-radius-md);
  --radius-os-lg: var(--os-radius-lg);

  --spacing-os-1: var(--os-space-1);
  --spacing-os-2: var(--os-space-2);
  --spacing-os-3: var(--os-space-3);
  --spacing-os-4: var(--os-space-4);
  --spacing-os-6: var(--os-space-6);
  --spacing-os-8: var(--os-space-8);
}
```

### 7.2 Clases utilitarias sugeridas

- Fondo base: `bg-[var(--os-bg-base)]`
- Superficie: `bg-[var(--os-surface)]`
- Borde: `border-[var(--os-border-default)]`
- Texto primario: `text-[var(--os-text-primary)]`
- Texto secundario: `text-[var(--os-text-secondary)]`
- Accent: `bg-[var(--os-accent)] text-[var(--os-accent-on)]`

---

## 8. Estilos globales (`globals.css`)

```css
html {
  color-scheme: light;
}

html[data-theme="dark"] {
  color-scheme: dark;
}

body {
  background: var(--os-bg-base);
  color: var(--os-text-primary);
  font-family: var(--os-font-sans);
  font-size: var(--os-font-size-md);
  line-height: var(--os-line-height-md);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  border-color: var(--os-border-default);
}

::selection {
  background: var(--os-selection);
}

:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--os-ring);
  border-radius: var(--os-radius-sm);
}
```

### Scrollbars

```css
* {
  scrollbar-width: thin;
  scrollbar-color: var(--os-border-strong) transparent;
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-thumb {
  background: var(--os-border-strong);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}
```

---

## 9. Componentes base (resumen)

| Primitiva | Notas clave |
|-----------|----------------|
| **Button** | Variantes: `primary`, `secondary`, `ghost`, `danger`, `success`, `toolbar`. Altura 36px, radio 12px, gap icono 8px. Primary: `--os-accent` / `--os-accent-on`, hover opacidad ~0.92. |
| **IconButton** | 32 / 36 / 40; selected con `--os-selection` en toolbars. |
| **Input** | 40px alto, `--os-surface`, focus ring `--os-ring`. |
| **Select / Dropdown** | Menú sobre `--os-surface`; hover ítem `--os-bg-subtle`; activo `--os-selection`. |
| **Tabs** | `underline`, `segmented`, `editor-panel`. |
| **Card / Panel** | `--os-surface`, borde default, radio 16px. |
| **Dialog** | Overlay `--os-overlay`; superficie `--os-surface`, radio 20px. |
| **Tooltip** | Fondo `--os-text-primary`, texto `--os-text-inverse`, 12/16. |
| **Badge** | neutral, success, warning, error, info. |
| **Slider** | Track 4px, thumb 16px; activo `--os-accent`. |
| **Switch / Checkbox / Radio** | AA mínimo; switch ~36×20. |
| **EmptyState** | Icono, título, ayuda, CTA opcional. |

---

## 10. Componentes del editor (resumen)

- **AppShell:** Topbar, Sidebar, MainWorkspace, Inspector, TimelineDock; sin colores locales fuera de tokens.
- **Topbar:** 56px; `--os-bg-base` o `--os-toolbar-bg`; borde inferior default.
- **Sidebar:** `--os-surface`; activo `--os-selection`.
- **PreviewCanvas:** `--os-canvas-bg`; sin bordes pesados ni degradados innecesarios.
- **Transport:** IconButton toolbar; estados selected discretos.
- **Timeline:** `--os-timeline-grid`, `--os-timeline-track`, `--os-timeline-playhead`, clips por tipo; selección clara sin glow pesado.
- **Media bin / Inspector:** metadatos en `--os-text-secondary`; bloques y acordeones.

---

## 11–14. Estados, accesibilidad, iconografía, interacción

- **Loading:** skeletons discretos.
- **Empty / Error / Disabled:** mensaje claro, CTA cuando aplique; no solo color.
- **A11y:** `focus-visible`, contraste AA, targets ≥36px en compactos.
- **Iconos:** Lucide; 16 / 18 / 20; grosor uniforme.
- **Motion:** hover ~120ms; paneles ~180ms; timeline casi instantáneo.

---

## 15. React: `cn` y Button ejemplo

Usar `cn` desde `@/shared/utils` (o ruta equivalente del proyecto).

```tsx
const variantStyles: Record<string, string> = {
  primary: 'bg-[var(--os-accent)] text-[var(--os-accent-on)] hover:opacity-90',
  secondary: 'bg-[var(--os-surface-alt)] text-[var(--os-text-primary)] border border-[var(--os-border-default)]',
  ghost: 'bg-transparent text-[var(--os-text-secondary)] hover:bg-[var(--os-bg-subtle)]',
  danger: 'bg-[var(--os-error)] text-white hover:opacity-90',
  toolbar: 'bg-transparent text-[var(--os-text-secondary)] hover:bg-[var(--os-surface-alt)]',
};
```

---

## 16. Reglas de adopción

### Sí hacer

- Centralizar colores en `tokens.css` (y `themes.css` si se separa).
- Nombres semánticos; evitar `zinc-*` o hex sueltos en features.
- Primitivas en `shared/components/ui/` antes de duplicar.

### No hacer

- Hex hardcodeado para roles ya cubiertos por tokens.
- Animaciones pesadas en timeline o preview.
- Sombras o efectos fuera de la dirección editorial.

---

## 17. Roadmap sugerido

1. Foundations: tokens + themes + globals + primitivas.
2. Migrar shell editor: topbar, sidebar, inspector, timeline.
3. Catálogo / tests visuales; persistencia `data-theme`.

---

## 18. Checklist de merge UI

- Tokens semánticos
- Light y dark coherentes
- Foco visible (`--os-ring`)
- Spacing consistente
- Preview y timeline siguen siendo el foco

---

## 19. Resumen ejecutivo

Open Studio debe sentirse como herramienta profesional, silenciosa y precisa. El sistema no compite con el audiovisual; lo ordena. Base en blanco, negro, grises cálidos y color semántico controlado.

---

## 20. Migración desde tokens “v2 CapCut-style” del repo

- **`tokens.css`:** al final del archivo, los nombres v1.0 (`--os-bg-base`, `--os-surface`, `--os-ring`, `--os-timeline-track`, tipografía `--os-font-size-*`, etc.) son **alias** a la paleta ya desplegada: sin `data-theme` no cambia ningún píxel.
- **`themes.css`:** importado desde `globals.css` después de `tokens.css`. Contiene la paleta editorial §4.1 / §4.2 solo bajo `[data-theme="light"]` y `[data-theme="dark"]`, más un **puente** a variables legacy (`--os-bg-app`, `--os-accent-primary`, timeline, botones, etc.) para que, al activar tema, el editor siga leyendo los mismos nombres.
- **Activación:** añade `data-theme="light"` o `data-theme="dark"` en `<html>` cuando quieras conmutar; si no está el atributo, la app se ve igual que antes.

El código puede seguir usando nombres legacy. **Código nuevo:** preferir nombres v1.0 de este documento.
