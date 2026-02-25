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
import { ContentImportService } from './services/content-import.service';
import { YouTubeImportStrategy } from './import-strategies/youtube.strategy';
import { RSSImportStrategy } from './import-strategies/rss.strategy';
import { ManualImportStrategy } from './import-strategies/manual.strategy';
import { UploadController } from './controllers/upload.controller';
import { UploadProcessor } from './processors/upload.processor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Content.name, schema: ContentSchema },
      { name: ContentSource.name, schema: ContentSourceSchema },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'DISCOVERY_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('DISCOVERY_SERVICE_HOST', 'discovery-service'),
            port: configService.get<number>('DISCOVERY_SERVICE_PORT', 3003),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'redis'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'uploads' }),
  ],
  controllers: [ContentController, ContentSourceController, UploadController],
  providers: [
    ContentService,
    ContentSourceService,
    ContentImportService,
    S3Service,
    UploadProcessor,
    YouTubeImportStrategy,
    RSSImportStrategy,
    ManualImportStrategy,
  ],
  exports: [ContentService, ContentSourceService, ContentImportService],
})
export class ContentModule {}
