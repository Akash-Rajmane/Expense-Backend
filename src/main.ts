import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import * as helmetPlugin from '@fastify/helmet';
import * as corsPlugin from '@fastify/cors';
import * as staticPlugin from '@fastify/static';
import { AppModule } from './app.module';

declare global {
  var __dirname: string;
}

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
  await app.register(helmetPlugin as any);

  // CORS
  await app.register(corsPlugin as any, {
    origin: ['http://localhost:3000', 'https://expense-tracker-fs.netlify.app'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'],
  });

  // Serve static files - views are in the views directory at project root
  // When compiled, dist/main.js will be in dist/ folder, so ../views reaches project root/views
  const viewsPath = `${__dirname}/../views`;
  await app.register(staticPlugin as any, {
    root: viewsPath,
    prefix: '/static/',
  });

  await app.listen(4000, '0.0.0.0', (err, address) => {
    if (err) throw err;
    console.log(`Server is running on ${address}`);
  });
}

bootstrap();
