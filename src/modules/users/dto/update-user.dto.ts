import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  readonly fullName: string;
}

export class AdminUpdateUserDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(4)
  readonly fullName?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(8)
  readonly password?: string;

  @IsBoolean()
  @IsOptional()
  readonly isEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  readonly isVerified?: boolean;
}
