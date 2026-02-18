import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Book, ReadingStatus } from '../entities/book.entity';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';
import { GoogleBooksService } from './google-books.service';

/** Library sort options */
export type SortField = 'title' | 'author' | 'rating' | 'createdAt' | 'status';
export type SortOrder = 'ASC' | 'DESC';

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    @InjectRepository(Book)
    private readonly booksRepo: Repository<Book>,
    private readonly googleBooks: GoogleBooksService,
  ) {}

  async create(dto: CreateBookDto): Promise<Book> {
    // Check ISBN uniqueness if provided
    if (dto.isbn) {
      const existing = await this.booksRepo.findOne({ where: { isbn: dto.isbn } });
      if (existing) {
        throw new ConflictException(`Książka z ISBN ${dto.isbn} już istnieje w bibliotece`);
      }
    }

    // Try to fetch metadata from Google Books API using ISBN or title
    const query = dto.isbn ?? dto.title;
    let autoMetadata: Partial<Book> = {};
    if (query) {
      this.logger.log(`Pobieranie metadanych z Google Books dla: "${query}"`);
      autoMetadata = (await this.googleBooks.fetchMetadata(query)) ?? {};
    }

    // User data (dto) has priority over autoMetadata, but we merge them to fill in any missing fields
    const book = this.booksRepo.create({
      ...autoMetadata,   // najpierw dane z API
      ...dto,            // potem dane użytkownika (priorytet)
      status: dto.status ?? ReadingStatus.UNREAD,
      currentPage: dto.currentPage ?? 0,
    });

    return this.booksRepo.save(book);
  }

  async findAll(params?: {
    search?: string;
    status?: ReadingStatus;
    genre?: string;
    sortBy?: SortField;
    order?: SortOrder;
  }): Promise<Book[]> {
    const { search, status, genre, sortBy = 'createdAt', order = 'DESC' } = params ?? {};

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      // ILike – case-insensitive LIKE
      return this.booksRepo.find({
        where: [
          { ...where, title: ILike(`%${search}%`) },
          { ...where, author: ILike(`%${search}%`) },
        ],
        order: { [sortBy]: order },
      });
    }

    const books = await this.booksRepo.find({
      where,
      order: { [sortBy]: order },
    });

    // Filter by genre in-memory (since genres is an array)
    if (genre) {
      return books.filter((b) =>
        b.genres?.some((g) => g.toLowerCase().includes(genre.toLowerCase())),
      );
    }

    return books;
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.booksRepo.findOne({ where: { id } });
    if (!book) throw new NotFoundException(`Książka o ID ${id} nie istnieje`);
    return book;
  }

  async update(id: string, dto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);
    Object.assign(book, dto);

    // Auto progress update
    if (
      book.totalPages &&
      book.currentPage >= book.totalPages &&
      book.status === ReadingStatus.IN_PROGRESS
    ) {
      book.status = ReadingStatus.FINISHED;
      this.logger.log(`Książka "${book.title}" automatycznie oznaczona jako przeczytana`);
    }

    // Set status IN_PROGRESS if user updated currentPage > 0 but status is still UNREAD
    if (book.currentPage > 0 && book.status === ReadingStatus.UNREAD) {
      book.status = ReadingStatus.IN_PROGRESS;
    }

    return this.booksRepo.save(book);
  }

  async updateProgress(
    id: string,
    input: { currentPage?: number; progressPercent?: number },
  ): Promise<Book> {
    const book = await this.findOne(id);

    if (input.progressPercent !== undefined && book.totalPages) {
      book.currentPage = Math.round((input.progressPercent / 100) * book.totalPages);
    } else if (input.currentPage !== undefined) {
      book.currentPage = input.currentPage;
    }

    return this.update(id, { currentPage: book.currentPage });
  }

  async remove(id: string): Promise<void> {
    const book = await this.findOne(id);
    await this.booksRepo.remove(book);
    this.logger.log(`Usunięto książkę: "${book.title}" (ID: ${id})`);
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<ReadingStatus, number>;
    avgRating: number | null;
    totalPagesRead: number;
    topGenres: Array<{ genre: string; count: number }>;
  }> {
    const books = await this.booksRepo.find();

    const byStatus = {
      [ReadingStatus.UNREAD]: 0,
      [ReadingStatus.IN_PROGRESS]: 0,
      [ReadingStatus.FINISHED]: 0,
      [ReadingStatus.ABANDONED]: 0,
    };

    let ratingSum = 0;
    let ratingCount = 0;
    let totalPagesRead = 0;
    const genreCount = new Map<string, number>();

    for (const book of books) {
      byStatus[book.status]++;
      if (book.rating !== null) {
        ratingSum += book.rating;
        ratingCount++;
      }
      totalPagesRead += book.currentPage ?? 0;
      for (const g of book.genres ?? []) {
        genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
      }
    }

    const topGenres = [...genreCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }));

    return {
      total: books.length,
      byStatus,
      avgRating: ratingCount > 0 ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
      totalPagesRead,
      topGenres,
    };
  }
}
