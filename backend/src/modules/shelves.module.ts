import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShelvesController } from '../controllers/shelves.controller';
import { Book } from '../entities/book.entity';
import { Shelf } from '../entities/shelf.entity';
import { ShelvesService } from '../services/shelves.service';

@Module({
  imports: [TypeOrmModule.forFeature([Shelf, Book])],
  controllers: [ShelvesController],
  providers: [ShelvesService],
  exports: [ShelvesService, TypeOrmModule],
})
export class ShelvesModule {}
