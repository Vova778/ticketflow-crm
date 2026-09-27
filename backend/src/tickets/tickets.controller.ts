import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsQueryDto } from './dto/list-comments-query.dto';
import { TicketsService } from './tickets.service';

@UseGuards(JwtAuthGuard)
@ApiTags('tickets')
@ApiBearerAuth()
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
  create(@Body() dto: CreateTicketDto, @CurrentUser() currentUser: AuthUser) {
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

  @Get(':id/comments')
  comments(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: ListCommentsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.findComments(id, query, user);
  }

  @Post(':id/comments')
  comment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.createComment(id, dto, user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.ticketsService.remove(id, currentUser);
  }
}
