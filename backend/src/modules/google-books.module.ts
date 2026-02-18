import { Module } from '@nestjs/common';
import {GoogleBooksService} from "../services/google-books.service";

@Module({
  providers: [GoogleBooksService],
  exports: [GoogleBooksService],
})
export class GoogleBooksModule {}
