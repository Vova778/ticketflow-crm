import { DashboardController } from '../dashboard/dashboard.controller';
import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  controllers: [TicketsController, DashboardController],
  providers: [TicketsService],
})
export class TicketsModule {}
