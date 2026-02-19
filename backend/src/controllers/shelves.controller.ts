/**
 * REST API for virtual shelves.
 * Endpoints:
 * GET    /shelves               – list of shelves with the number of books
 * POST   /shelves               – create a shelf
 * GET    /shelves/:id           – shelf with a list of books
 * PATCH  /shelves/:id           – edit shelf metadata
 * DELETE /shelves/:id           – delete shelf
 * POST   /shelves/:id/books/:bookId  – add book to shelf
 * DELETE /shelves/:id/books/:bookId  – delete book from shelf
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
} from '@nestjs/common';
import { CreateShelfDto } from '../dto/create-shelf.dto';
import { UpdateShelfDto } from '../dto/update-shelf.dto';
import { ShelvesService } from '../services/shelves.service';

@Controller('shelves')
export class ShelvesController {
  constructor(private readonly shelvesService: ShelvesService) {}

  @Get()
  findAll() {
    return this.shelvesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.shelvesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateShelfDto) {
    return this.shelvesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateShelfDto) {
    return this.shelvesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.shelvesService.remove(id);
  }

  @Post(':id/books/:bookId')
  addBook(
    @Param('id', ParseUUIDPipe) shelfId: string,
    @Param('bookId', ParseUUIDPipe) bookId: string,
  ) {
    return this.shelvesService.addBook(shelfId, bookId);
  }

  @Delete(':id/books/:bookId')
  @HttpCode(HttpStatus.OK)
  removeBook(
    @Param('id', ParseUUIDPipe) shelfId: string,
    @Param('bookId', ParseUUIDPipe) bookId: string,
  ) {
    return this.shelvesService.removeBook(shelfId, bookId);
  }
}
