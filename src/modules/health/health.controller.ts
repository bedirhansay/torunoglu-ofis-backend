import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MongooseHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Uygulama sağlık durumunu kontrol eder' })
  @ApiResponse({
    status: 200,
    description: 'Uygulama sağlıklı',
    schema: {
      example: {
        status: 'ok',
        info: {
          mongodb: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          disk: { status: 'up' },
        },
        error: {},
        details: {
          mongodb: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          disk: { status: 'up' },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Uygulama sağlıksız',
  })
  check() {
    return this.health.check([
      // MongoDB bağlantısını kontrol et
      () => this.mongoose.pingCheck('mongodb'),

      // Memory heap kullanımını kontrol et (500MB limit)
      () =>
        this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),

      // Memory RSS (Resident Set Size) kullanımını kontrol et (500MB limit)
      () =>
        this.memory.checkRSS('memory_rss', 500 * 1024 * 1024),

      // Disk kullanımını kontrol et (%90'dan fazla kullanılmışsa uyar)
      () =>
        this.disk.checkStorage('disk', {
          thresholdPercent: 0.9,
          path: '/',
        }),
    ]);
  }

  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe - Uygulamanın çalışıp çalışmadığını kontrol eder' })
  @ApiResponse({
    status: 200,
    description: 'Uygulama çalışıyor',
  })
  checkLiveness() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe - Uygulamanın isteklere hazır olup olmadığını kontrol eder' })
  @ApiResponse({
    status: 200,
    description: 'Uygulama hazır',
  })
  checkReadiness() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
      () =>
        this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
    ]);
  }
}

