import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { JwtAuthGuard } from './common/guards/jwt';
import { AuditInterceptor } from './common/interceptor/audit.interceptor';
import { CorrelationInterceptor } from './common/interceptor/correlation.interceptor';
import { GlobalExceptionFilter } from './common/interceptor/global.exception';
import { DatabaseMonitoringService } from './common/services/database-monitoring.service';
import { TransactionService } from './common/services/transaction.service';
import { maskSensitiveData } from './common/utils/log-utils';
import { MongooseLoggerUtil } from './common/utils/mongoose-logger.util';
import configuration from './config/configuration';
import { CategoriesModule } from './modules/accounting/categories/categories.module';
import { CustomersModule } from './modules/accounting/customers/customers.module';
import { EmployeesModule } from './modules/accounting/employees/employees.module';
import { ExpenseModule } from './modules/accounting/expenses/expense.module';
import { FuelModule } from './modules/accounting/fuels/fuel.module';
import { IncomeModule } from './modules/accounting/incomes/income.module';
import { PaymentsModule } from './modules/accounting/payments/payments.module';
import { ReportsModule } from './modules/accounting/reports/reports.module';
import { VehiclesModule } from './modules/accounting/vehicles/vehicles.module';
import { AuthModule } from './modules/core/auth/auth.module';
import { CustomJwtModule } from './modules/core/auth/jwt-strategy';
import { CompaniesModule } from './modules/core/companies/companies.module';
import { HealthModule } from './modules/core/health/health.module';
import { LoggerModule } from './modules/core/logger/logger.module';
import { SanitizationPipe } from './modules/core/security/pipes/sanitization.pipe';
import { SecurityModule } from './modules/core/security/security.module';
import { UsersModule } from './modules/core/users/users.module';
import { validateConfig } from './validations/config.validation';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isDevelopment = configService.get<string>('nodeEnv') === 'development';
        const logLevel = configService.get<string>('logging.level') || 'info';

        return {
          pinoHttp: {
            level: logLevel,
            transport: isDevelopment
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: false,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
            serializers: {
              req: (req: any) => ({
                id: req.id,
                method: req.method,
                url: req.url,
                correlationId: req.correlationId,
                query: req.query,
                // Body'yi mask'la
                body: req.body ? maskSensitiveData(req.body) : undefined,
              }),
              res: (res: any) => ({
                statusCode: res.statusCode,
              }),
              err: (err: any) => ({
                type: err.type,
                message: err.message,
                stack: err.stack,
              }),
            },
            customProps: (req: any) => ({
              correlationId: req.correlationId,
            }),
            autoLogging: {
              ignore: (req: any) => {
                return req.url?.includes('/health') || req.url?.includes('/api-json') || req.url?.includes('/swagger');
              },
            },
          },
        };
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
      validate: (config: Record<string, unknown>) => {
        if (process.env.NODE_ENV === 'production' || process.env.VALIDATE_CONFIG === 'true') {
          try {
            return validateConfig(config);
          } catch (error) {
            console.error('Config validation failed:', error);
            throw error;
          }
        }
        return config;
      },
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongodb.uri'),
        dbName: config.get<string>('mongodb.dbName'),
        maxPoolSize: config.get<number>('mongodb.maxPoolSize'),
        minPoolSize: config.get<number>('mongodb.minPoolSize'),
        maxIdleTimeMS: config.get<number>('mongodb.maxIdleTimeMS'),
        serverSelectionTimeoutMS: config.get<number>('mongodb.serverSelectionTimeoutMS'),
        socketTimeoutMS: config.get<number>('mongodb.socketTimeoutMS'),
        // Retry mekanizması
        retryWrites: true,
        retryReads: true,
        // Connection retry için ekstra ayarlar
        bufferCommands: false,
        // Auto reconnect
        autoIndex: true,
        autoCreate: false,
      }),
    }),
    CustomJwtModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    CompaniesModule,
    LoggerModule,
    EmployeesModule,
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
    MongooseLoggerUtil,
    TransactionService,
    DatabaseMonitoringService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    { provide: APP_INTERCEPTOR, useClass: CorrelationInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_PIPE, useClass: SanitizationPipe },
  ],
})
export class AppModule {}
