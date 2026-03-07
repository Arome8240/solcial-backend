import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { SolanaModule } from '../solana/solana.module';

@Module({
  imports: [SolanaModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
