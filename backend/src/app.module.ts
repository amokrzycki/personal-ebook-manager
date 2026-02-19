import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './entities/book.entity';
import { Shelf } from './entities/shelf.entity';
import { BooksModule } from './modules/books.module';

@Module({
  imports: [
    // Loading environment variables from an .env file
    ConfigModule.forRoot({ isGlobal: true }),

    // SQLite database configuration
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'ebook-library.sqlite',
      entities: [Book, Shelf],
      synchronize: true, // for development/demo only
      logging: process.env.NODE_ENV === 'development',
    }),
    BooksModule,
  ],
})
export class AppModule {}
