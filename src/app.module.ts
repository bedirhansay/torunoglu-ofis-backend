import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guards/jwt';
import configuration from './config/configuration';
import { AuthModule } from './modules/core/auth/auth.module';
import { CustomJwtModule } from './modules/core/auth/jwt-strategy';
import { CategoriesModule } from './modules/accounting/categories/categories.module';
import { CompaniesModule } from './modules/core/companies/companies.module';
import { CustomersModule } from './modules/accounting/customers/customers.module';
import { EmployeeModule } from './modules/accounting/employees/employee.module';
import { ExpenseModule } from './modules/accounting/expense/expense.module';
import { FuelModule } from './modules/accounting/fuel/fuel.module';
import { IncomeModule } from './modules/accounting/income/income.module';
import { LoggerModule } from './modules/core/logger/logger.module';
import { PaymentsModule } from './modules/accounting/payments/payments.module';
import { UsersModule } from './modules/core/users/users.module';
import { VehiclesModule } from './modules/accounting/vehicles/vehicle.module';
import { ReportsModule } from './modules/accounting/reports/reports.module';
import { HealthModule } from './modules/health/health.module';


@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('throttler.ttl') || 60000,
          limit: config.get<number>('throttler.limit') || 100,
        },
      ],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongodb.uri'),
        dbName: config.get<string>('mongodb.dbName'),
      }),
    }),
    CustomJwtModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    CompaniesModule,
    LoggerModule,
    EmployeeModule,
    CustomersModule,
    FuelModule,
    VehiclesModule,
    ExpenseModule,
    IncomeModule,
    PaymentsModule,
    ReportsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
