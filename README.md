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

La API está desplegada en [`curso-devops-api.onrender.com`](https://curso-devops-api.onrender.com) — documentación
interactiva en [`/api`](https://curso-devops-api.onrender.com/api).

El seguimiento del avance contra las fases de la consigna vive en
[`docs/estado-del-proyecto.md`](docs/estado-del-proyecto.md). Este README es el **informe técnico** del trabajo.

## Cómo correr el proyecto localmente

```bash
npm install
npm run start:dev
```

La documentación interactiva (Swagger UI) queda disponible en `http://localhost:3000/api`, y el spec OpenAPI en
formato JSON en `http://localhost:3000/api-json`.

Los logs salen en JSON de una línea (ver [Logs Estructurados](#logs-estructurados)). Para leerlos más cómodo en
desarrollo, `npm run start:dev:pretty` los pasa por `jq`, que los indenta y colorea; si `jq` no está instalado el
script avisa cómo instalarlo y no arranca.

### Con Docker y telemetría hacia Grafana Cloud

La instrumentación de OpenTelemetry se configura en el Dockerfile, así que se activa al correr en contenedor (ver
[Observabilidad](#observabilidad-opentelemetry--grafana-cloud)). Para que los datos lleguen a Grafana Cloud hay que
cargar las credenciales:

```bash
cp .env.example .env   # completar con los valores del asistente de Grafana Cloud
docker compose up --build
```

`.env` está en `.gitignore` y en `.dockerignore`: el token no se commitea ni queda dentro de la imagen. Si no se crea
el archivo, la aplicación arranca igual (el `env_file` está declarado como `required: false`) y solo falla el envío de
telemetría.

### Tests

```bash
npm run test       # unitarios
npm run test:e2e   # end-to-end
npm run test:cov   # unitarios + reporte de cobertura
```

Los unitarios y los e2e corren en CI como jobs separados en cada Pull Request; la cobertura se consulta localmente.

---

## Informe Técnico

### 1. Arquitectura del Pipeline

#### Diagrama de flujo

```mermaid
flowchart LR
    A["git push a rama de feature"] --> B["Pull Request a main"]
    B --> C{"ci.yml: Lint + Unit tests + E2E tests"}
    C -- " falla " --> X["PR no se integra (Andon Cord)"]
    C -- " pasa " --> D["Merge a main"]
    D --> E["git tag vX.Y.Z + push del tag"]
    E --> F["release.yml"]
    F --> G{"Job ci: reutiliza ci.yml"}
    G -- " falla " --> Y["No se construye ni se publica imagen"]
    G -- " pasa " --> H["Job docker: build y push a Docker Hub con tag vX.Y.Z"]
    H --> I["Job deploy: deploy hook de Render con imgURL del tag exacto"]
    I --> J["Render descarga la imagen y despliega"]
```

_La etapa de Render se verificó de punta a punta: el deploy hook de la release `v0.3.0` (la actual) disparó el deploy
y el servicio quedó corriendo esa imagen en producción, exportando telemetría real a Grafana Cloud._

![Corrida del workflow Release: jobs ci, docker y deploy](docs/images/pipeline-release.png)

_Corrida de la release `v0.3.0`: los tres jobs de `ci.yml` (`Lint`, `Unit tests`, `E2E tests`) alimentan al build y push
de la imagen, que a su vez habilita el deploy a Render. El resumen muestra los 34 tests unitarios y los 16 e2e en verde
y el tag con el que se publicó la imagen (`v0.3.0`)._

![Servicio en Render con el deploy v0.3.0 activo](docs/images/render-servicio.png)

_Servicio `curso-devops-api` en Render: el deploy `e02efcb` (`v0.3.0`) figura como `Live` con trigger `Deploy Hook`. Su
digest coincide con el manifest `sha256:e02efcb5...` de Docker Hub, es decir que corre exactamente la imagen publicada._

![Eventos de Render: deploy lanzado por el deploy hook](docs/images/render-deploy-hook.png)

_Historial de eventos: cada release aparece como `Triggered via Deploy Hook`. La excepción es el deploy de `v0.1.0` del
28 de septiembre, `Triggered by you via API`, que fue un redeploy manual durante el diagnóstico descrito en
[Observabilidad](#observabilidad-opentelemetry--grafana-cloud)._

![Pull Request con los tres checks de CI requeridos en verde](docs/images/pr-checks.png)

_PR #21: `Lint`, `Unit tests` y `E2E tests` aparecen como `Required` y en verde antes de habilitar el merge._

#### Componentes

| Componente            | Herramienta                                                 |
|-----------------------|-------------------------------------------------------------|
| Control de versiones  | GitHub (GitHub Flow, `main` protegida, Pull Requests)       |
| Linter                | oxlint (`npm run lint`)                                     |
| Tests                 | Vitest (`npm test`)                                         |
| Runner de CI          | GitHub Actions (`ubuntu-latest`)                            |
| Registro de imágenes  | Docker Hub — repo público `adrianberriel/curso-devops-api`  |
| Plataforma de hosting | Render, plan Free — imagen `v0.3.0` corriendo en producción |
| Instrumentación       | OpenTelemetry (zero-code, export OTLP directo, sin agente)  |
| Monitoreo             | Grafana Cloud — Application Observability                   |

#### Workflows

- **`ci.yml`:** se ejecuta en Pull Requests hacia `main` y además es reutilizable (`workflow_call`). Tiene tres
  jobs, que corren en paralelo: `Lint`, `Unit tests` y `E2E tests`.
- **`release.yml`:** se dispara al pushear un tag `v*.*.*`. Sus jobs se encadenan con `needs`: `ci` (reutiliza
  `ci.yml`) → `docker` (build y push a Docker Hub) → `deploy` (deploy hook de Render).
- **Credenciales:** secrets del repositorio (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `RENDER_DEPLOY_HOOK_URL`); nunca
  en el código.

**Notas sobre Render.** El servicio tiene `autoDeploy` apagado: los deploys salen únicamente por el deploy hook, que
pasa `imgURL` con el tag exacto de la release. Ese `imgURL` vale solo para ese deploy: **no modifica la imagen
configurada en el servicio**, que durante las primeras releases siguió en `v0.1.0` y se actualizó a mano a `v0.3.0` para
que la cabecera del dashboard y un eventual deploy manual o rollback coincidan con lo que corre. Aun así, el despliegue
correcto sale siempre del pipeline y la fuente de verdad de lo que corre es la lista de deploys, donde el activo es
`v0.3.0` (`e02efcb`). Al ser el plan Free, el servicio se duerme por inactividad y el primer request posterior tarda
unos 40 s (cold start).

### 2. Justificación Técnica y Decisiones de Diseño

#### Gestión de Cambios (Commits, Ramas y PRs)

Las tres convenciones de esta sección no son independientes: el tipo del commit define el prefijo de la rama y, a
través de SemVer, el incremento de versión de la release. Una sola taxonomía atraviesa todo el ciclo.

**Conventional Commits.** Todo commit sigue el formato:

```
<tipo>(<scope opcional>): <descripción en imperativo, minúscula, sin punto final>
```

Tipos válidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`. Ejemplos reales del
historial:

```
feat(products): logica CRUD con almacenamiento en memoria
fix(auth): corregir validación de token expirado
ci: add e2e job to pull request checks
```

**Excepciones conocidas.** Tres commits de los inicios del proyecto no cumplen el formato: `9b8bc41`
(`chroe: init nestjs project`, typo de `chore`) y dos commits `Revert "..."` generados por `git revert`
(`066f1db`, que revierte el anterior, y `e0ad9be`, que revierte un `feat(users)`). Pertenecen a `main`, y reescribir
su historial para corregirlos rompería los hashes ya referenciados por PRs y tags, así que se dejaron como están;
todo commit posterior sigue la convención.

Un cambio incompatible hacia atrás se marca con `!` después del tipo/scope (ej.
`feat!: cambiar formato de respuesta de la API`) o con un footer `BREAKING CHANGE:`. Eso es lo que habilita derivar
el incremento SemVer del historial en lugar de decidirlo a mano (ver
[Estrategia de Versionado](#estrategia-de-versionado)).

**Nombres de ramas.** Formato `<tipo>/<descripcion-corta-en-kebab-case>`, reutilizando los mismos tipos:

| Prefijo     | Uso                                                   |
|-------------|-------------------------------------------------------|
| `feat/`     | Nueva funcionalidad                                   |
| `fix/`      | Corrección de un bug                                  |
| `docs/`     | Cambios de documentación                              |
| `chore/`    | Tareas de mantenimiento (deps, config, scaffolding)   |
| `refactor/` | Cambio de código que no agrega feature ni corrige bug |
| `test/`     | Agregar o corregir tests                              |
| `ci/`       | Cambios en el pipeline de CI/CD                       |

Ejemplos: `feat/users-endpoint`, `ci/github-actions-ci-cd`, `docs/update-readme-status`. Toda rama nace de `main`,
se integra exclusivamente vía Pull Request (ver [Estrategia de Integración](#estrategia-de-integración-branching)) y
se elimina una vez mergeada.

**Documentación de los Pull Requests.** El repositorio define
[`.github/pull_request_template.md`](.github/pull_request_template.md), de modo que cada PR se abre ya con la
estructura a completar en lugar de depender de que el autor se acuerde:

```markdown
## Description

## Test evidence

<!-- Paste the output of `npm run test` / `npm run test:e2e`, or N/A if not applicable -->
```

Son los dos campos que pide la consigna — descripción del cambio y evidencia de pruebas ejecutadas — y la plantilla
los convierte en el estado por defecto del PR. La evidencia se pega a mano en el cuerpo, pero además queda registrada
de forma automática e inmutable en los checks de CI del propio PR (`Lint`, `Unit tests`, `E2E tests`), que corren
sobre el commit exacto que se va a mergear.

#### Estrategia de Integración (Branching)

Se adoptó **GitHub Flow**: ramas de feature de vida corta creadas desde `main`, integradas
exclusivamente vía Pull Request, con `main` protegida (push directo deshabilitado, PR
obligatorio antes de mergear).

Se descartaron las otras dos estrategias vistas en el curso:

- **Trunk-Based Development** está orientado a equipos maduros con varios desarrolladores
  integrando cambios múltiples veces al día sobre una única rama, apoyándose en *feature
  flags* para no exponer código incompleto. Al ser un desarrollo individual, el problema
  central que resuelve (evitar divergencia entre desarrolladores) no aplica, y la
  complejidad adicional no aporta valor real en este contexto.
- **Git Flow** está pensado para ciclos de release formales con múltiples versiones en
  soporte simultáneo (`develop`, `release/*`, `hotfix/*`), lo cual excede la complejidad
  necesaria para este proyecto.

Según la comparación del material del curso, GitHub Flow es la estrategia de baja
complejidad recomendada para equipos pequeños — el caso de este TP.

**Protección de `main`:**

![Regla de protección de la rama main](docs/images/branch-protection.png)

_Settings > Branches: la regla para `main` exige Pull Request y los tres status checks (`Lint`, `Unit tests`,
`E2E tests`, todos de GitHub Actions), y tiene activado "Do not allow bypassing the above settings", por lo que aplica
también al administrador del repositorio._

`main` exige PR (no admite push directo) y tiene "Require status checks to pass" activo para `Lint`, `Unit tests` y
`E2E tests` (verificado con `gh api repos/adrianberriel/curso-devops-api/branches/main/protection`) — un PR con
cualquiera de esos tres checks en rojo no se puede mergear. Sigue sin exigir aprobaciones
(`required_approving_review_count: 0`), pero eso es un control distinto del Andon Cord.

#### Estrategia de Pruebas

Los tests son la condición que corta el flujo en un Pull Request, así que lo que importa no es solo que pasen sino
que el número que reportan sea confiable.

Las pruebas siguen el patrón de `@nestjs/testing`: cada test construye el módulo con `Test.createTestingModule`, lo
que da una instancia nueva por caso y evita estado compartido entre tests. El servicio guarda los productos en
memoria y se prueba directo; en el controlador el servicio va mockeado (`useValue`), porque lo único propio que tiene
es convertir el `id` de la URL de string a número — la lógica del CRUD ya está cubierta en el test del servicio y no
tiene sentido volver a ejercitarla a través suyo.

**El denominador de la cobertura.** Por defecto, Vitest solo mide los archivos que algún test importa: los que no
tienen test quedan fuera de la cuenta y el porcentaje sale inflado. Con esa configuración el proyecto reportaba
100 %, y midiendo todo `src/` el número real era 79 %. Por eso `vitest.config.ts` declara `coverage.include`
explícitamente, y excluye solo lo que no tiene lógica que probar:

| Excluido             | Motivo                                            |
|----------------------|---------------------------------------------------|
| `src/main.ts`        | Bootstrap: levanta el servidor, sin lógica propia |
| `src/**/*.module.ts` | Solo declaran `controllers` y `providers`         |

Con ese denominador la cobertura es de 100 % en statements y funciones. El 90 % en ramas corresponde a una sola rama
sin cubrir, que es el decorador `@Controller()` de `app.controller.ts`: un artefacto de la instrumentación, no un
camino de código real.

**Los e2e tienen que probar la app que se despliega.** Los tests end-to-end no ejecutan `main.ts`: arman la
aplicación con `createNestApplication()`. Como la configuración global vivía dentro de `bootstrap()`, la app de los
tests salía sin el `ValidationPipe` y por lo tanto no validaba nada. Un `POST /products` con un body inválido
devolvía **201 en los tests y 400 en producción**: la suite habría dado luz verde a una regresión en la validación.

La corrección fue extraer esa configuración a `src/app.setup.ts` (`configureApp`), que ahora usan tanto `main.ts`
como los e2e, de modo que no puedan volver a divergir. Se verificó quitando la llamada del setup de los tests: 6 de
los 16 e2e fallan, así que la suite detecta efectivamente esa clase de regresión. Swagger se queda en `main.ts`
porque expone documentación y no altera el manejo de los requests.

Es el mismo problema de paridad entre entornos que motivó el Dockerfile y la decisión sobre los colores del logger,
solo que acá afectaba a la propia red de contención.

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
  `docker-compose.yaml`, que le pide a Docker que envuelva el proceso con su init liviano
  incorporado.

**Evidencia:** las imágenes publicadas son `linux/amd64`. Según Docker Hub, `v0.1.0` pesa 61.32 MB, `v0.2.0` 70.12 MB y
`v0.3.0` (la que corre en producción) 79.61 MB comprimida — el crecimiento viene de las dependencias de OpenTelemetry
agregadas entre releases. (La API de Docker Hub devuelve esos mismos tamaños en bytes decimales, 64.3, 73.5 y 83.5 MB;
la interfaz web divide por 1024² pero conserva la etiqueta "MB". El informe usa los valores de la interfaz.)

![Detalle del tag v0.3.0 en Docker Hub](docs/images/dockerhub-tag-detalle.png)

_Las capas confirman las decisiones del Dockerfile: base `alpine 3.24` con `NODE_VERSION=24.20.0` pineada, `COPY
--chown=node:node` de `dist/` y `node_modules` de producción (el resto del código fuente no llega a la imagen final) y
`USER node` antes del `CMD`._

#### Orquestación Local

`docker-compose.yaml` con un único servicio (`api`) que construye la imagen desde el
Dockerfile y expone el puerto 3000. Permite levantar el entorno completo con
`docker compose up --build`.

#### Logs Estructurados

Los logs se emiten como eventos JSON de una línea, en vez de texto plano legible por humanos: es el formato que
consumen los agregadores de logs (CloudWatch, Grafana Loki, Datadog), donde cada campo queda indexado y se puede
filtrar o graficar — por ejemplo, contar 5xx por minuto para las Golden Signals.

Se usó el `ConsoleLogger` que ya trae NestJS con `json: true`
([documentación oficial](https://docs.nestjs.com/techniques/logger#json-logging)), en lugar de sumar una dependencia
como `pino` o `winston`: el requerimiento se cubre con el logger nativo, y evitar la dependencia extra mantiene la
imagen final más liviana.

- **`src/main.ts`:** el `ConsoleLogger` se configura con `json: true` y `flattenParams: true` (los campos propios
  quedan en la raíz del objeto en vez de anidados bajo `params`, más cómodo de consultar en el agregador).
- **`src/common/middleware/logger.middleware.ts`:** middleware global (patrón `NestMiddleware`, registrado en
  `AppModule` vía `configure()`) que se suscribe al evento `finish` de la response. Se eligió `finish` en lugar de
  loguear en el camino de ida porque es el único punto donde el `status_code` ya es el definitivo: así quedan
  registrados también los 404 y los 400 que resuelven el `ValidationPipe` o los filtros de excepción, sin llegar al
  controller.
- **`level` derivado del `status_code`:** 5xx se loguea como `error`, 4xx como `warn` y el resto como `log`. Así los
  fallos se filtran por un campo categórico (`level="error"`) en lugar de tener que expresar rangos numéricos sobre
  `status_code`, que es lo que pide la mayoría de los agregadores para definir una alerta.

Ejemplo de dos eventos, un request exitoso y uno fallido (un objeto JSON por línea, formato JSON Lines):

```jsonl
{"level":"log","pid":78527,"timestamp":1790542855650,"message":"GET /products 200","context":"HTTP","method":"GET","path":"/products","status_code":200}
{"level":"warn","pid":78527,"timestamp":1790542855660,"message":"GET /products/999 404","context":"HTTP","method":"GET","path":"/products/999","status_code":404}
```

**Sobre los colores en desarrollo.** Se probó activar `colors: true` fuera de producción, para que los logs fueran
más legibles en la terminal, y se descartó: con esa opción la salida deja de ser JSON parseable (verificado contra
`JSON.parse`). Habría significado que la aplicación emita un formato en desarrollo y otro en producción — el mismo
problema de paridad de entornos que evita el Dockerfile.

La solución fue dejar la aplicación emitiendo siempre JSON válido y mover el color a la capa de visualización, con
`jq` sobre el stream:

```bash
npm run start:dev:pretty   # equivale a: nest start --watch | jq -Rr --unbuffered 'fromjson? // .'
```

El filtro `fromjson? // .` deja pasar las líneas que no son JSON (errores de compilación, banners) en vez de cortar
el pipe, y el script avisa si falta `jq` en lugar de fallar con un error de shell.

Como el stream sigue siendo JSON válido, también se puede consultar con filtros — por ejemplo, ver solo los
requests fallidos:

```bash
npm run start:dev | jq 'select(.context == "HTTP" and .level != "log")'
```

**Limitación conocida: `path` es la URL concreta, no la ruta.** Se loguea `req.originalUrl`, que incluye los
parámetros y el query string (`/products/3?x=1`). Para logs es lo que se quiere: interesa el request puntual que
falló. Para **métricas** no sirve agrupar por ese valor — cada ID genera una serie temporal distinta y hace explotar
la cardinalidad; ahí conviene agrupar por el patrón de ruta (`/products/:id`). No se resolvió a mano en el middleware
porque la instrumentación de OpenTelemetry para Express ya expone la ruta normalizada, así que queda como parte del
ítem de monitoreo de la Fase 5 y no como lógica propia que habría que mantener.

Esto quedó confirmado al instrumentar con OpenTelemetry: un request a `/products/999` que termina en 404 produce la
métrica con `http.route="/products/:id"`, el patrón y no la URL concreta. La cardinalidad queda acotada sin escribir
código propio.

#### Observabilidad: OpenTelemetry → Grafana Cloud

La aplicación exporta **trazas y métricas** por OTLP directamente a Grafana Cloud, con instrumentación *zero-code*:
no hay un archivo de bootstrap escrito a mano ni cambios en el código de la aplicación, solo configuración. Se
descartó desplegar un agente intermedio (Grafana Alloy) porque agregaría un contenedor más que habría que operar y
replicar en Render, cuando la app puede hablar OTLP por su cuenta.

No se copió el comando del asistente tal cual: se verificó primero contra la documentación de OpenTelemetry y
probándolo, porque el comando que sugiere deja la instrumentación incompleta en este proyecto. El detalle técnico (por
qué hace falta un hook de ESM y cómo se carga en Node 24) está comentado en `otel-hook.mjs`, junto al código.

**Dónde vive cada variable.** El criterio es qué es secreto y qué tiene que valer igual en los dos entornos:

| Variable                                                                              | Dónde                                                         | Por qué                                                                              |
|---------------------------------------------------------------------------------------|---------------------------------------------------------------|--------------------------------------------------------------------------------------|
| `NODE_OPTIONS`, `OTEL_SERVICE_NAME`, `OTEL_*_EXPORTER`, `OTEL_EXPORTER_OTLP_PROTOCOL` | `Dockerfile`                                                  | No son secretos y deben valer igual en local y en Render: quedan dentro de la imagen |
| `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`                           | `.env` (local) / variables del servicio (Render)              | El header lleva el token. `.env` está en `.gitignore` y en `.dockerignore`           |
| `OTEL_RESOURCE_ATTRIBUTES` (`deployment.environment`)                                 | `docker-compose.yaml` (`development`) / Render (`production`) | Es lo único que cambia entre entornos                                                |

Las dependencias van en `dependencies`, no en `devDependencies`, porque el Dockerfile hace `npm prune --omit=dev`
antes de armar la imagen final (verificado: el prune no remueve ningún paquete de OpenTelemetry).

**Logs.** `OTEL_LOGS_EXPORTER` queda en `none` a propósito. La auto-instrumentación solo captura logs de `pino`,
`winston` y `bunyan`; el `ConsoleLogger` de NestJS no está en esa lista, así que ponerlo en `otlp` no enviaría nada.
Los logs JSON se recogen por stdout, que es lo que pide la consigna.

**Verificación.** El flujo se probó primero de punta a punta contra un receptor OTLP local, antes de tener
credenciales de Grafana, después se confirmó contra Grafana Cloud en local (`docker compose`), y finalmente **contra
producción**: tráfico real a `curso-devops-api.onrender.com` (release `v0.3.0`) aparece en minutos como trazas en
Tempo y como métricas en Prometheus, con `deployment_environment=production`, sin errores de exportación. La métrica
que alimenta las Golden Signals es `http.server.request.duration` (histograma en segundos) con los atributos
`http.route`, `http.request.method` y `http.response.status_code`; en Prometheus queda como
`http_server_request_duration_seconds_{bucket,sum,count}`.

**Cómo se llegó ahí: una hipótesis equivocada.** Esta última verificación no fue inmediata, y el camino es más
ilustrativo que el resultado. Al consultar Grafana Cloud por primera vez, **todo** lo que había tenía
`deployment_environment=development`: ni un dato de Render, pese a que el servicio estaba `live` y respondía tráfico
real. La hipótesis inicial fue la obvia — faltaban las variables OTLP en el servicio— así que se cargaron
`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS` y `OTEL_RESOURCE_ATTRIBUTES` con las credenciales reales.
Seguía sin llegar nada. Se descartaron las explicaciones fáciles una por una: se validó el endpoint y el token por
separado con `curl` contra el gateway OTLP (200 OK, credencial correcta), y se generó tráfico en varias tandas, hasta
24 h después, para descartar demoras de ingesta. Tampoco aparecía un solo log JSON por request en la salida de Render.

La causa real no estaba en la configuración sino en **qué artefacto se estaba ejecutando**: Render corría la imagen
`v0.2.0`, publicada por la release de Swagger (PR #15), **anterior** a los PRs que agregaron el `LoggerMiddleware` y
la instrumentación de OpenTelemetry (#16, #17, #18). Se confirmó leyendo el código de ese tag:
`git show v0.2.0:Dockerfile` no tiene el `NODE_OPTIONS` del hook de OTel, y `logger.middleware.ts` no existe en ese
árbol. El binario desplegado simplemente no tenía ese código, y ninguna variable de entorno podía cambiarlo. La
solución fue cortar la release `v0.3.0` sobre `main`; minutos después del deploy, el tráfico real ya aparecía en
Tempo y Prometheus con `deployment_environment=production`.

Es otra vez el problema de **paridad entre entornos** que motivó el Dockerfile y la extracción de `configureApp` en
los e2e, pero en su versión más cara: no divergían las configuraciones, divergía la *versión*. Lo que se probaba en
local y lo que corría en producción eran dos builds distintos, y nada en el pipeline lo hacía evidente — el deploy
decía "success" porque desplegó correctamente la imagen equivocada. El aprendizaje quedó incorporado en el checklist
de verificación: comprobar siempre contra qué tag corre producción antes de diagnosticar por qué "no funciona".

#### Dashboard de Golden Signals

El tablero se armó desde cero en Grafana Cloud, sin partir de plantillas ni de las vistas prearmadas de Application
Observability. Está definido como JSON en [
`docs/grafana/golden-signals-dashboard.json`](docs/grafana/golden-signals-dashboard.json)
y versionado en el repositorio (se carga desde Dashboards → New → Import), de modo que se puede reproducir y revisar
como cualquier otro artefacto. Todas las consultas filtran `deployment_environment="production"`.

| Señal      | Panel                                                                                                       | Consulta (resumen)                                                                               |
|------------|-------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
| Tráfico    | Peticiones por segundo por ruta + indicador de RPM                                                          | `sum by (http_route) (rate(http_server_request_duration_seconds_count[5m]))`                     |
| Latencia   | p50, p95 y p99 de las respuestas 2xx + indicador de p95                                                     | `histogram_quantile(0.99, sum by (le) (rate(..._bucket{http_response_status_code=~"2.."}[5m])))` |
| Errores    | 4xx y 5xx por segundo, y dos indicadores (% de 4xx y % de 5xx sobre el tráfico)                             | `sum(rate(..._count{http_response_status_code=~"5.."}[5m])) or vector(0)`                        |
| Saturación | Utilización del event loop de Node y memoria del heap de V8 (cuarta señal; extra a lo que pide la consigna) | `nodejs_eventloop_utilization_ratio` y `sum(v8js_memory_heap_used_bytes)`                        |

Decisiones de diseño:

- **Ventana de `rate()` de 5 minutos.** El SDK de OpenTelemetry exporta las métricas cada 60 s por defecto, así que una
  ventana corta tendría una o dos muestras y saldría irregular.
- **`or vector(0)` en los errores.** Sin eso, la serie de 5xx no existe mientras no haya fallos y el panel muestra "No
  data" en lugar de una línea en cero, que es justamente lo que se quiere ver cuando todo anda bien.
- **4xx y 5xx por separado.** Un 404 o un 400 es un error del cliente; un 5xx es un fallo del servicio. Mezclarlos en un
  solo porcentaje haría parecer que la API falla cuando solo recibe pedidos inválidos. El indicador de 5xx es el
  candidato natural para una alerta.
- **Agrupar por `http_route`.** Aparece `/products/:id`, no cada URL concreta, así que la cardinalidad queda acotada
  (ver
  [Logs Estructurados](#logs-estructurados)).
- **Latencia solo sobre respuestas 2xx.** Un 404 o un 400 responde casi al instante: si entraran en el percentil, lo
  bajarían y ocultarían la latencia real de las requests exitosas. Es la recomendación del material de la cursada sobre
  separar la latencia de éxitos y de fallos.
- **p50, p95 y p99, no promedios.** Un promedio esconde la cola: un p99 alto significa que 1 de cada 100 usuarios espera
  mucho aunque el promedio se vea bien.

Para que tuviera datos se generó tráfico real contra la API en producción con `curl` (unas 150 peticiones en ~5
minutos, con respuestas 200, 404 y 400; los `POST` eran inválidos a propósito para no crear productos).

![Dashboard de Golden Signals con tráfico activo](docs/images/monitoreo-dashboard.png)

_Dashboard con tráfico activo sobre producción (rango: últimos 10 minutos). Arriba, los cuatro indicadores: 26 RPM,
p95 de 4.8 ms, 30.8 % de respuestas 4xx y 0.0 % de 5xx. Abajo, un gráfico por señal: tráfico por ruta, latencia p50 y
p95, y errores 4xx y 5xx. (Captura de la primera versión del tablero: después se filtró la latencia a respuestas 2xx y
se agregaron el p99 y los paneles de saturación.) El 30.8 % de 4xx no refleja un problema de la API: es el resultado del
tráfico sintético
generado para la prueba (aproximadamente 20 % de 404 y 10 % de 400 a propósito), y el indicador está en rojo porque
supera el umbral del 30 %. El 5xx en cero es real: en la prueba no hubo ningún error de servidor._

**Limitaciones a tener presentes al leer el tablero:**

- **La latencia tiene poca resolución.** En las pruebas p50 dio 2.5 ms y p95 4.75 ms, que son exactamente el 50 % y el
  95 % de 5 ms: casi todas las peticiones cayeron en el primer bucket del histograma (hasta 5 ms) y Prometheus solo
  interpola dentro de él. Lo que esos números prueban es que casi todo responde en menos de 5 ms, no un percentil
  medido con precisión.
- **Es latencia de la aplicación, no la que percibe el usuario.** No incluye la red ni el arranque en frío del plan
  Free de Render (~40 s en el primer request tras un período de inactividad).
- **Todavía no hay 5xx reales.** La API no tiene ningún camino que devuelva un error de servidor, así que el panel de
  5xx se ve en cero. Verlo reaccionar con un fallo real exigiría código de fallo y una release nueva, y no se hizo.
- **La saturación se mide con métricas de runtime de Node, no con CPU y memoria del contenedor.** La consigna pide tres
  señales; la cuarta (saturación) se agregó porque la instrumentación ya exporta la utilización del event loop y la
  memoria del heap de V8. En cambio no hay porcentaje de CPU ni memoria usada frente al límite del plan Free de Render,
  porque esas métricas no se exportan; por eso el panel de memoria muestra bytes absolutos y no un porcentaje sobre una
  capacidad. Con la API casi inactiva, el event loop está por debajo del 1 %.
- **Las métricas no llevan la versión de la aplicación.** Sería útil para comparar antes y después de un deploy, pero
  requeriría etiquetar la imagen en el build y cortar una release nueva.
- **Los logs no llevan un identificador de correlación** (`request_id` o `trace_id`). Cumplen los cuatro campos que pide
  la consigna (`timestamp`, `level`, `path`, `status_code`), pero no se pueden enlazar a una traza concreta desde el
  log.

#### Objetivos de servicio: SLI, SLO, SLA y error budget

Monitorear sin definir primero qué nivel de servicio se quiere garantizar es "ruido en una pantalla": sin un objetivo no
se sabe qué métricas importan ni cuándo alertar. Por eso el dashboard y la alerta parten de dos objetivos explícitos:

|                       | Disponibilidad                                                | Latencia                                 |
|-----------------------|---------------------------------------------------------------|------------------------------------------|
| **SLI** (qué se mide) | Proporción de requests sin 5xx: `1 - (5xx / total)`           | p99 de la duración de las respuestas 2xx |
| **SLO** (objetivo)    | ≥ 99.9 % en una ventana de 30 días                            | p99 < 500 ms                             |
| **Error budget**      | 0.1 % de las requests, unos 43 minutos de falla total por mes | —                                        |
| **SLA**               | No hay                                                        | No hay                                   |

- **No hay SLA** porque no existe un cliente ni un contrato con penalidades: es un proyecto académico. El SLA es el
  contrato (por ejemplo, un crédito si la disponibilidad baja de 99.5 %) y siempre es menos exigente que el SLO interno,
  para tener margen antes de incumplirlo.
- **Los valores del SLO son objetivos declarados para el ejercicio**, tomados como referencia de la bibliografía de la
  cursada, no el resultado de un acuerdo con usuarios reales.
- **Estado actual de la latencia:** en las últimas 24 horas, cerca del 98 % de las respuestas 2xx tardó 5 ms o menos y
  cerca del 99 % tardó 10 ms o menos, así que el p99 queda entre 5 y 10 ms, muy por debajo de los 500 ms del objetivo.
  (Tiene poca resolución, por los buckets del histograma; ver las limitaciones del dashboard.)
- **El error budget con tan poco tráfico es casi nulo.** Con unos pocos cientos de requests por día, una sola respuesta
  5xx ya supera el 0.1 %. En un servicio real con millones de requests el presupuesto permite fallas ocasionales; acá
  funciona como cero tolerancia, lo cual es aceptable para una API de práctica.
- **Para qué sirve el presupuesto:** convierte la pregunta subjetiva "¿deployamos?" en una decisión con datos. Si el
  mes ya consumió el presupuesto, conviene frenar cambios y estabilizar antes de cortar otra release; si sobra, se puede
  desplegar con más confianza.

#### Alerta sobre errores de servidor

La consigna pregunta qué herramienta detecta una avalancha de 5xx y mediante qué señal. La respuesta es una regla de
alerta de Grafana sobre la métrica `http.server.request.duration`, basada en el SLO de disponibilidad. Se diseñó con el
criterio de que una alerta válida debe ser a la vez **urgente** (pide atención en minutos), **accionable** (hay algo
concreto que hacer) y **con impacto en el usuario**; si falta alguna, es ruido y termina silenciada.

```promql
(
  sum(rate(http_server_request_duration_seconds_count{deployment_environment="production",http_response_status_code=~"5.."}[1h]))
  /
  sum(rate(http_server_request_duration_seconds_count{deployment_environment="production"}[1h]))
) > (14 * 0.001)
```

- **Qué significa.** Se dispara cuando la proporción de 5xx supera 14 veces lo que tolera el SLO (1.4 % frente al 0.1 %
  del presupuesto), sostenido durante 5 minutos. Es una alerta de _burn rate_ (velocidad de consumo del presupuesto): a
  ese
  ritmo, el presupuesto del mes se agotaría en unas 51 horas (30 días dividido 14). Es mejor que una alerta estática del
  tipo "hay más de N errores", porque está ligada al impacto en el SLO y no a un número arbitrario.
- **Sin tráfico no se dispara.** Si la API está inactiva, la consulta no devuelve datos (se verificó contra el
  Prometheus de Grafana Cloud). La regla debe configurarse con "sin datos = normal", porque la ausencia de peticiones no
  es una falla.
- **Es sensible con poco tráfico.** Con pocas requests en la hora, un solo 5xx puede cruzar el 1.4 %. Para esta API es
  aceptable; en un servicio real se agregaría un mínimo de tráfico a la condición.
- **Accionable.** Tiene un runbook en el repositorio:
  [`docs/runbooks/alta-tasa-de-5xx.md`](docs/runbooks/alta-tasa-de-5xx.md), con los pasos de diagnóstico y la
  mitigación (revertir a la imagen anterior desde Render). Si no se pueden escribir los pasos, no se debería crear la
  alerta.

**La regla está creada en Grafana Cloud** (Alerting → Alert rules, carpeta `curso-devops`, grupo `api-slo`): consulta
anterior como condición, evaluación cada minuto con `for: 5m`, etiqueta `severity=critical`, anotación `runbook_url`
apuntando al archivo del runbook en `main`, contact point `curso-devops-email` a `berriel@gmail.com`. Estado: Normal
(no dispara porque no hay 5xx reales).

![Alerta de burn rate sobre SLO 99.9%](docs/images/alerta-5xx.png)

_Regla en estado Normal. Carpeta: curso-devops, grupo: api-slo, contact point: curso-devops-email. Runbook enlazado al
repositorio en main._

#### Estrategia de Versionado

Se adoptó **Semantic Versioning (SemVer)** (`MAJOR.MINOR.PATCH`, ej. `v1.0.0`).

Al usar Conventional Commits, el tipo de cada commit determina automáticamente el
incremento de versión (`feat` → minor, `fix` → patch, `BREAKING CHANGE` → major), lo que
permite automatizar el tagging dentro del pipeline en lugar de versionar a mano. Esto
también es coherente con la Fase 4, que exige que la imagen publicada en Docker Hub quede
etiquetada con la versión SemVer generada en la release.

El versionado no es solo el campo `version` de `package.json` (que hoy refleja desarrollo
inicial, `0.x.y`) — lo que realmente traza una release es un **tag de git inmutable** sobre
el commit exacto:

```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

Ese tag es el que `release.yml` usa para nombrar la imagen Docker: el tag de la imagen es exactamente el tag de git
(`v0.1.0`) y no se publica `latest`. Hoy el tag se crea a mano (`git tag` + `git push`); lo que el pipeline automatiza
es el build y la publicación etiquetada a partir de él.

Primera release publicada: `adrianberriel/curso-devops-api:v0.1.0`. Release actual, deployada en Render:
`adrianberriel/curso-devops-api:v0.3.0`.

![Tags del repositorio en Docker Hub](docs/images/dockerhub-tags.png)

_Los tres tags SemVer publicados (`v0.1.0`, `v0.2.0`, `v0.3.0`), todos `linux/amd64`, sin tag `latest`, en un
repositorio público (la página se ve sin iniciar sesión)._

### 3. Aplicación de la Filosofía DevOps

_Lo único que sigue abierto en esta sección es crear en Grafana la regla de alerta sobre 5xx, ya diseñada (ver
[Alerta sobre errores de servidor](#alerta-sobre-errores-de-servidor)); el resto está cubierto con evidencia._

#### Primera Forma (Flujo y Consistencia)

**Tareas manuales que quedaron automatizadas**

- Lint y tests unitarios en cada Pull Request (`ci.yml`).
- Build de la imagen Docker y publicación en Docker Hub con el tag de la release (`release.yml`), sin
  `docker build` / `docker push` manuales.
- Aviso del deploy a Render mediante deploy hook con el tag exacto — confirmado con `v0.2.0` y `v0.3.0`: cada release
  disparó el hook y el servicio quedó corriendo esa imagen.
- Sigue siendo manual: crear el tag SemVer (`git tag` + `git push`).

**Consistencia del entorno**

- El mismo `Dockerfile` se usa en local (`docker compose`) y en CI (build de la release), con imagen base pineada
  (`node:24.20-alpine3.24`) y dependencias instaladas con `npm ci` desde el lockfile.
- La imagen se construye una sola vez en CI; ese artefacto, identificado por su tag, es el que se despliega —
  confirmado: Render corre exactamente la imagen `v0.3.0` publicada en Docker Hub.
- Matiz: los tres jobs corren directamente en el runner con Node 24 (el mismo major que la imagen), no dentro
  del contenedor.

#### Segunda Forma (Feedback rápido y Andon Cord)

**Puntos donde el flujo corta el cable**

1. **Pull Request:** si `Lint`, `Unit tests` o `E2E tests` fallan, el check queda en rojo y GitHub bloquea el merge —
   "Require status checks to pass" está activo para los tres jobs (ver
   [Protección de `main`](#estrategia-de-integración-branching)).
2. **Release:** el job `docker` tiene `needs: ci`, así que si lint o tests fallan sobre el tag no se construye ni se
   publica la imagen; el job `deploy` tiene `needs: docker`, así que no se dispara si la imagen no se publicó.

**Velocidad del feedback:** en la primera release, `Lint` tardó 23 s, `Unit tests` 13 s y el build y push de la
imagen 1 m 7 s. En un Pull Request con una falla real
(ver [Tercera Forma](#tercera-forma-aprendizaje-y-simulación-de-fallos)),
cada job dio su señal entre 17 y 27 s.

**Visibilidad de fallos (errores 5xx o latencia alta):** primer paso cubierto — cada request emite un evento JSON
donde el `level` se deriva del `status_code` (5xx → `error`, 4xx → `warn`), así que un fallo se detecta filtrando por
un campo categórico en lugar de leer los logs a ojo. Localmente ya es consultable
(`npm run start:dev | jq 'select(.level != "log")'`), que es la misma condición que después se traduce en una alerta.
La latencia y los errores ya se miden y se visualizan en el
[dashboard de Golden Signals](#dashboard-de-golden-signals), alimentado por la métrica `http.server.request.duration`
(ver [Observabilidad](#observabilidad-opentelemetry--grafana-cloud)): un pico de 5xx se ve en el panel de errores y la
latencia alta en el de p95. Para que la señal avise sola, la herramienta es una regla de alerta de Grafana basada en el
SLO de disponibilidad (velocidad de consumo del presupuesto de errores) y con un runbook asociado; el diseño está en
[Objetivos de servicio](#objetivos-de-servicio-sli-slo-sla-y-error-budget) y
[Alerta sobre errores de servidor](#alerta-sobre-errores-de-servidor). Los logs quedan solo en stdout (no se envían por
OTLP), una decisión consciente para no sumar un backend de logs.

#### Tercera Forma (Aprendizaje y simulación de fallos)

**Escenario.** Se introdujo a propósito una regresión de un solo carácter en `ProductsService.remove()`:
`splice(index, 1)`
pasó a `splice(index, 0)`, de modo que el método dice borrar el producto pero no borra nada. Es el tipo de error que se
cuela en una revisión porque el código sigue compilando, el linter no se queja y la API responde 200. Se subió en una
rama aparte (`test/controlled-failure-experiment`, commit `29be8eb`) y se abrió el PR #25 hacia `main`, marcado "DO NOT
MERGE" en la descripción.

**Reacción del sistema.** Antes de pushear se corrió todo en local: lint limpio, 2 de 34 tests unitarios y 2 de 16 e2e
en rojo. En GitHub, CI reprodujo el resultado:

| Job          | Resultado                     | Tiempo |
|--------------|-------------------------------|--------|
| `Lint`       | Pasa                          | 17 s   |
| `Unit tests` | **Falla** (2 de 34)           | 27 s   |
| `E2E tests`  | **Falla** (2 de 16, en local) | 17 s   |

Los dos jobs de pruebas son checks requeridos, así que el PR quedó con "Some checks were not successful" y el botón
**Merge pull request** deshabilitado (ver captura). El corte ocurrió en el Pull Request, antes de llegar a `main`: no se
creó ningún tag, no se construyó ninguna imagen y no se desplegó nada, de modo que producción siguió corriendo `v0.3.0`
sin enterarse. Cada job tardó entre 17 y 27 segundos en dar la señal.

La falla se ve en tres lugares sin salir de GitHub: la cruz roja junto al commit, los checks del PR y el log del job,
que
dice exactamente qué se rompió:

```
FAIL  src/products/products.service.spec.ts > ProductsService > remove > should delete the product
AssertionError: expected [ { id: 1, …(4) }, …(2) ] to have length of 2 but got 3
```

Los dos tests fallidos de la suite unitaria son `should delete the product` y
`should leave the other products in place`.
En los e2e, los que cayeron en local fueron `should remove the product` y el ciclo completo
`should create, read, update and delete a product`. El mismo bug lo detectan dos capas distintas: el servicio llamado
directamente y la API por HTTP.

![PR con los checks de CI: Unit tests y E2E tests en rojo, Lint en verde y el merge bloqueado](docs/images/falla-controlada-1.png)

_PR #25: dos checks requeridos en rojo, `Lint` en verde y el botón de merge deshabilitado._

![Log del job Unit tests con los dos tests fallidos y el error de aserción](docs/images/falla-controlada-2.png)

_Log del job `Unit tests`: los dos tests que fallaron y el motivo._

**Aprendizaje.**

- **El linter no sustituye a los tests.** `Lint` pasó en verde: un error semántico como este no lo ve. El verdadero
  Andon Cord de este pipeline son las pruebas, por eso importa medir bien la cobertura (ver
  [Estrategia de Pruebas](#estrategia-de-pruebas)).
- **Dos capas cubren el mismo defecto.** Que fallen a la vez los unitarios y los e2e es redundancia útil: si una suite
  se debilitara, la otra todavía lo atraparía.
- **El control es real incluso para el dueño del repositorio.** La regla de `main` tiene activado "Do not allow
  bypassing
  the above settings", así que el administrador tampoco puede saltarse los checks.
- **No hizo falta cambiar nada.** Esta vez el experimento confirmó el diseño en lugar de corregirlo. El PR se cerró sin
  mergear y la rama se borró.

**Lo que este experimento no ejercita.** Como el defecto se frenó antes de producción, el dashboard de Golden Signals no
mostró ningún cambio, que es justamente el objetivo de cortar temprano. Lo que quedó sin probar es la otra mitad: ver
una avalancha de 5xx reales aparecer en el panel de errores, porque la API no tiene hoy ningún camino que devuelva un
error de servidor. Provocarlo exigiría código de fallo y una release nueva, y se dejó como limitación conocida (ver
[Dashboard de Golden Signals](#dashboard-de-golden-signals)).

### 4. Principios Lean (Reducción de Desperdicio)

1. **Esperas y trabajo manual de empaquetado.** Sin pipeline, construir y publicar la imagen dependería de que alguien
   ejecute los pasos a mano en cada release. `release.yml` lo hace al pushear el tag: la release `v0.3.0` completa (CI,
   build y push de la imagen, y deploy a Render) corrió sola en 2 m 39 s, sin intervención.
2. **Defectos detectados tarde.** `ci.yml` corre lint y tests en cada Pull Request, y el mismo CI se vuelve a ejecutar
   sobre el tag antes de publicar (`needs: ci`), de modo que un defecto se frena antes de llegar al registro. El
   experimento de falla controlada lo mostró con un defecto introducido a propósito: en menos de 30 s el PR quedó
   bloqueado, en lugar de
   descubrirse después de desplegar, cuando corregirlo exige otra release y un usuario ya pudo verlo.
3. **Retrabajo por diferencias de entorno.** Un `Dockerfile` multi-stage con base pineada, usado igual en local y en
   CI, evita el "en mi máquina funciona"; además la imagen final es liviana (61.32 MB comprimida en `v0.1.0`), lo que
   reduce la
   transferencia en cada publicación y despliegue.