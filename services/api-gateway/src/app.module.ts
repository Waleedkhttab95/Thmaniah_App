import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { ContentController } from './controllers/content.controller';
import { DiscoveryController } from './controllers/discovery.controller';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'auth-service',
          port: 3001,
        },
      },
      {
        name: 'CONTENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'content-service',
          port: 3002,
        },
      },
      {
        name: 'DISCOVERY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'discovery-service',
          port: 3003,
        },
      },
    ]),
  ],
  controllers: [AuthController, ContentController, DiscoveryController],
  providers: [],
})
export class AppModule {} 