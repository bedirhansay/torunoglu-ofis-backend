import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guards/jwt';
import { AuditInterceptor } from './common/interceptor/audit.interceptor';
import { GlobalExceptionFilter } from './common/interceptor/global.exception';
import { HttpLoggingInterceptor } from './common/interceptor/http-logging.interceptor';
import { MongooseLoggerUtil } from './common/utils/mongoose-logger.util';
import configuration from './config/configuration';
import { CategoriesModule } from './modules/accounting/categories/categories.module';
import { CustomersModule } from './modules/accounting/customers/customers.module';
import { EmployeeModule } from './modules/accounting/employees/employee.module';
import { ExpenseModule } from './modules/accounting/expense/expense.module';
import { FuelModule } from './modules/accounting/fuel/fuel.module';
import { IncomeModule } from './modules/accounting/income/income.module';
import { PaymentsModule } from './modules/accounting/payments/payments.module';
import { ReportsModule } from './modules/accounting/reports/reports.module';
import { VehiclesModule } from './modules/accounting/vehicles/vehicle.module';
import { AuthModule } from './modules/core/auth/auth.module';
import { CustomJwtModule } from './modules/core/auth/jwt-strategy';
import { CompaniesModule } from './modules/core/companies/companies.module';
import { HealthModule } from './modules/core/health/health.module';
import { LoggerModule } from './modules/core/logger/logger.module';
import { SanitizationPipe } from './modules/core/security/pipes/sanitization.pipe';
import { SecurityModule } from './modules/core/security/security.module';
import { UsersModule } from './modules/core/users/users.module';

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
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttler.ttl') || 60000,
            limit: config.get<number>('throttler.limit') || 100,
          },
        ],
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongodb.uri'),
        dbName: config.get<string>('mongodb.dbName'),
        // Connection pooling configuration
        maxPoolSize: config.get<number>('mongodb.maxPoolSize'),
        minPoolSize: config.get<number>('mongodb.minPoolSize'),
        maxIdleTimeMS: config.get<number>('mongodb.maxIdleTimeMS'),
        serverSelectionTimeoutMS: config.get<number>('mongodb.serverSelectionTimeoutMS'),
        socketTimeoutMS: config.get<number>('mongodb.socketTimeoutMS'),
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
    SecurityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MongooseLoggerUtil,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_PIPE, useClass: SanitizationPipe },
  ],
})
export class AppModule {}
