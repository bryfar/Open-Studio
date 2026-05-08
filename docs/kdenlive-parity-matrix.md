# Matriz de paridad Kdenlive vs OpenStudio

## Alcance y criterio

- Referencia revisada: `uploads/kdenlive-0.md` (metadata general del repo Kdenlive, sin desglose funcional detallado).
- Evidencia principal de OpenStudio: `apps/web/src/components/editor/*`, `apps/web/src/stores/editorStore.ts`, `apps/web/src/lib/ffmpeg.ts`, `apps/web/src/lib/exportCompositor.ts`, `apps/web/src/types/index.ts`.
- Estados usados:
  - `Implementado`: hay flujo funcional real en código (UI + estado/pipeline).
  - `Parcial`: existe UI/estado pero falta ejecución real, cobertura incompleta o limitaciones fuertes.
  - `No iniciado`: no se encontró implementación verificable.

## Matriz de paridad

| Área | Feature Kdenlive | Estado en OpenStudio | Evidencia en código (archivo/símbolo) | Gap técnico | Prioridad | Esfuerzo |
|---|---|---|---|---|---|---|
| Timeline | Playback + playhead + scrub | Implementado | `components/editor/Timeline.tsx` (`handleTimelineClick`, `handlePlayheadMouseDown`, ruler/playhead UI) | Falta JKL shuttle y controles de reproducción avanzados | P1 | M |
| Timeline | Split en playhead | Implementado | `stores/editorStore.ts` (`SPLIT_AT_PLAYHEAD`, `splitClipAtTimelineTime`) | No hay herramientas avanzadas de razor/multi-split por rango | P1 | M |
| Timeline | Trim in/out por borde | Implementado | `components/editor/Timeline.tsx` (`handleTrimStart`, bloque `trimmingClip`) | Falta modo trim dedicado con vista previa dual | P1 | M |
| Timeline | Snap magnético de clips/playhead | Implementado | `components/editor/Timeline.tsx` (`buildSnapPoints`, `snapScalar`, `snapClipStart`) | No hay snapping configurable por tipo de referencia (marcadores, clips bloqueados, etc.) | P1 | M |
| Timeline | Ripple edit | Parcial | `components/editor/Timeline.tsx` (`rippleEditingEnabled`, ramas con `UPDATE_PROJECT`) | No está integrado con insert/delete global ni con operaciones multipista complejas | P0 | L |
| Timeline | Slip / Slide edit | Parcial | `components/editor/TimelineProPanel.tsx` (`slipMode`, `slideMode`) | Solo configuración en proyecto; no hay ejecución en motor de edición | P0 | L |
| Timeline | Multi-selección y acciones en lote | Implementado | `Timeline.tsx` (`SET_SELECTED_CLIP_IDS`, duplicado/borrado múltiple) | Falta caja de selección, agrupación y operación por track targeting | P1 | M |
| Timeline | Tracks lock/mute/visible | Implementado | `Timeline.tsx` (`toggleTrackVisible`, `toggleTrackLocked`, mute track) | Falta solo/mute exclusivo y routing avanzado por pista | P1 | M |
| Timeline | Marcadores de timeline/clip | No iniciado | Sin símbolo de markers en `editorStore`/`types`/`Timeline` | No existe modelo de datos ni UI de markers/chapters | P0 | M |
| Transiciones | Transiciones in/out por clip | Parcial | `PropertiesPanel.tsx` (`applyTransitionPreset`), `editorStore.ts` (`SET_CLIP_TRANSITION_IN/OUT`) | Export MP4 soporta subset y hace fallback para presets no soportados | P0 | M |
| Efectos | Efectos básicos (blur, contrast, etc.) | Parcial | `PropertiesPanel.tsx` (`applyEffectPreset`), `clipPreviewStyle` (filtros), `exportCompositor.ts` (`buildClipEffectsCssFilter`) | No hay stack tipo MLT con keyframes por parámetro ni consistencia preview/export completa | P0 | L |
| Keyframes | Keyframes transform/opacity | Implementado | `PropertiesPanel.tsx` (`addKeyframe`, `updateKeyframeEasing`), `types/index.ts` (`Keyframe`) | No hay editor de curvas avanzado con tangentes/Bezier | P1 | L |
| Keyframes | Graph editor avanzado | Parcial | `KeyframesGraphPanel.tsx` (`applyEasing`) | Solo aplica easing global; no hay curva editable por canal/punto | P0 | L |
| Color | Scopes (waveform/vectorscope/histogram) | Parcial | `ScopesPanel.tsx` (`metrics` sintéticos) | Scopes son simulados, no analizan señal real de frame | P0 | L |
| Audio | Niveles por clip/pista y mezcla simple | Implementado | `PropertiesPanel.tsx` (volume clip), `ffmpeg.ts` (`mergeAudioTrackIntoVideo`) | Mixdown actual concatena segmentos; no timeline-accurate completo con overlaps complejos | P0 | L |
| Audio | Mixer/buses/ducking | Parcial | `AudioProPanel.tsx` (`audioPro.masterDb`, `duckingEnabled`, `buses`) | Configuración no está conectada al render/export real | P0 | L |
| Audio | Audio meters y monitor en tiempo real | No iniciado | Sin medidores reales en UI/editor store | No hay pipeline de análisis RMS/LUFS en preview | P1 | M |
| Proxy/Performance | Proxy clips workflow | Parcial | `MulticamProxyPanel.tsx` (`proxyEnabled`, `proxyScale`) | Estado no conectado a transcodificación/relink automática | P0 | L |
| Multicam | Selección de ángulos multicámara | Parcial | `MulticamProxyPanel.tsx` (`activeAngle`) | No hay sync de cámaras, angle cuts en timeline, ni source monitor multicam | P0 | L |
| Titulación | Títulos/text overlays | Implementado | `AssetLibrary.tsx` (`quickAddTextTemplate`, captions), `PropertiesPanel.tsx` (font/color/text) | Falta compositor de títulos avanzado (plantillas complejas, alineación, estilos ricos) | P1 | M |
| Subtítulos | Subtítulos manuales en timeline | Parcial | `AssetLibrary.tsx` (`quickAddCaptionAtPlayhead`) | Se modelan como clips de texto; no hay pista/subtitle format SRT/VTT nativo | P0 | M |
| Subtítulos | Auto-transcripción y subtitulado automático | No iniciado | `AssetLibrary.tsx` sección `transcribe` solo guía/manual | Falta ASR pipeline y alineación palabra/tiempo | P0 | L |
| Export | Export MP4/WebM/GIF/imagen | Implementado | `Header.tsx` (`handleExport`), `ffmpeg.ts` (`convertToMp4`, `convertToWebM`, `convertToGif`, `exportFrameImage`) | Falta control fino de códecs/perfiles y cola robusta de jobs | P1 | M |
| Export | Composición con overlays (text/image) | Parcial | `exportCompositor.ts` (`renderCompositedWebM`) | Limitado a `MAX_EXPORT_SECONDS = 120`; soporta subconjunto de tracks/escenarios | P0 | L |
| Render | Batch render queue | Parcial | `BatchRenderPanel.tsx` (`renderQueue` en proyecto) | Cola es solo estado/UI; no hay scheduler/worker que procese jobs | P0 | M |
| Proyecto | Persistencia local y snapshots | Implementado | `lib/storage.ts` + uso en `editor/index.tsx`, `Header.tsx` | Falta versionado de proyecto/migraciones y colaboración multiusuario | P1 | M |
| Proyecto | Import/export de proyecto (MLT/XML/EDL/OTIO) | No iniciado | Sin parseadores ni acciones de import/export de proyecto | Incompatibilidad con workflows de intercambio de NLE | P0 | L |
| UX pro | Atajos de teclado núcleo | Implementado | `Timeline.tsx` y `editor/index.tsx` listeners + modal en `Header.tsx` | Falta personalización de keymap y cobertura de comandos pro | P2 | M |
| Conformado | Time remap/speed ramp por keyframes | Parcial | `types/index.ts` (`timeMap`), `PropertiesPanel.tsx` (`addTimeRemapKeyframe`) | Export usa `speed/reverse`; no aplica `timeMap` completo en render final | P0 | L |

