import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Verbose = 'verbose',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV?: Environment;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT?: number;

  @IsString()
  @IsNotEmpty()
  MONGO_URI: string;

  @IsString()
  @IsNotEmpty()
  MONGO_DB: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  MONGODB_MAX_POOL_SIZE?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  MONGODB_MIN_POOL_SIZE?: number;

  @IsInt()
  @Min(1000)
  @IsOptional()
  MONGODB_MAX_IDLE_TIME_MS?: number;

  @IsInt()
  @Min(1000)
  @IsOptional()
  MONGODB_SERVER_SELECTION_TIMEOUT_MS?: number;

  @IsInt()
  @Min(1000)
  @IsOptional()
  MONGODB_SOCKET_TIMEOUT_MS?: number;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN?: string;

  @IsString()
  @IsOptional()
  ALLOWED_ORIGINS?: string;
}

export function validateConfig(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: true,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
