import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import helmet from 'helmet';

function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;

  if (!raw) {
    throw new Error('Falta configurar CORS_ORIGINS.');
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.enableCors({
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  });

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
