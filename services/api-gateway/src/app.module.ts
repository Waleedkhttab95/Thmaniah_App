import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './controllers/auth.controller';
import { ContentController } from './controllers/content.controller';
import { DiscoveryController } from './controllers/discovery.controller';
import { ContentSourceController } from './controllers/content-source.controller';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
    }),
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('AUTH_SERVICE_HOST', 'auth-service'),
            port: configService.get<number>('AUTH_SERVICE_PORT', 3001),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'CONTENT_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('CONTENT_SERVICE_HOST', 'content-service'),
            port: configService.get<number>('CONTENT_SERVICE_PORT', 3002),
          },
        }),
        inject: [ConfigService],
      },
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
  ],
  controllers: [
    AuthController,
    ContentController,
    DiscoveryController,
    ContentSourceController,
  ],
  providers: [],
})
export class AppModule {}
