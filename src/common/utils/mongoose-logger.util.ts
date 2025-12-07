import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mongoose from 'mongoose';

/**
 * MongoDB query logging utility for development
 * Logs all database queries, updates, and operations
 */
@Injectable()
export class MongooseLoggerUtil implements OnModuleInit {
  private readonly logger = new Logger('MongoDB');
  private readonly isDevelopment: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDevelopment = this.configService.get<string>('nodeEnv') === 'development';
  }

  onModuleInit() {
    if (this.isDevelopment && this.configService.get<boolean>('mongodb.debug')) {
      this.enableQueryLogging();
    }
  }

  private enableQueryLogging() {
    // Set mongoose debug mode
    mongoose.set('debug', (collectionName: string, method: string, query: any, doc: any) => {
      const operation = `${collectionName}.${method}`;
      const queryString = JSON.stringify(query);

      // Log level based on operation type
      if (method.includes('insert') || method.includes('create')) {
        this.logger.debug(`INSERT: ${operation} - ${queryString}`);
      } else if (method.includes('update') || method.includes('findOneAndUpdate')) {
        this.logger.debug(`UPDATE: ${operation} - ${queryString}`);
      } else if (method.includes('delete') || method.includes('remove')) {
        this.logger.debug(`DELETE: ${operation} - ${queryString}`);
      } else if (method.includes('find')) {
        // Only log find operations if they're slow or complex
        this.logger.verbose(`FIND: ${operation} - ${queryString}`);
      } else {
        this.logger.debug(`QUERY: ${operation} - ${queryString}`);
      }
    });

    // Log connection events
    mongoose.connection.on('connected', () => {
      this.logger.log('MongoDB connected successfully');
    });

    mongoose.connection.on('disconnected', () => {
      this.logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('error', (error) => {
      this.logger.error(`MongoDB connection error: ${error.message}`, error.stack);
    });

    this.logger.log('MongoDB query logging enabled (development mode)');
  }

  /**
   * Log slow queries (>1000ms)
   */
  static logSlowQuery(collection: string, query: string, duration: number) {
    if (duration > 1000) {
      const logger = new Logger('MongoDB-SlowQuery');
      logger.warn(`Slow query detected: ${collection} - ${query} (${duration}ms)`);
    }
  }
}
