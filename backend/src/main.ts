import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
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

  // Cookie parser (required for HttpOnly JWT cookie)
  app.use(cookieParser());

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: nodeEnv === 'production' ? [] : null,
        },
      },
      hsts: nodeEnv === 'production'
        ? { maxAge: 31_536_000, includeSubDomains: true }
        : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  const allowedOrigins = new Set(
    configService
      .get<string>('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  );

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (server-to-server, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
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

  // Swagger UI — only when explicitly opted in via ENABLE_SWAGGER=true
  const enableSwagger = configService.get<string>('ENABLE_SWAGGER', 'false') === 'true';
  if (enableSwagger) {
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
