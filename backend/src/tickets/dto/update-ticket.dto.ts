import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  TicketPriority,
  TicketStatus,
} from '../../generated/prisma/client';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsInt()
  assignedToId?: number | null;
}