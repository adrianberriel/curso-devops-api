// Hook de instrumentación ESM de OpenTelemetry.
//
// La app es ESM ("type": "module" en package.json, NestJS 12 es ESM nativo). Sin este
// hook, la auto-instrumentación solo parchea lo que se carga por CJS: se pierden los
// spans de express, porque @nestjs/platform-express importa express como ESM.
//
// La documentación de OpenTelemetry indica el flag --experimental-loader, pero en Node 24
// eso emite "ExperimentalWarning: --experimental-loader may be removed in the future;
// instead use register()". Esta es la forma recomendada para Node 24+, sin warning y con
// cobertura idéntica (verificado: mismos spans de http, express y router).
//
// Se carga vía NODE_OPTIONS (ver Dockerfile), antes del módulo de entrada de la app.
import { register } from 'node:module';

register('@opentelemetry/instrumentation/hook.mjs', import.meta.url);
