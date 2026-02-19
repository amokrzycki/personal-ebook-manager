import {
  IsArray,
  IsEnum,
  IsISBN,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ReadingStatus, BookFormat } from '../entities/book.entity';

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
  @MaxLength(20)
  isbn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  description?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(512)
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
  @IsEnum(BookFormat)
  format?: BookFormat;

  // Audio-specific metadata
  @IsOptional()
  @IsInt()
  @Min(0)
  audioDurationSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  audioProgressSeconds?: number;

  // Classification and tags
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // Progress and rating
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

  /* IDs of shelves to which the book is to be assigned when created.
   * We accept a UUID array in accordance with the ManyToMany relationship.
   */
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  shelfIds?: string[];
}
