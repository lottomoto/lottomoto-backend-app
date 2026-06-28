import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { VendeursModule } from '../vendeurs/vendeurs.module';
import { MailModule } from '../mail/mail.module';
import { User } from '../users/entities/user.entity';
import { Succursale } from '../succursales/entities/succursale.entity';
import { RolesGuard } from './guards/roles.guard';
import { RefreshToken } from './entities/refresh-token.entity';
import { RateLimitGuard } from './guards/rate-limit.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Succursale, RefreshToken]),
    UsersModule,
    VendeursModule,
    MailModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET')!,
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRATION_TIME')! as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, RateLimitGuard],
  exports: [AuthService],
})
export class AuthModule {}
