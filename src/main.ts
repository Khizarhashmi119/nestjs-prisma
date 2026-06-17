import compress from '@fastify/compress';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Starting NestJS application...');
  console.log('Environment variables:\n', process.env);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                },
              }
            : undefined,
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Security
  await app.register(helmet);

  // Cookie
  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET as string,
  });

  // Compression
  await app.register(compress, {
    encodings: ['gzip', 'deflate'],
  });

  // Validation
  app.useGlobalPipes(new ZodValidationPipe());

  // Listen
  const PORT = process.env.PORT as string;
  await app.listen(PORT, '0.0.0.0');
}

void bootstrap();
