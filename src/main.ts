import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: true,
      whitelist: true,
    }),
  );

  // Security
  await app.register(require('@fastify/helmet'));

  // CORS
  await app.register(require('@fastify/cors'), {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'],
  });

  // Serve static files
  app.register(require('@fastify/static'), {
    root: path.join(__dirname, '..', 'views'),
    prefix: '/static/',
  });

  await app.listen(4000, '0.0.0.0', (err, address) => {
    if (err) throw err;
    console.log(`Server is running on ${address}`);
  });
}

bootstrap();
