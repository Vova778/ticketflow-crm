import { Transform } from 'class-transformer';
import { IsEnum, IsInt, ValidateIf, IsString, Max, Min } from 'class-validator';
import { TicketPriority, TicketStatus } from '../../generated/prisma/client';

export class ListTicketsQueryDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  search?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }) => Number(value))
  @IsInt()
  createdById?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }) => Number(value))
  @IsInt()
  assignedToId?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page: number = 1;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  perPage: number = 10;
}
