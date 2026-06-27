import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VendeursModule } from './vendeurs/vendeurs.module';
import { SuccursalesModule } from './succursales/succursales.module';
import { BoulesModule } from './boules/boules.module';
import { LimitationsModule } from './limitations/limitations.module';
import { BorlettesModule } from './borlettes/borlettes.module';
import { ResultatsModule } from './resultats/resultats.module';
import { SettingsModule } from './settings/settings.module';
import { TicketsModule } from './tickets/tickets.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3001),
        ALLOWED_HOST: Joi.string().required(),
        FRONTEND_URL: Joi.string().required(),
        DB_TYPE: Joi.string().default('mysql'),
        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().default(3306),
        DB_NAME: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().allow('').default(''),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION_TIME: Joi.string().default('3600s'),
        JWT_REFRESH_EXPIRATION_TIME: Joi.string().default('7d'),
        CLOUDINARY_CLOUD_NAME: Joi.string().allow('').default(''),
        CLOUDINARY_API_KEY: Joi.string().allow('').default(''),
        CLOUDINARY_API_SECRET: Joi.string().allow('').default(''),
        RESEND_API_KEY: Joi.string().allow('').default(''),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: config.get<string>('DB_TYPE') as 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    VendeursModule,
    SuccursalesModule,
    BoulesModule,
    LimitationsModule,
    BorlettesModule,
    ResultatsModule,
    SettingsModule,
    TicketsModule,
    UploadModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
