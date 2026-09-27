import {
  IsEnum,
  IsInt,
  ValidateIf,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TicketPriority } from '../../generated/prisma/client';

export class CreateTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  assignedToId?: number;
}
