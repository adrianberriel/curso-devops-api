# curso-devops-api

Trabajo Práctico Integrador — Ciclo de Vida y Despliegue Continuo de una API.
Universidad de Palermo, materia DevOps.

API REST desarrollada como caso de estudio para aplicar los principios y herramientas del
movimiento DevOps (Three Ways, Andon Cord, Lean) sobre un ciclo de vida completo: desarrollo,
containerización, CI/CD y observabilidad.

## Stack Tecnológico

- **Runtime / Lenguaje:** Node.js + TypeScript
- **Framework:** [NestJS](https://nestjs.com/)
- **Testing:** [Vitest](https://vitest.dev/) (unitarios y e2e)
- **Linting:** [oxlint](https://oxc.rs/docs/guide/usage/linter.html)

## Estado del Proyecto

| Fase | Descripción                           | Estado                                                                                                                       |
|------|---------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| 1    | Desarrollo Base y Documentación       | 🔶 En progreso — scaffold inicial listo, falta lógica de negocio, Swagger/OpenAPI y suite de tests                           |
| 2    | Gestión de Cambios y Versionado       | 🔶 En progreso — Conventional Commits, branching y estrategia de versionado (SemVer) definidos, falta automatizar el tagging |
| 3    | Empaquetado y Entorno (Docker)        | ⬜ Pendiente                                                                                                                 |
| 4    | Automatización CI/CD (GitHub Actions) | ⬜ Pendiente                                                                                                                 |
| 5    | Observabilidad y Monitoreo            | ⬜ Pendiente                                                                                                                 |

## Cómo correr el proyecto localmente

```bash
npm install
npm run start:dev
```

### Tests

```bash
npm run test       # unitarios
npm run test:e2e   # end-to-end
```

## Convenciones de Desarrollo

### Nombres de Ramas

Formato: `<tipo>/<descripcion-corta-en-kebab-case>`, usando el mismo `<tipo>` que
Conventional Commits:

| Prefijo     | Uso                                                   |
|-------------|-------------------------------------------------------|
| `feat/`     | Nueva funcionalidad                                   |
| `fix/`      | Corrección de un bug                                  |
| `docs/`     | Cambios de documentación                              |
| `chore/`    | Tareas de mantenimiento (deps, config, scaffolding)   |
| `refactor/` | Cambio de código que no agrega feature ni corrige bug |
| `test/`     | Agregar o corregir tests                              |
| `ci/`       | Cambios en el pipeline de CI/CD                       |

Ejemplos: `feat/users-endpoint`, `fix/typo-readme`, `docs/add-readme`.

Toda rama nace de `main` y se integra a `main` exclusivamente vía Pull Request (ver
[Estrategia de Integración](#estrategia-de-integración-branching)). Una vez mergeado el PR,
la rama se elimina.

### Conventional Commits

Todo commit sigue el formato:

```
<tipo>(<scope opcional>): <descripción en imperativo, minúscula, sin punto final>
```

Tipos válidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.

Ejemplos:

```
feat(users): agregar endpoint de creación de usuario
fix(auth): corregir validación de token expirado
docs: agregar README con informe técnico
```

Un cambio incompatible hacia atrás se marca agregando `!` después del tipo/scope (ej.
`feat!: cambiar formato de respuesta de la API`) o con un footer `BREAKING CHANGE:`.

---

## Informe Técnico

### 1. Arquitectura del Pipeline

_Pendiente — se completa en la Fase 4 (CI/CD) con el diagrama de flujo desde el `git push`
hasta la publicación del artefacto, y la lista de herramientas integradas (linter, CI runner,
registro de imágenes, plataforma de hosting)._

### 2. Justificación Técnica y Decisiones de Diseño

#### Estrategia de Integración (Branching)

Se adoptó **GitHub Flow**: ramas de feature de vida corta creadas desde `main`, integradas
exclusivamente vía Pull Request, con `main` protegida (push directo deshabilitado, PR
obligatorio antes de mergear).

Se descartaron las otras dos estrategias vistas en el curso:

- **Trunk-Based Development** está orientado a equipos maduros con varios desarrolladores
  integrando cambios múltiples veces al día sobre una única rama, apoyándose en _feature
  flags_ para no exponer código incompleto. Al ser un desarrollo individual, el problema
  central que resuelve (evitar divergencia entre desarrolladores) no aplica, y la
  complejidad adicional no aporta valor real en este contexto.
- **Git Flow** está pensado para ciclos de release formales con múltiples versiones en
  soporte simultáneo (`develop`, `release/*`, `hotfix/*`), lo cual excede la complejidad
  necesaria para este proyecto.

Según la comparación del material del curso, GitHub Flow es la estrategia de baja
complejidad recomendada para equipos pequeños — el caso de este TP.

#### Optimización de Contenedores (Dockerfile)

Build **multi-stage**: un stage `builder` con las dependencias completas (incluyendo
devDependencies) que compila el proyecto (`npm run build`), y un stage `runner` liviano
que solo recibe el resultado (`dist/`) y las dependencias de producción (`npm prune --omit=dev`). El código fuente,
TypeScript y las herramientas de build nunca
llegan a la imagen final.

- **Imagen base:** `node:24.20-alpine3.24` en ambos stages — Node 24 es la versión LTS
  activa actual, pineada a un patch y una versión de Alpine específicos (no tags
  flotantes como `24-alpine` ni `latest`) para builds reproducibles.
- **Usuario non-root:** se reutiliza el usuario `node` que ya trae la imagen oficial de
  Node (en vez de correr como root o crear un usuario nuevo a mano) — recomendación
  explícita de
  la [guía oficial de Node en Docker](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md).
- **Orden de capas para cache:** se copian primero `package.json` / `package-lock.json`
  y se corre `npm ci` antes de copiar el código fuente. Como las dependencias cambian
  mucho menos seguido que el código, esa capa se reutiliza en la mayoría de los builds.
- **Manejo de señales:** Node.js no fue diseñado para correr como proceso PID 1 (no
  reacciona correctamente a `SIGTERM`/`SIGINT`), según la misma guía oficial. En vez de
  agregar un binario extra (`tini`/`dumb-init`) a la imagen, se usa `init: true` en el
  `docker-compose.yml`, que le pide a Docker que envuelva el proceso con su init liviano
  incorporado.

#### Orquestación Local

`docker-compose.yml` con un único servicio (`api`) que construye la imagen desde el
Dockerfile y expone el puerto 3000. Permite levantar el entorno completo con
`docker compose up --build`.

#### Estrategia de Versionado

Se adoptó **Semantic Versioning (SemVer)** (`MAJOR.MINOR.PATCH`, ej. `v1.0.0`).

Al usar Conventional Commits, el tipo de cada commit determina automáticamente el
incremento de versión (`feat` → minor, `fix` → patch, `BREAKING CHANGE` → major), lo que
permite automatizar el tagging dentro del pipeline en lugar de versionar a mano. Esto
también es coherente con la Fase 4, que exige que la imagen publicada en Docker Hub quede
etiquetada con la versión SemVer generada en la release.

### 3. Aplicación de la Filosofía DevOps

_Pendiente — requiere el pipeline de CI/CD (Fase 4) y la plataforma de monitoreo (Fase 5)
implementados para responder con evidencia real (qué se automatizó, dónde corta el Andon
Cord, y el experimento de falla controlada)._

### 4. Principios Lean (Reducción de Desperdicio)

_Pendiente — se completa junto con el análisis final, una vez implementado el pipeline._
