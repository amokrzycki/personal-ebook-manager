import {
  IsArray,
  IsEnum,
  IsISBN,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ReadingStatus } from '../entities/book.entity';

export class CreateBookDto {
  @IsString()
  @MaxLength(512)
  title: string;

  @IsString()
  @MaxLength(256)
  author: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  series?: string;

  @IsOptional()
  @IsNumber()
  seriesNumber?: number;

  @IsOptional()
  @IsISBN()
  isbn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  description?: string;

  @IsOptional()
  @IsUrl()
  coverUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(new Date().getFullYear() + 1)
  publishedYear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  publisher?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalPages?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(ReadingStatus)
  status?: ReadingStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentPage?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;
}
