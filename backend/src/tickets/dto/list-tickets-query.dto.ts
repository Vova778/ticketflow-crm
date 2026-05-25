import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  TicketPriority,
  TicketStatus,
} from '../../generated/prisma/client';

export class ListTicketsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  createdById?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  assignedToId?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  perPage: number = 10;
}