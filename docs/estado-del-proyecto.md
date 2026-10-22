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

## Gaps detectados en las clases

Detectados cruzando **slides y transcripción** de cada clase contra la consigna y el informe. La rúbrica no siempre
dice lo que el profesor enfatiza en clase; esto es lo que podría preguntar en la defensa. Material en `docs/clases/`
(excluido de git: la transcripción tiene nombres de compañeros y el PDF es del profesor).

### Clase 09-10-2026 — Monitoring & Observability

Fuente entre paréntesis: **S** = slides, **T** = transcripción. Los datos que vienen solo de la transcripción pueden
tener errores de reconocimiento de voz.

| Gap                                                                                            | Fuente       | Costo              | Estado                                                                                                                                                                                                                                                                |
|------------------------------------------------------------------------------------------------|--------------|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Latencia mezclaba respuestas fallidas (404/400 bajan el percentil)                             | S (24)       | Bajo               | ✅ Dashboard filtra a 2xx                                                                                                                                                                                                                                             |
| Sin p99 (SLO típico p99 < 500 ms)                                                              | S (25), T    | Bajo               | ✅ Agregado al dashboard                                                                                                                                                                                                                                              |
| Sin SLI / SLO / SLA / error budget                                                             | S (6-8), T   | Bajo               | ✅ Sección en el README                                                                                                                                                                                                                                               |
| Alerta sin criterio de SLO ni runbook (urgente + accionable + impacto)                         | S (41-44), T | Medio              | 🟡 Diseñada y runbook escrito; **falta crearla en Grafana**                                                                                                                                                                                                           |
| Sin saturación (4ª señal dorada)                                                               | S (28), T    | Bajo (sin release) | ✅ Paneles de event loop y heap de V8 agregados. *Corrección:* antes lo clasifiqué como "alto, necesita release" y dije que no había métricas de runtime; era falso, producción sí las exporta (`nodejs_eventloop_*`, `v8js_*`). Sigue sin haber CPU ni % de memoria. |
| Métricas sin etiqueta de versión                                                               | S (39), T    | Alto (release)     | 📝 Limitación documentada                                                                                                                                                                                                                                             |
| Logs sin `request_id` / `trace_id`                                                             | S (47), T    | Alto (release)     | 📝 Limitación documentada                                                                                                                                                                                                                                             |
| Entrega: PDF del informe + ZIP del código + link del repo en Blackboard; semana del 22/10      | **Solo T**   | —                  | ⚠️ **Confirmar fecha y formato en Blackboard**                                                                                                                                                                                                                        |
| `release.yml`: ¿nombre de la imagen fijo en el workflow? (el profesor pidió variables/secrets) | **Solo T**   | Bajo               | ❓ Por revisar                                                                                                                                                                                                                                                        |

Observaciones para la defensa:

- **Discrepancia en el slide 44.** Dice que un burn rate de 14x agota el presupuesto del mes "en ~2 horas". Según mi
  cuenta, a 14x el presupuesto de 30 días dura 30 días / 14 ≈ 51 horas (lo que sí consume 14x en 1 hora es ~2 % del
  presupuesto mensual). En el README usé 51 horas. Si el profesor cita las 2 horas, no discutirlo: mencionar que el
  umbral de 14x es el del libro SRE y que el cálculo exacto depende de la ventana.
- **Ya estaba bien alineado:** OpenTelemetry agnóstico con el exporter por variables de entorno, errores con contadores
  y `rate()` (no con `grep` sobre logs), 4xx y 5xx separados, rutas normalizadas (baja cardinalidad), logs JSON con
  niveles coherentes.
- El profesor dijo que el versionado automático (p. ej. `semantic-release`) es **opcional** y que se vea al final: la
  decisión de dejar el tag manual se sostiene.

### Clases pendientes de analizar

- [ ] **02-10-2026** (la transcripción está en la Papelera de iCloud: `02-10-2026_zoom-transcript.txt`; faltan slides).
- [ ] Clases anteriores, hacia atrás.

## Decisiones tuyas pendientes

Cada una trae una recomendación; ninguna bloquea el plan de arriba.

- [ ] **Crear la alerta de 5xx en Grafana.** Diseño y runbook ya están en el repo (README, "Alerta sobre errores de
  servidor", y `docs/runbooks/alta-tasa-de-5xx.md`). Falta crearla: o a mano en Alerting → Alert rules (condición =
  consulta del README, `for: 5m`, "sin datos = normal", `severity=critical`, anotación `runbook_url`, contacto por
  correo), o dándome un token de Grafana con permiso de escritura (el actual es de solo lectura). **Tú decides el
  punto de contacto** (¿tu correo?). Cuando exista, saco captura de la regla y actualizo el README.
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
- [ ] **Repasar las consultas PromQL del dashboard**, sobre todo `histogram_quantile`, `rate()` con ventana de 5 min,
  `or vector(0)` y el filtro `status=~"2.."` de la latencia. Saber decir por qué p50 y p95 dan 2.5 y 4.75 ms (casi todo
  cae en el primer bucket, ≤ 5 ms) y que el p99 real está entre 5 y 10 ms.
- [ ] **Saber explicar SLI, SLO, SLA y error budget con los números del README** (99.9 % de disponibilidad, p99 < 500
  ms,
  ~43 min de presupuesto al mes, sin SLA) y por qué el presupuesto con tan poco tráfico es casi cero.
- [ ] **Saber explicar la alerta de burn rate** (14x, 1.4 %, `for: 5m`, sin datos = normal) y los tres criterios:
  urgente,
  accionable, con impacto en el usuario.
- [ ] **Saber contar el experimento de falla controlada:** qué se rompió (`remove()`), qué job lo detectó (unit y e2e,
  no lint), que el merge quedó bloqueado y que nunca llegó a producción. Y saber admitir qué no se probó: ver 5xx
  reales en el dashboard.
- [ ] **Saber explicar los 3 commits que no siguen Conventional Commits** (ver README, "Excepciones conocidas").
- [ ] **No citar el tamaño de una imagen construida en local.** Pesa ~449 MB descomprimida y es `arm64`; las publicadas
  son `linux/amd64` y pesan ~80 MB comprimidas.

## Housekeeping

- [ ] **Reimportar el JSON del dashboard en Grafana** (latencia a 2xx, p99 y dos paneles de saturación) y **repetir
  `monitoreo-dashboard.png`**: la captura actual es de la primera versión y el README lo aclara en su pie de foto; al
  reemplazarla, quitar esa aclaración.
- [ ] **Último PR (al terminar el análisis de clases):** sacar este archivo del repo (`git rm --cached`), quitar del
  README la frase que lo enlaza (línea 21) y agregarlo a `.git/info/exclude`. Antes, hacer una **copia de respaldo fuera
  del repo** (iCloud). Ojo: las 6+ versiones anteriores quedan en el historial público; no se reescribe.
- [x] `docs/clases/` excluido de git (`.git/info/exclude`).
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
