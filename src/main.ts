import { NestFactory } from '@nestjs/core';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // No activar `colors`: con esa opción el ConsoleLogger deja de emitir JSON y pasa al
    // formato util.inspect de Node (claves sin comillas, comilla simple, códigos ANSI),
    // que no parsea. Para leer los logs cómodo en desarrollo está `start:dev:pretty`,
    // que colorea con jq sin cambiar lo que emite la aplicación.
    logger: new ConsoleLogger({
      json: true,
      flattenParams: true,
    }),
  });
  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Curso DevOps API')
    .setDescription('API REST de ejemplo (CRUD de Products) para el Trabajo Práctico Integrador de DevOps')
    .setVersion('0.0.1')
    .addTag('products')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
