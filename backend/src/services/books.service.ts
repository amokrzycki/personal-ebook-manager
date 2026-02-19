import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';
import {
  ReadingStatus,
  BookFormat,
  Book,
  AUDIO_FORMATS,
} from '../entities/book.entity';
import { Shelf } from '../entities/shelf.entity';
import { GoogleBooksService } from './google-books.service';
import { omitKey } from '../helpers/omitKey';

export type SortField =
  | 'title'
  | 'author'
  | 'rating'
  | 'createdAt'
  | 'status'
  | 'format';
export type SortOrder = 'ASC' | 'DESC';

/** Advanced filtering parameters */
export interface FindAllParams {
  /** Search across title, author, description, series, and tags */
  search?: string;
  status?: ReadingStatus;
  genre?: string;
  /** Filter by a specific tag */
  tag?: string;
  /** Filter by file format */
  format?: BookFormat;
  /** Filter by author (exact or partial match) */
  author?: string;
  /** Filter by series name */
  series?: string;
  /** Minimum rating threshold */
  minRating?: number;
  /** Maximum rating threshold */
  maxRating?: number;
  /** Filter by specific shelf ID */
  shelfId?: string;
  sortBy?: SortField;
  order?: SortOrder;
}

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    @InjectRepository(Book)
    private readonly booksRepo: Repository<Book>,
    @InjectRepository(Shelf)
    private readonly shelvesRepo: Repository<Shelf>,
    private readonly googleBooks: GoogleBooksService,
  ) {}

  // Create
  async create(dto: CreateBookDto): Promise<Book> {
    if (dto.isbn) {
      const existing = await this.booksRepo.findOne({
        where: { isbn: dto.isbn },
      });
      if (existing) {
        throw new ConflictException(`Książka z ISBN ${dto.isbn} już istnieje`);
      }
    }

    // Auto-fetch from Google Books
    const query = dto.isbn ?? dto.title;
    let autoMeta: Partial<Book> = {};
    if (query) {
      this.logger.log(`Google Books fetch: "${query}"`);
      autoMeta = (await this.googleBooks.fetchMetadata(query)) ?? {};
    }

    // Resolve shelves from IDs to entities, before creating the book
    const shelves = await this.resolveShelves(dto.shelfIds);

    const dtoWithoutShelves = omitKey(dto, 'shelfIds');

    const book = this.booksRepo.create({
      ...autoMeta,
      ...dtoWithoutShelves,
      status: dto.status ?? ReadingStatus.UNREAD,
      currentPage: dto.currentPage ?? 0,
      audioProgressSeconds: dto.audioProgressSeconds ?? 0,
      format: dto.format ?? BookFormat.OTHER,
      shelves,
    });

    return this.booksRepo.save(book);
  }

  /**
   * Advanced filtering based on multiple criteria simultaneously.
   * Order of operations:
   * 1. Database filter (status, format, ILike search)
   * 2. In-memory filter (genres, tags, series, minRating – because SQLite JSON)
   * 3. Shelf filter (via books relation)
   */
  async findAll(params: FindAllParams = {}): Promise<Book[]> {
    const {
      search,
      status,
      genre,
      tag,
      format,
      author,
      series,
      minRating,
      maxRating,
      shelfId,
      sortBy = 'createdAt',
      order = 'DESC',
    } = params;

    // Loading with basic filters and relations (shelves) – more complex filters will be applied in-memory
    const qb = this.booksRepo
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.shelves', 'shelf')
      .orderBy(`book.${sortBy}`, order);

    if (status) qb.andWhere('book.status = :status', { status });
    if (format) qb.andWhere('book.format = :format', { format });

    if (search) {
      // Search in title, author, description and series (tags are JSON, so we can't search them in SQL)
      qb.andWhere(
        '(book.title LIKE :s OR book.author LIKE :s OR book.description LIKE :s OR book.series LIKE :s)',
        { s: `%${search}%` },
      );
    }

    if (author) {
      qb.andWhere('book.author LIKE :author', { author: `%${author}%` });
    }

    let books = await qb.getMany();

    // In-memory filters for genres, tags, series and rating – because SQLite JSON fields can't be queried easily
    if (genre) {
      books = books.filter((b) =>
        b.genres?.some((g) => g.toLowerCase().includes(genre.toLowerCase())),
      );
    }
    if (tag) {
      books = books.filter((b) =>
        b.tags?.some((t) => t.toLowerCase().includes(tag.toLowerCase())),
      );
    }
    if (series) {
      books = books.filter((b) =>
        b.series?.toLowerCase().includes(series.toLowerCase()),
      );
    }
    if (minRating !== undefined) {
      books = books.filter((b) => b.rating !== null && b.rating >= minRating);
    }
    if (maxRating !== undefined) {
      books = books.filter((b) => b.rating !== null && b.rating <= maxRating);
    }
    if (shelfId) {
      books = books.filter((b) => b.shelves?.some((s) => s.id === shelfId));
    }

    return books;
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.booksRepo.findOne({
      where: { id },
      relations: ['shelves'],
    });
    if (!book) throw new NotFoundException(`Książka o ID ${id} nie istnieje`);
    return book;
  }

  // Update

  async update(id: string, dto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);

    // Handle shelves separately – if shelfIds is provided, resolve them to entities and assign to book.shelves
    if (dto.shelfIds !== undefined) {
      book.shelves = await this.resolveShelves(dto.shelfIds);
    }

    const rest = omitKey(dto, 'shelfIds');
    Object.assign(book, rest);

    // Auto status when progress is updated for non-audio formats
    if (!AUDIO_FORMATS.has(book.format)) {
      if (
        book.totalPages &&
        book.currentPage >= book.totalPages &&
        book.status === ReadingStatus.IN_PROGRESS
      ) {
        book.status = ReadingStatus.FINISHED;
        this.logger.log(`"${book.title}" → automatycznie FINISHED`);
      }
      if (book.currentPage > 0 && book.status === ReadingStatus.UNREAD) {
        book.status = ReadingStatus.IN_PROGRESS;
      }
    }

    // Auto status for audio formats based on audioProgressSeconds and audioDurationSeconds
    if (AUDIO_FORMATS.has(book.format)) {
      if (
        book.audioDurationSeconds &&
        book.audioProgressSeconds >= book.audioDurationSeconds &&
        book.status === ReadingStatus.IN_PROGRESS
      ) {
        book.status = ReadingStatus.FINISHED;
      }
      if (
        book.audioProgressSeconds > 0 &&
        book.status === ReadingStatus.UNREAD
      ) {
        book.status = ReadingStatus.IN_PROGRESS;
      }
    }

    return this.booksRepo.save(book);
  }

  /**
   * Progress update – supports both e-books (pages)
   * and audiobooks (seconds or HH:MM:SS format).
   */
  async updateProgress(
    id: string,
    input: {
      currentPage?: number;
      progressPercent?: number;
      audioProgressSeconds?: number;
    },
  ): Promise<Book> {
    const book = await this.findOne(id);
    const isAudio = AUDIO_FORMATS.has(book.format);

    if (isAudio) {
      if (input.audioProgressSeconds !== undefined) {
        book.audioProgressSeconds = input.audioProgressSeconds;
      } else if (
        input.progressPercent !== undefined &&
        book.audioDurationSeconds
      ) {
        book.audioProgressSeconds = Math.round(
          (input.progressPercent / 100) * book.audioDurationSeconds,
        );
      }
    } else {
      if (input.progressPercent !== undefined && book.totalPages) {
        book.currentPage = Math.round(
          (input.progressPercent / 100) * book.totalPages,
        );
      } else if (input.currentPage !== undefined) {
        book.currentPage = input.currentPage;
      }
    }

    return this.update(id, {
      currentPage: book.currentPage,
      audioProgressSeconds: book.audioProgressSeconds,
    });
  }

  // Removing

  async remove(id: string): Promise<void> {
    const book = await this.findOne(id);
    await this.booksRepo.remove(book);
    this.logger.log(`Usunięto: "${book.title}" (${id})`);
  }

  /**
   * Extended Statistics v2:
   * • byFormat – breakdown by file format
   * • totalAudioHours – total time spent listening to audiobooks
   * • avgReadingProgress – average progress for IN_PROGRESS books
   * • finishedThisMonth – number of books completed in the current month
   */
  async getStats() {
    const books = await this.booksRepo.find({ relations: ['shelves'] });

    const byStatus: Record<ReadingStatus, number> = {
      [ReadingStatus.UNREAD]: 0,
      [ReadingStatus.IN_PROGRESS]: 0,
      [ReadingStatus.FINISHED]: 0,
      [ReadingStatus.ABANDONED]: 0,
    };

    const byFormat: Record<string, number> = {};

    let ratingSum = 0;
    let ratingCount = 0;
    let totalPagesRead = 0;
    let totalAudioSeconds = 0;
    let progressSum = 0;
    let inProgressCount = 0;
    const genreCount = new Map<string, number>();
    const tagCount = new Map<string, number>();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let finishedThisMonth = 0;

    for (const book of books) {
      byStatus[book.status]++;
      byFormat[book.format] = (byFormat[book.format] ?? 0) + 1;

      if (book.rating !== null) {
        ratingSum += book.rating;
        ratingCount++;
      }
      totalPagesRead += book.currentPage ?? 0;
      totalAudioSeconds += book.audioProgressSeconds ?? 0;

      if (book.status === ReadingStatus.IN_PROGRESS) {
        const pct = AUDIO_FORMATS.has(book.format)
          ? book.audioDurationSeconds
            ? Math.min(
                100,
                Math.round(
                  (book.audioProgressSeconds / book.audioDurationSeconds) * 100,
                ),
              )
            : 0
          : book.totalPages
            ? Math.min(
                100,
                Math.round((book.currentPage / book.totalPages) * 100),
              )
            : 0;
        progressSum += pct;
        inProgressCount++;
      }

      if (
        book.status === ReadingStatus.FINISHED &&
        new Date(book.updatedAt) >= startOfMonth
      ) {
        finishedThisMonth++;
      }

      for (const g of book.genres ?? [])
        genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
      for (const t of book.tags ?? [])
        tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
    }

    return {
      total: books.length,
      byStatus,
      byFormat,
      avgRating:
        ratingCount > 0
          ? Math.round((ratingSum / ratingCount) * 10) / 10
          : null,
      totalPagesRead,
      totalAudioHours: Math.round((totalAudioSeconds / 3600) * 10) / 10,
      avgReadingProgress:
        inProgressCount > 0 ? Math.round(progressSum / inProgressCount) : 0,
      finishedThisMonth,
      topGenres: [...genreCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([genre, count]) => ({ genre, count })),
      topTags: [...tagCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([tag, count]) => ({ tag, count })),
    };
  }

  /** Resolves the shelf ID array into Shelf objects */
  private async resolveShelves(shelfIds?: string[]): Promise<Shelf[]> {
    if (!shelfIds || shelfIds.length === 0) return [];
    return this.shelvesRepo.findBy({ id: In(shelfIds) });
  }
}
