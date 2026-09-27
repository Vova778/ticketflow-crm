import {
  IsBoolean,
  IsEnum,
  ValidateIf,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../generated/prisma/client';

export class UpdateUserDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MinLength(2)
  lastName?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(UserRole)
  role?: UserRole;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  isActive?: boolean;
}
