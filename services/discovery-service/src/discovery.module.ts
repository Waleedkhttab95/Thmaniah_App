import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';
import { DiscoveryService } from './discovery.service';
import { DiscoveryController } from './controllers/discovery.controller';
import { Category, CategorySchema } from './schemas/category.schema';
import { UserPreference, UserPreferenceSchema } from './schemas/user-preference.schema';
import { Content, ContentSchema } from './schemas/content.schema';
import * as redisStore from 'cache-manager-redis-store';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
      { name: Category.name, schema: CategorySchema },
      { name: UserPreference.name, schema: UserPreferenceSchema },
      { name: Content.name, schema: ContentSchema }
    ]),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 300,
      max: 1000 
    })
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
  exports: [DiscoveryService]
})
export class DiscoveryModule {} 