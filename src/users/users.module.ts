import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<number>('JWT_TTL_SECONDS'),
          algorithm: 'HS256' as const,
          issuer: 'nook-api',
          audience: 'nook-client',
        },
        verifyOptions: {
          algorithms: ['HS256'],
          issuer: 'nook-api',
          audience: 'nook-client',
        },
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, AuthService, JwtAuthGuard],
  exports: [UsersService, JwtAuthGuard, JwtModule],
})
export class UsersModule {}
