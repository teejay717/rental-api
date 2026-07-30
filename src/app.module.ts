import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { UnitsModule } from './units/units.module';
import { LeasesModule } from './leases/leases.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    UnitsModule,
    LeasesModule,
  ],
})
export class AppModule {}
