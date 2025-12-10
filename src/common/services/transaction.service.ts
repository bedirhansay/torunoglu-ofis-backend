import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection } from 'mongoose';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async executeInTransaction<T>(
    callback: (session: ClientSession) => Promise<T>,
    options?: { maxRetries?: number; retryDelayMs?: number }
  ): Promise<T> {
    const { maxRetries = 3, retryDelayMs = 100 } = options || {};
    let retries = 0;

    while (retries <= maxRetries) {
      const session = await this.connection.startSession();
      session.startTransaction();

      try {
        const result = await callback(session);
        await session.commitTransaction();
        return result;
      } catch (error: any) {
        await session.abortTransaction();

        // TransientTransactionError (code 112) veya WriteConflict (code 11000) için retry
        if (
          (error.code === 112 || error.code === 11000 || error.errorLabels?.includes('TransientTransactionError')) &&
          retries < maxRetries
        ) {
          retries++;
          this.logger.warn(`Transaction failed (attempt ${retries}/${maxRetries + 1}): ${error.message}. Retrying...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs * retries)); // Exponential backoff
          continue;
        }

        throw error;
      } finally {
        await session.endSession();
      }
    }

    throw new Error(`Transaction failed after ${maxRetries + 1} retries`);
  }
}
