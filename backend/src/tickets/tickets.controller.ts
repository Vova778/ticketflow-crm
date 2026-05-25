import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user.type';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketsService } from './tickets.service';

@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  findAll(
    @Query() query: ListTicketsQueryDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.ticketsService.findAll(query, currentUser);
  }

  @Post()
  create(
    @Body() dto: CreateTicketDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.ticketsService.create(dto, currentUser);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.ticketsService.findOne(id, currentUser);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.ticketsService.update(id, dto, currentUser);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.ticketsService.remove(id, currentUser);
  }
}