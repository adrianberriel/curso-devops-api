import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * Configuración global que afecta cómo la aplicación procesa los requests.
 *
 * Vive acá, y no dentro de `bootstrap()`, porque los tests e2e no ejecutan `main.ts`:
 * arman la app con `createNestApplication()`. Si esta configuración estuviera solo en
 * `main.ts`, los e2e probarían una aplicación distinta de la que se despliega — de hecho
 * pasaba: sin el ValidationPipe, un POST con un body inválido devolvía 201 en los tests
 * y 400 en producción.
 *
 * Todo lo que cambie el comportamiento de un request va acá, para que `main.ts` y los
 * tests no puedan divergir. La configuración de Swagger se queda en `main.ts`: expone
 * documentación, no altera el manejo de los requests.
 */
export function configureApp(app: INestApplication): INestApplication {
  app.useGlobalPipes(new ValidationPipe());

  return app;
}
