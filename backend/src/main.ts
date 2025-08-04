import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for development
  const isDevelopment =
    process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

  if (isDevelopment) {
    app.enableCors({
      origin: [
        'http://127.0.0.1:8080',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
  } else {
    // In production, you should specify allowed origins
    app.enableCors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
