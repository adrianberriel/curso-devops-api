# Estado del Proyecto

Checklist de seguimiento contra las fases de la consigna. **No es el entregable** — el informe técnico es el
[README](../README.md); acá solo se traza qué está hecho, qué falta y dónde está la evidencia de cada punto.

## Fase 1 — Desarrollo Base y Documentación

- [x] API REST con lógica de negocio básica — CRUD de `Products` con DTOs y `ValidationPipe` global
- [x] Pruebas unitarias — 34 tests, 100 % de statements y funciones sobre los archivos con lógica
  → [Estrategia de Pruebas](../README.md#estrategia-de-pruebas)
- [x] Pruebas end-to-end — 16 tests sobre el CRUD real; corren en CI como job propio
- [x] Documentación interactiva (Swagger/OpenAPI) — expuesta en `/api` y `/api-json`

## Fase 2 — Gestión de Cambios y Versionado

- [x] Conventional Commits en todo el historial
- [x] Branching vía GitHub Flow + protección de `main` + PRs documentados con template
  → [Gestión de Cambios](../README.md#gestión-de-cambios-commits-ramas-y-prs)
- [x] Estrategia de versionado definida (SemVer) → [Estrategia de Versionado](../README.md#estrategia-de-versionado)
- [x] Releases publicadas: `v0.1.0`, `v0.2.0`, `v0.3.0`

## Fase 3 — Empaquetado y Entorno (Docker)

- [x] Dockerfile multi-stage, imagen base pineada (`node:24.20-alpine3.24`), usuario non-root, capas ordenadas
  para cache → [Optimización de Contenedores](../README.md#optimización-de-contenedores-dockerfile)
- [x] `docker-compose.yaml` funcional → [Orquestación Local](../README.md#orquestación-local)
- [x] `.dockerignore`
- [x] Build verificado sin errores (`docker build`, `docker run` y `docker compose` probados)

## Fase 4 — Automatización CI/CD (GitHub Actions)

- [x] Workflow de CI en Pull Requests (lint + unit + e2e) → [Workflows](../README.md#workflows)
- [x] Andon Cord: "Require status checks to pass" activo para los tres jobs; un PR en rojo no se puede mergear
  → [Estrategia de Integración](../README.md#estrategia-de-integración-branching)
- [x] Build y publicación automática a Docker Hub, etiquetada con el tag SemVer; no se publica `latest`
- [x] Deploy Hook a Render con el tag exacto de la imagen
  → [Arquitectura del Pipeline](../README.md#1-arquitectura-del-pipeline)

## Fase 5 — Observabilidad y Monitoreo

- [x] Logs estructurados en JSON (`timestamp`, `level`, `path`, `status_code`), confirmados en producción
  → [Logs Estructurados](../README.md#logs-estructurados)
- [x] Conexión a plataforma de monitoreo — Grafana Cloud vía OpenTelemetry, verificado en local y en producción
  → [Observabilidad](../README.md#observabilidad-opentelemetry--grafana-cloud)
- [ ] **Dashboard propio (sin plantillas)** — las vistas de Application Observability vienen prearmadas; sirven para
  confirmar que llegan datos, pero el dashboard entregable hay que construirlo desde cero
- [ ] **Golden Signals: tráfico, latencia, errores** — la métrica base ya se emite
  (`http.server.request.duration`, histograma con `http.route` y `http.response.status_code`); falta construir los
  paneles

## Pendientes del informe

- [ ] **Tercera Forma — experimento de falla controlada.** Romper algo intencionalmente (test fallido en un PR,
  variable de entorno faltante) y documentar cómo reaccionó el pipeline o el monitoreo.
- [ ] **Principios Lean** — sección en borrador, falta completar con la evidencia final.

## Imágenes pendientes

Van en `docs/images/`; los nombres deben coincidir con las referencias del informe.

| Archivo | Estado | Qué debe mostrar |
|---|---|---|
| `pipeline-release.png` | ⚠️ desactualizada | Muestra la corrida fallida de `v0.1.0` (Deploy to Render en rojo). Reemplazar por una corrida `Release` completa en verde (ideal: la de `v0.3.0`) |
| `dockerhub-tags.png` | ⚠️ desactualizada | Solo muestra `v0.1.0`. Reemplazar por una que incluya `v0.2.0` y `v0.3.0` |
| `pr-checks.png` | ❌ falta | Pull Request con los checks de CI (Lint, Unit tests y E2E tests) en verde |
| `branch-protection.png` | ❌ falta | Settings > Branches: protección de `main` con los status checks requeridos |
| `dockerhub-tag-detalle.png` | ❌ falta | Detalle de `v0.3.0` (linux/amd64, tamaño) |
| `render-servicio.png` | ❌ falta | Servicio en Render corriendo la imagen `v0.3.0` |
| `render-deploy-hook.png` | ❌ falta | Deploy disparado por el hook (eventos / log) |
| `monitoreo-dashboard.png` | ❌ falta | Dashboard propio con las Golden Signals |
| `falla-controlada-1.png` | ❌ falta | Evidencia del experimento de falla controlada |
