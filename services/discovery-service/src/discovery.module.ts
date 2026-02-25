import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DiscoveryService } from './discovery.service';
import { DiscoveryController } from './controllers/discovery.controller';
import { Category, CategorySchema } from './schemas/category.schema';
import { UserPreference, UserPreferenceSchema } from './schemas/user-preference.schema';
import { Content, ContentSchema } from './schemas/content.schema';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: UserPreference.name, schema: UserPreferenceSchema },
      { name: Content.name, schema: ContentSchema },
    ]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get<number>('REDIS_PORT', 6379),
        ttl: 300,
        max: 1000,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
