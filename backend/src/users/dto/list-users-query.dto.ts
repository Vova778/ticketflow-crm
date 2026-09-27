import { Transform } from 'class-transformer';
import { IsEnum, IsInt, ValidateIf, IsString, Max, Min } from 'class-validator';
import { UserRole } from '../../generated/prisma/client';

export class ListUsersQueryDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  search?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(UserRole)
  role?: UserRole;

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
