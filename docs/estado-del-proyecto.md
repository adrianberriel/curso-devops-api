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

- [x] Conventional Commits en todo el historial, salvo 3 commits iniciales (`9b8bc41` con typo `chroe` y dos
  `Revert`) → [Excepciones conocidas](../README.md#gestión-de-cambios-commits-ramas-y-prs)
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
- [ ] **Golden Signals: tráfico, latencia, errores** — la métrica base ya se emite (`http.server.request.duration`,
  histograma con `http.route` y `http.response.status_code`); falta construir los
  paneles

## Pendientes del informe

- [ ] **Tercera Forma — experimento de falla controlada.** Romper algo intencionalmente (test fallido en un PR,
  variable de entorno faltante) y documentar cómo reaccionó el pipeline o el monitoreo.
- [ ] **Principios Lean** — sección en borrador, falta completar con la evidencia final.

## Plan de trabajo (por prioridad)

Orden pensado por peso en la rúbrica (Observabilidad 25 %, CI/CD 30 %, Docker 25 %, Cambios 20 %) y por dependencias:
las capturas van al final porque dependen de que lo demás exista.

1. [ ] **Dashboard propio + Golden Signals** (Fase 5). Es lo único obligatorio que falta construir. En Grafana Cloud
   hoy no hay ningún dashboard propio, solo los de la plataforma.
2. [ ] **Experimento de falla controlada** (Tercera Forma). Genera además la evidencia `falla-controlada-1.png`.
3. [ ] **Principios Lean** y cierre de la Segunda/Tercera Forma con la evidencia real.
4. [ ] **Capturas** de la tabla de abajo.
5. [ ] **Cierre:** commitear y abrir PR de esta documentación, y limpieza de ramas (ver Housekeeping).

## Decisiones tuyas pendientes

Cada una trae una recomendación; ninguna bloquea el plan de arriba.

- [ ] **Alerta sobre 5xx o latencia alta.** La consigna pregunta qué herramienta lo detecta y mediante qué señal. Hoy
  hay métrica pero no hay alerta. *Recomendación:* una regla simple de Grafana sobre 5xx, una vez construido el
  dashboard; refuerza la Segunda Forma y sirve para el experimento de falla.
- [ ] **Centralizar logs en Grafana (Loki) o dejarlos en stdout.** *Recomendación:* dejarlos en stdout, ya cumple la
  consigna y evita complejidad.
- [ ] **Automatizar la creación del tag SemVer.** Hoy es manual (`git tag` + `git push`) y el README lo reconoce.
  *Recomendación:* dejarlo manual y declararlo como limitación; la consigna no exige automatizarlo.
- [ ] **Actualizar dependencias antes de entregar.** Hay versiones menores nuevas (NestJS 12.0.1 → 12.2.0, oxlint,
  vitest, prettier). *Recomendación:* no tocarlas ahora; cada cambio exige una release nueva y revalidar el pipeline.
- [ ] **Renombrar el workspace de Render** ("My Workspace" es el nombre por defecto). Cosmético; solo importa si
  aparece en una captura del informe.

## Antes de la demo y la defensa

- [ ] **Despertar Render unos minutos antes.** El plan Free duerme el servicio; el primer request tardó ~42 s.
- [ ] **Generar tráfico sobre la API** para que el dashboard tenga datos recientes (incluyendo algunos 404 y 400).
- [ ] **Saber explicar el `imagePath` de Render.** En Settings el servicio muestra `v0.1.0`, pero cada deploy por hook
  sobreescribe la imagen con el tag exacto de la release. La fuente de verdad es la lista de deploys (Events), donde
  el activo es `v0.3.0`.
- [ ] **Saber explicar los 3 commits que no siguen Conventional Commits** (ver README, "Excepciones conocidas").
- [ ] **No citar el tamaño de una imagen construida en local.** Pesa ~449 MB descomprimida y es `arm64`; las publicadas
  son `linux/amd64` y pesan ~80 MB comprimidas.

## Housekeeping

- [ ] Actualizar `main` local (está atrás de `origin/main`) y borrar las ramas ya mergeadas, locales y remotas (hay unas
  20, incluida `docs/update-readme-status`). No hay PRs ni issues abiertos.
- [ ] Rama `docs/note-commit-convention-exceptions` con cambios sin commitear (README y este archivo): falta
  commitear con `docs: ...` y abrir el PR.

## Imágenes pendientes

Van en `docs/images/`; los nombres deben coincidir con las referencias del informe.

| Archivo                     | Estado            | Qué debe mostrar                                                                                                                                  |
|-----------------------------|-------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| `pipeline-release.png`      | ⚠️ desactualizada | Muestra la corrida fallida de `v0.1.0` (Deploy to Render en rojo). Reemplazar por una corrida `Release` completa en verde (ideal: la de `v0.3.0`) |
| `dockerhub-tags.png`        | ⚠️ desactualizada | Solo muestra `v0.1.0`. Reemplazar por una que incluya `v0.2.0` y `v0.3.0`                                                                         |
| `pr-checks.png`             | ❌ falta          | Pull Request con los checks de CI (Lint, Unit tests y E2E tests) en verde                                                                         |
| `branch-protection.png`     | ❌ falta          | Settings > Branches: protección de `main` con los status checks requeridos                                                                        |
| `dockerhub-tag-detalle.png` | ❌ falta          | Detalle de `v0.3.0` (linux/amd64, tamaño)                                                                                                         |
| `render-servicio.png`       | ❌ falta          | Servicio en Render corriendo la imagen `v0.3.0`                                                                                                   |
| `render-deploy-hook.png`    | ❌ falta          | Deploy disparado por el hook (eventos / log)                                                                                                      |
| `monitoreo-dashboard.png`   | ❌ falta          | Dashboard propio con las Golden Signals                                                                                                           |
| `falla-controlada-1.png`    | ❌ falta          | Evidencia del experimento de falla controlada                                                                                                     |
