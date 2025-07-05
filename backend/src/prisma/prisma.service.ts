/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from './../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService?: ConfigService) {
    super({
      log:
        configService?.get('NODE_ENV') === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    try {
      this.logger.log('Connecting to database...');
      await this.$connect();
      this.logger.log('Connected to database successfully');

      // Add middleware for logging if in development
      if (this.configService?.get('NODE_ENV') === 'development') {
        this.$use(async (params, next) => {
          const before = Date.now();
          const result = await next(params);
          const after = Date.now();
          this.logger.debug(
            `${params.model}.${params.action} took ${after - before}ms`,
          );
          return result;
        });
      }
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      this.logger.log('Process beforeExit hook triggered, closing application');
      await app.close();
    });

    process.on('SIGINT', async () => {
      this.logger.log('SIGINT signal received, closing application');
      await app.close();
    });

    process.on('SIGTERM', async () => {
      this.logger.log('SIGTERM signal received, closing application');
      await app.close();
    });
  }

  /**
   * Execute operations in a transaction
   */
  async executeInTransaction<T>(
    fn: (
      tx: Omit<
        PrismaClient,
        | '$connect'
        | '$disconnect'
        | '$on'
        | '$transaction'
        | '$use'
        | '$extends'
      >,
    ) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      return await fn(tx);
    });
  }

  /**
   * Clean database (for testing purposes only)
   */
  async cleanDatabase() {
    if (this.configService?.get('NODE_ENV') === 'test') {
      const modelNames = Object.keys(this).filter(
        (key) => !key.startsWith('_') && !key.startsWith('$'),
      );

      return this.$transaction(
        modelNames.map((modelName) => {
          const model = this[modelName as keyof typeof this] as any;
          return model.deleteMany({});
        }),
      );
    }
    this.logger.warn('Attempted to clean database outside of test environment');
  }
}
