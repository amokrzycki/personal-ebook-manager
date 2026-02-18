/**
 * books.controller.ts
 * ───────────────────
 * REST API controller exposing endpoints for managing the library.
 *
 * Endpoints:
 * ─────────────────────────────────────────────────────────────────────
 * GET    /books                  – list books (with filtering and sorting)
 * POST   /books                  – add a new book
 * GET    /books/stats            – library statistics
 * GET    /books/recommendations  – list of recommendations
 * GET    /books/:id              – book details
 * PATCH  /books/:id              – update metadata
 * PATCH  /books/:id/progress     – update reading progress
 * DELETE /books/:id              – delete a book
 * POST   /books/fetch-metadata   – fetch metadata from Google Books (preview)
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BooksService } from '../services/books.service';
import {
  RecommendationsService,
  ScoredBook,
} from '../services/recommendations.service';
import { GoogleBooksService } from '../services/google-books.service';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';
import { ReadingStatus } from '../entities/book.entity';
import type { SortField, SortOrder } from '../services/books.service';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

class UpdateProgressDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  currentPage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  progressPercent?: number;
}

@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly recommendationsService: RecommendationsService,
    private readonly googleBooksService: GoogleBooksService,
  ) {}

  // Read operations
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: ReadingStatus,
    @Query('genre') genre?: string,
    @Query('sortBy') sortBy?: SortField,
    @Query('order') order?: SortOrder,
  ) {
    return this.booksService.findAll({ search, status, genre, sortBy, order });
  }

  @Get('stats')
  getStats() {
    return this.booksService.getStats();
  }

  @Get('recommendations')
  getRecommendations(): Promise<ScoredBook[]> {
    return this.recommendationsService.getRecommendations();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.booksService.findOne(id);
  }

  // Create operations

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  /**
   * "Preview" endpoint – fetches metadata from Google Books without persisting it.
   * The frontend can call this before creating the book
   * to auto-fill the form.
   */
  @Post('fetch-metadata')
  fetchMetadata(@Body('query') query: string) {
    return this.googleBooksService.fetchMetadata(query);
  }

  // Update operations

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  @Patch(':id/progress')
  updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.booksService.updateProgress(id, dto);
  }

  // Deleting

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.booksService.remove(id);
  }
}
