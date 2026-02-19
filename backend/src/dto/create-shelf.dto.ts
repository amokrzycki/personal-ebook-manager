import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateShelfDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: 'Color must be a valid hex string',
  })
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  icon?: string;
}
