import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('DiscoveryService');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.HOST || '0.0.0.0',
        port: parseInt(process.env.PORT, 10) || 3003,
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  await app.listen();
  logger.log(`Discovery Service is listening on port ${process.env.PORT || 3003}`);
}
bootstrap();
