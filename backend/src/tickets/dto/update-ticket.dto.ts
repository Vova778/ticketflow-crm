import {
  IsEnum,
  IsInt,
  ValidateIf,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TicketPriority, TicketStatus } from '../../generated/prisma/client';

export class UpdateTicketDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ValidateIf(
    (_object, value: unknown) => value !== undefined && value !== null,
  )
  @IsInt()
  assignedToId?: number | null;
}
