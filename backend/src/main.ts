import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Safety check: prevent accidental DB_SYNCHRONIZE=true in production
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const dbSync = configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true';
  if (nodeEnv === 'production' && dbSync) {
    throw new Error(
      'DB_SYNCHRONIZE=true is not allowed in production. Use TypeORM migrations instead.',
    );
  }

  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000');

  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Swagger UI — available only in non-production environments
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('FeedbackForms API')
      .setDescription(
        'Hospital patient satisfaction survey API. ' +
        'All tenant-scoped routes require a :tenantSlug path parameter. ' +
        'Protected endpoints require a Bearer JWT token.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .addTag('auth', 'Login and authentication')
      .addTag('forms3', 'Form 3 responses (department satisfaction)')
      .addTag('form-templates', 'Form template management')
      .addTag('tenants', 'Tenant management')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    console.log(`Swagger docs at http://localhost:${configService.get<number>('PORT', 3001)}/api/docs`);
  }

  const port = configService.get<number>('PORT', 3001);

  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api`);
}

bootstrap();
