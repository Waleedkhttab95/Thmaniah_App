import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ContentService } from './content.service';
import { ContentController } from './controllers/content.controller';
import { Content, ContentSchema } from './schemas/content.schema';
import { ContentSource, ContentSourceSchema } from './schemas/content-source.schema';
import { ContentSourceService } from './services/content-source.service';
import { ContentSourceController } from './controllers/content-source.controller';
import { S3Service } from './services/s3.service';
import { UploadController } from './controllers/upload.controller';
import { UploadProcessor } from './processors/upload.processor';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Content.name, schema: ContentSchema },
      { name: ContentSource.name, schema: ContentSourceSchema },
    ]),
    ClientsModule.register([
      {
        name: 'DISCOVERY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.DISCOVERY_SERVICE_HOST || 'discovery-service',
          port: parseInt(process.env.DISCOVERY_SERVICE_PORT) || 3003,
        },
      },
    ]),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'uploads',
    }),
  ],
  controllers: [ContentController, ContentSourceController, UploadController],
  providers: [ContentService, ContentSourceService, S3Service, UploadProcessor],
  exports: [ContentService, ContentSourceService],
})
export class ContentModule {} 