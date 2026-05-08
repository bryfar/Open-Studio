# Release Checklist (manual, sin auto-commit ni auto-tag)

## 1. Preparación del árbol de trabajo

- [ ] Confirmar rama y estado:
  - `git branch --show-current`
  - `git status --short`
- [ ] Limpiar artefactos locales no versionables (ejemplo: `apps/desktop/dist`, `node_modules`, `.next`, `test-results`).
- [ ] Confirmar que `apps/openstudio-shorts-service/.env.example` está vigente para configuración inicial.

## 2. Validaciones técnicas mínimas

- [ ] Dependencias instaladas:
  - `npm install`
- [ ] Lint web:
  - `npm run lint`
- [ ] Build web:
  - `npm run build`
- [ ] Smoke backend shorts (manual, corta):
  - `npm run dev:api`
  - Verificar `GET http://localhost:8000/health`
- [ ] Si habrá release desktop:
  - `npm run build:desktop`
  - Windows: `npm run desktop:dist:windows`
  - macOS: `npm run desktop:dist:macos`
  - Linux: `npm run desktop:dist:linux`
  - opcional automático según OS actual: `npm run desktop:dist`

## 3. Checklist funcional previo a publicación

- [ ] Rutas web mínimas responden: `/`, `/dashboard`, `/editor`, `/clip-generator`, `/ai-shorts`.
- [ ] Flujo OpenShorts básico:
  - analyze -> generate en clip generator o ai-shorts.
- [ ] Worker de jobs operativo cuando se validen colas:
  - `npm run dev:worker`

## 4. Despliegue manual

- [ ] Definir versión de release (ejemplo `v0.1.0`).
- [ ] Asegurar changelog final actualizado (`docs/CHANGELOG_RELEASE_FREEZE_2026-05-08.md`).
- [ ] Crear commit final manual (solo si el usuario decide hacerlo).
- [ ] Crear tag manual.
- [ ] Crear release en GitHub con notas.

## 5. Rollback básico

- [ ] Si falla despliegue web, re-publicar último build estable.
- [ ] Si falla release desktop, despublicar asset inválido del release y subir build corregido.
- [ ] Si falla backend shorts, rollback a última imagen/commit estable y validar `/health`.

---

## Comandos exactos para tag/release manual (copiar/pegar)

> Ejecutar solo cuando el working tree esté limpio y validado.

```bash
# 1) Verificar estado y rama
git branch --show-current
git status

# 2) (Opcional) actualizar rama local
git pull --ff-only origin master

# 3) Crear commit final manual (si aplica)
git add -A
git commit -m "chore(release): freeze release v0.1.0"

# 4) Crear tag anotado
git tag -a v0.1.0 -m "OpenStudio v0.1.0"

# 5) Publicar commit y tag
git push origin master
git push origin v0.1.0

# 6) Crear release con GitHub CLI (opcional)
gh release create v0.1.0 --title "OpenStudio v0.1.0" --notes-file docs/CHANGELOG_RELEASE_FREEZE_2026-05-08.md
```

## Variante sin GitHub CLI (UI de GitHub)

1. Ir a **GitHub -> Releases -> Draft a new release**.
2. Seleccionar tag `v0.1.0`.
3. Título sugerido: `OpenStudio v0.1.0`.
4. Copiar contenido del changelog en las notas.
5. Publicar release.
