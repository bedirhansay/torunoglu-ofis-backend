import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseMonitoringService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_INDEX_MONITORING === 'true') {
      this.logIndexUsage();
    }
  }

  async logIndexUsage() {
    try {
      const db = this.connection.db;
      if (!db) {
        this.logger.warn('Database connection not available');
        return;
      }

      const collections = await db.listCollections().toArray();

      for (const collectionInfo of collections) {
        const collectionName = collectionInfo.name;
        const stats = await db.command({ collStats: collectionName });

        if (stats.indexSizes) {
          this.logger.log(`Collection: ${collectionName}`);
          this.logger.log(`Indexes: ${Object.keys(stats.indexSizes).join(', ')}`);
          this.logger.log(`Total index size: ${stats.totalIndexSize} bytes`);
        }
      }
    } catch (error) {
      this.logger.error('Index monitoring error:', error);
    }
  }

  async getSlowQueries(thresholdMs: number = 1000) {
    // MongoDB slow query log requires profiling to be enabled
    // This is a placeholder for slow query monitoring
    this.logger.warn(`Slow query monitoring requires MongoDB profiling to be enabled. Threshold: ${thresholdMs}ms`);
  }
}
