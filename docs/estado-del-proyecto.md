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
- [x] **Dashboard propio (sin plantillas)** — armado desde cero y versionado en
  [`docs/grafana/golden-signals-dashboard.json`](grafana/golden-signals-dashboard.json); importado en Grafana Cloud
  → [Dashboard de Golden Signals](../README.md#dashboard-de-golden-signals)
- [x] **Golden Signals: tráfico, latencia, errores** — paneles con datos reales de producción (4xx y 5xx por separado)
- [x] **Captura final del dashboard** (`monitoreo-dashboard.png`): con tráfico activo; referenciada en el README

## Pendientes del informe

- [x] **Tercera Forma — experimento de falla controlada.** PR #25 con una regresión en `remove()`: `Unit tests` y
  `E2E tests` fallaron, `Lint` pasó y el merge quedó bloqueado; cerrado sin mergear.
  → [Tercera Forma](../README.md#tercera-forma-aprendizaje-y-simulación-de-fallos)
- [x] **Principios Lean** — tres desperdicios con evidencia (release `v0.3.0` en 2 m 39 s y el experimento). Conviene
  que
  lo releas y lo ajustes con tus propias palabras: es lo que vas a defender.

## Plan de trabajo (por prioridad)

Orden pensado por peso en la rúbrica (Observabilidad 25 %, CI/CD 30 %, Docker 25 %, Cambios 20 %) y por dependencias:
las capturas van al final porque dependen de que lo demás exista.

1. [x] **Dashboard propio + Golden Signals** (Fase 5): hecho, con captura.
2. [x] **Experimento de falla controlada** (Tercera Forma): hecho, con dos capturas.
3. [x] **Principios Lean** y cierre de la Segunda/Tercera Forma con la evidencia real.
4. [x] **Capturas:** todas listas (ver tabla).
5. [ ] **Cierre:** PR de la evidencia del experimento y limpieza de ramas (ver Housekeeping). Después, las decisiones
   pendientes (alerta sobre 5xx es la que más aporta) y el repaso para la defensa.

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
- [x] **Imagen configurada en Render.** Cambiada de `v0.1.0` a `v0.3.0` el 2026-10-21 (Update Source, sin deploy
  nuevo). Consecuencia: cada release futura deja la configuración un tag atrás hasta que se actualice a mano; el
  despliegue correcto sigue saliendo del pipeline. Las capturas de Render ya reflejan el cambio.
- [ ] **Renombrar el workspace de Render** ("My Workspace" es el nombre por defecto). Cosmético; solo importa si
  aparece en una captura del informe.

## Antes de la demo y la defensa

- [ ] **Despertar Render unos minutos antes.** El plan Free duerme el servicio; el primer request tardó ~42 s.
- [ ] **Generar tráfico sobre la API** para que el dashboard tenga datos recientes (incluyendo algunos 404 y 400).
- [ ] **Saber explicar que el deploy hook no actualiza la imagen configurada en Render.** Pasa `imgURL` solo para ese
  deploy; por eso la cabecera mostraba `v0.1.0` hasta que se cambió a mano. Tras la próxima release volverá a quedar un
  tag atrás. La fuente de verdad es la lista de deploys, donde el activo es `v0.3.0` (`e02efcb`, mismo digest que
  Docker Hub).
- [ ] **Repasar las consultas PromQL del dashboard**, sobre todo `histogram_quantile`, `rate()` con ventana de 5 min y
  `or vector(0)`. Saber decir por qué p50 y p95 dan 2.5 y 4.75 ms (casi todo cae en el primer bucket, ≤ 5 ms).
- [ ] **Saber contar el experimento de falla controlada:** qué se rompió (`remove()`), qué job lo detectó (unit y e2e,
  no lint), que el merge quedó bloqueado y que nunca llegó a producción. Y saber admitir qué no se probó: ver 5xx
  reales en el dashboard.
- [ ] **Saber explicar los 3 commits que no siguen Conventional Commits** (ver README, "Excepciones conocidas").
- [ ] **No citar el tamaño de una imagen construida en local.** Pesa ~449 MB descomprimida y es `arm64`; las publicadas
  son `linux/amd64` y pesan ~80 MB comprimidas.

## Housekeeping

- [ ] Actualizar `main` local (está atrás de `origin/main`) y borrar las ramas ya mergeadas, locales y remotas (hay unas
  20, incluida `docs/update-readme-status`). No hay PRs ni issues abiertos.
- [x] PR #21 (excepciones de Conventional Commits y plan de trabajo) mergeado. Falta borrar su rama
  `docs/note-commit-convention-exceptions`.
- [x] PR #25 (experimento de falla controlada) cerrado sin mergear y su rama borrada, local y remota.

## Imágenes pendientes

Van en `docs/images/`; los nombres deben coincidir con las referencias del informe.

| Archivo                     | Estado   | Qué debe mostrar                                                                                                      |
|-----------------------------|----------|-----------------------------------------------------------------------------------------------------------------------|
| `pipeline-release.png`      | ✅ lista | Corrida `Release` de `v0.3.0` completa en verde (ci, docker, deploy); referenciada en el README                       |
| `dockerhub-tags.png`        | ✅ lista | Tags `v0.1.0`, `v0.2.0` y `v0.3.0`, sin `latest`; referenciada en el README                                           |
| `pr-checks.png`             | ✅ lista | PR #21 con los checks de CI (Lint, Unit tests y E2E tests) en verde; referenciada en el README                        |
| `branch-protection.png`     | ✅ lista | Protección de `main` con PR y los tres status checks; referenciada en el README                                       |
| `dockerhub-tag-detalle.png` | ✅ lista | Detalle de `v0.3.0`: linux/amd64, 79.61 MB, capas con `USER node`; referenciada en el README                          |
| `render-servicio.png`       | ✅ lista | Deploy `v0.3.0` (`e02efcb`) en `Live` vía Deploy Hook, con `v0.3.0` también en la cabecera; referenciada en el README |
| `render-deploy-hook.png`    | ✅ lista | Eventos de Render con los deploys por hook y cabecera en `v0.3.0`; referenciada en el README                          |
| `monitoreo-dashboard.png`   | ✅ lista | Dashboard con tráfico activo, 4 indicadores y 3 gráficos; referenciada en el README                                   |
| `falla-controlada-1.png`    | ✅ lista | PR #25: `Unit tests` y `E2E tests` en rojo, `Lint` en verde y merge bloqueado; referenciada en el README              |
| `falla-controlada-2.png`    | ✅ lista | Log del job `Unit tests` con los dos tests fallidos y el error de aserción; referenciada en el README                 |
