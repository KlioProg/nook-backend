import {
  RequestMethod,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { HttpExceptionFilter } from './filters/http-exception.filter.js';

export function setupApp(app: INestApplication) {
  const config = app.get(ConfigService);
  app.use(
    helmet({
      contentSecurityPolicy:
        config.get('NODE_ENV') === 'production' ? undefined : false,
    }),
  );
  app.enableCors({ origin: config.getOrThrow<string>('FRONTEND_URL') });
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
  if (config.get('NODE_ENV') === 'development') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Nook API')
        .setDescription(
          'Initial place discovery foundation. Prices are in PHP; distance is a straight-line estimate.',
        )
        .setVersion('1.0')
        .addBearerAuth()
        .addApiKey(
          { type: 'apiKey', in: 'header', name: 'X-Spot-Write-Key' },
          'spot-management',
        )
        .build(),
    );
    SwaggerModule.setup('api/docs', app, document);
  }
}
