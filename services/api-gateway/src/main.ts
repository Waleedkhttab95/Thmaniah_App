import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('APIGateway');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('Thmaniah Content Platform API')
    .setDescription('Content Management & Discovery API for podcasts and documentaries')
    .setVersion('1.0')
    .addTag('Authentication', 'User registration and login')
    .addTag('Content', 'CMS content management (podcasts, documentaries)')
    .addTag('Content Sources', 'Manage content import sources')
    .addTag('Discovery', 'Search and discover content')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  logger.log(`API Gateway is running on port ${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api`);
}
bootstrap();
