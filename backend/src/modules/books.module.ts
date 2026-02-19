import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksController } from '../controllers/books.controller';
import { Book } from '../entities/book.entity';
import { BooksService } from '../services/books.service';
import { RecommendationsService } from '../services/recommendations.service';
import { GoogleBooksModule } from './google-books.module';

@Module({
  imports: [TypeOrmModule.forFeature([Book]), GoogleBooksModule],
  controllers: [BooksController],
  providers: [BooksService, RecommendationsService],
  exports: [BooksService],
})
export class BooksModule {}
