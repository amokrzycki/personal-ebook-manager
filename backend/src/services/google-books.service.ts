import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Book } from '../entities/book.entity';

// Google Books API types
interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    description?: string;
    publisher?: string;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    industryIdentifiers?: Array<{ type: string; identifier: string }>;
  };
}

interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBooksVolume[];
}

// Open Library API types
interface OLNamedEntity {
  name: string;
}

// Open Library returns cover URLs in three sizes
interface OLCover {
  large?: string;
  medium?: string;
  small?: string;
}

// Open Library Books API returns a flat structure with optional fields, many of which can be missing
interface OpenLibraryBookData {
  title?: string;
  authors?: OLNamedEntity[];
  publishers?: OLNamedEntity[];
  publish_date?: string;
  number_of_pages?: number;
  cover?: OLCover;

  /**
   * Subjects can be either a string or an object {name, url}.
   * In practice, jscmd=data returns objects, but defensively we support both.
   */
  subjects?: Array<OLNamedEntity | string>;
  /**
   * Notes can be a plain string or an object of {type, value}.
   */
  notes?: string | { type: string; value: string };
}

/**
 * The /api/books response is a bibkey map → OpenLibraryBookData.
 * E.g. { "ISBN:9788375780635": { title: "...", ... } }
 */
type OpenLibraryBooksResponse = Record<string, OpenLibraryBookData>;

// ── Serwis ───────────────────────────────────────────────────────────

@Injectable()
export class GoogleBooksService {
  private readonly logger = new Logger(GoogleBooksService.name);
  private readonly http: AxiosInstance;
  private readonly olHttp: AxiosInstance;
  private readonly apiKey?: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GOOGLE_BOOKS_API_KEY');

    this.http = axios.create({
      baseURL: 'https://www.googleapis.com/books/v1',
      timeout: 10_000,
    });

    this.olHttp = axios.create({
      baseURL: 'https://openlibrary.org',
      timeout: 10_000,
    });
  }

  /**
   * Retrieves metadata for a single book by ISBN or title.
   * If Google Books doesn't find a match for the ISBN, it tries Open Library.
   */
  async fetchMetadata(query: string): Promise<Partial<Book> | null> {
    const isIsbn = /^[\d-]{10,17}$/.test(query.trim());

    const gbResult = await this.fetchFromGoogleBooks(
      isIsbn ? `isbn:${query}` : `intitle:${query}`,
    );
    if (gbResult) return gbResult;

    if (isIsbn) {
      this.logger.log(
        `Google Books: brak wyników dla ISBN ${query}, próbuję Open Library…`,
      );
      return this.fetchFromOpenLibrary(query);
    }

    return null;
  }

  /**
   * Searches for books by genre – used by the recommendation engine
   * to generate external suggestions when the local database is empty.
   */
  async searchByGenre(genre: string): Promise<Partial<Book>[]> {
    try {
      const params: Record<string, string> = {
        q: `subject:${genre}`,
        maxResults: '8',
        orderBy: 'relevance',
        printType: 'books',
      };
      if (this.apiKey) params.key = this.apiKey;

      const { data } = await this.http.get<GoogleBooksResponse>('/volumes', {
        params,
      });

      // mapVolume always returns Partial<Book> (never null)
      // so filter(Boolean) is unnecessary – we iterate directly
      return (data.items ?? []).map((v) => this.mapVolume(v));
    } catch (e) {
      this.logger.error(
        `searchByGenre("${genre}") failed: ${(e as Error).message}`,
      );
      return [];
    }
  }

  // Private methods
  private async fetchFromGoogleBooks(q: string): Promise<Partial<Book> | null> {
    try {
      const params: Record<string, string> = { q, maxResults: '1' };
      if (this.apiKey) params.key = this.apiKey;

      const { data } = await this.http.get<GoogleBooksResponse>('/volumes', {
        params,
      });
      if (!data.totalItems || !data.items?.length) return null;
      return this.mapVolume(data.items[0]);
    } catch (e) {
      this.logger.error(`Google Books error: ${(e as Error).message}`);
      return null;
    }
  }

  /**
   * Fallback: Open Library Books API.
   * Endpoint: /api/books?bibkeys=ISBN:...&format=json&jscmd=data
   *
   * We type the response as OpenLibraryBooksResponse instead of relying
   * on the default `any` from Axios – this eliminates all unsafe-member-access.
   */
  private async fetchFromOpenLibrary(
    isbn: string,
  ): Promise<Partial<Book> | null> {
    try {
      const cleanIsbn = isbn.replace(/-/g, '');

      const { data } = await this.olHttp.get<OpenLibraryBooksResponse>(
        '/api/books',
        {
          params: {
            bibkeys: `ISBN:${cleanIsbn}`,
            format: 'json',
            jscmd: 'data',
          },
        },
      );

      const book: OpenLibraryBookData | undefined = data[`ISBN:${cleanIsbn}`];
      if (!book) return null;

      // Cover: We prefer the highest resolution
      const coverUrl: string | undefined =
        book.cover?.large ?? book.cover?.medium ?? book.cover?.small;

      // Subjects can be a string or an object {name}
      const genres: string[] = (book.subjects ?? [])
        .slice(0, 5)
        .map((s: OLNamedEntity | string) =>
          typeof s === 'string' ? s : s.name,
        );

      // Authors as a comma-separated list of names
      const author =
        (book.authors ?? []).map((a) => a.name).join(', ') || undefined;

      // Year from the publish_date field (can be "2001", "June 2001", "2001-06-15")
      const publishedYear: number | undefined = book.publish_date
        ? parseInt(book.publish_date.slice(-4), 10) || undefined
        : undefined;

      // Notes can be a string or an object {type, value}
      const description: string | undefined = book.notes
        ? typeof book.notes === 'string'
          ? book.notes
          : book.notes.value
        : undefined;

      return {
        title: book.title,
        author,
        coverUrl,
        publisher: book.publishers?.[0]?.name,
        publishedYear,
        totalPages: book.number_of_pages,
        genres: genres.length > 0 ? genres : undefined,
        isbn: cleanIsbn,
        description,
      };
    } catch (e) {
      this.logger.error(`Open Library error: ${(e as Error).message}`);
      return null;
    }
  }

  /** Maps a volume from the Google Books API to the internal Book structure */
  private mapVolume(volume: GoogleBooksVolume): Partial<Book> {
    const info = volume.volumeInfo;

    const isbn13 = info.industryIdentifiers?.find(
      (i) => i.type === 'ISBN_13',
    )?.identifier;
    const isbn10 = info.industryIdentifiers?.find(
      (i) => i.type === 'ISBN_10',
    )?.identifier;

    const publishedYear: number | undefined = info.publishedDate
      ? parseInt(info.publishedDate.split('-')[0], 10) || undefined
      : undefined;

    // Force HTTPS - Google Books sometimes returns HTTP
    const rawCover =
      info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
    const coverUrl = rawCover?.replace(/^http:\/\//, 'https://');

    return {
      title: info.title,
      author: info.authors?.join(', '),
      description: info.description,
      publisher: info.publisher,
      publishedYear,
      totalPages: info.pageCount,
      genres: info.categories,
      coverUrl,
      isbn: isbn13 ?? isbn10,
    };
  }
}
