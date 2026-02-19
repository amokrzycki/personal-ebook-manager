import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global URL prefix
  app.setGlobalPrefix('api/v1');

  // CORS – we allow the frontend to communicate with the backend
  app.enableCors({
    origin: [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // removes fields not defined in DTO
      forbidNonWhitelisted: true, // throws an error for unknown fields
      transform: true, // automatically casts types (string > number)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`EBOOK BACKEND started: http://localhost:${port}/api/v1`);
}

bootstrap();