## Top 10 gaps priorizados (acciones concretas)

1. **Motor de multicam real**: implementar sincronización de fuentes, monitor multicam y cortes de ángulo en timeline (no solo `activeAngle` en estado).
2. **Proxy end-to-end**: transcodificación proxy, relink original/proxy y política de calidad para preview/export.
3. **Scopes reales**: calcular waveform/vectorscope/histograma desde frames reales (canvas/webgl/worker), reemplazando métricas sintéticas.
4. **Slip/Slide funcional**: conectar `timelinePro.slipMode/slideMode` a operaciones de edición reales con validación de límites.
5. **Render queue ejecutable**: convertir `renderQueue` en jobs asíncronos con estados (`queued/running/success/error`) y reintentos.
6. **Subtítulos nativos**: modelo de subtítulos separado de clips de texto + import/export SRT/VTT.
7. **Auto-transcripción**: pipeline ASR (local/remoto), segmentación por frases y sincronización temporal editable.
8. **Time remap completo**: aplicar `timeMap` en preview y export, no solo `speed/reverse`.
9. **Export compositor robusto**: eliminar límite de 120 s y mejorar performance/memoria para proyectos largos.
10. **Intercambio de proyectos**: soporte import/export MLT/XML/OTIO (o formato puente) para interoperabilidad con editores NLE.

## Plan por fases

### Fase 1 (cerrar P0 de ejecución real)

- Activar `Slip/Slide` y `Batch Render` con ejecución real.
- Implementar `Proxy` operativo (generación + relink).
- Entregar `Scopes` reales y `Time Remap` aplicado en export.

### Fase 2 (paridad funcional de flujo de postproducción)

- Subtítulos nativos (track/subtitle model + SRT/VTT I/O).
- Auto-transcripción editable con alineación temporal.
- Multicam completo (sync + angle switching en timeline).

### Fase 3 (interoperabilidad y hardening)

- Import/export de proyecto interoperable (MLT/XML/OTIO o bridge).
- Optimización de export compositor para proyectos largos.
- QA de regresión: matrix de pruebas por formato, duración y combinaciones de efectos/transiciones.

## Riesgos técnicos y de licencia (GPLv3)

- Kdenlive es GPLv3; **no** copiar código ni enlazar componentes GPL dentro de un código base no GPL-compatible sin definir estrategia legal.
- Mantener implementación limpia: re-desarrollar comportamiento por especificación funcional, no por copia de código.
- Verificar dependencias de codecs/filtros (FFmpeg, presets, plugins) y sus licencias antes de distribuir binarios.
- Si se busca compatibilidad con formatos/proyectos de Kdenlive, usar especificaciones públicas y pruebas de caja negra.
- Documentar claramente límites de “paridad funcional” vs “paridad de implementación” para evitar riesgo de compliance.
