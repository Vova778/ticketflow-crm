import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TicketPriority } from '../../generated/prisma/client';

export class CreateTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsInt()
  assignedToId?: number;
}