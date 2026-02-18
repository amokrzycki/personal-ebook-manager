import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Book } from '../entities/book.entity';

/** Structure of the volume returned by the Google Books API */
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
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type: 'ISBN_10' | 'ISBN_13' | string;
      identifier: string;
    }>;
  };
}

interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBooksVolume[];
}

@Injectable()
export class GoogleBooksService {
  private readonly logger = new Logger(GoogleBooksService.name);
  private readonly http: AxiosInstance;
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GOOGLE_BOOKS_API_KEY');

    // Create a dedicated Axios instance with a base URL and a timeout of 10 seconds.
    this.http = axios.create({
      baseURL: 'https://www.googleapis.com/books/v1',
      timeout: 10_000,
    });
  }

   /**
   * Searches for a book by ISBN (preferred) or title and returns
   * a partial Book object ready to be merged with user data.
   *
   * @param query - ISBN (10 or 13 digits) or any title string
   * @returns Partial<Book> or null if nothing is found
   */
  async fetchMetadata(query: string): Promise<Partial<Book> | null> {
    try {
      // Distinguish between ISBN queries (only numbers + hyphens, if applicable) and title queries.
      const isIsbn = /^[\d\-]{10,17}$/.test(query.trim());
      const q = isIsbn ? `isbn:${query}` : `intitle:${query}`;

      const params: Record<string, string> = { q, maxResults: '1' };
      if (this.apiKey) params.key = this.apiKey;

      const { data } = await this.http.get<GoogleBooksResponse>('/volumes', { params });

      if (!data.totalItems || !data.items?.length) {
        this.logger.warn(`Google Books: brak wyników dla zapytania "${query}"`);
        return null;
      }

      return this.mapVolumeToBook(data.items[0]);
    } catch (err) {
      // Log the error, but we do NOT throw an exception – metadata retrieval
      // is a helper function and should not block the addition of a book.
      this.logger.error(`Google Books API error: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Maps a volume from the Google Books API to the internal Book structure.
   * We ignore fields that the API does not provide (e.g., series).
   */
  private mapVolumeToBook(volume: GoogleBooksVolume): Partial<Book> {
    const info = volume.volumeInfo;

    // Try to extract ISBN-13, and if it is missing, ISBN-10.
    const isbn13 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier;
    const isbn10 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_10')?.identifier;

    // The publication date can be in the format “2001,” “2001-06,” or “2001-06-15.”
    const publishedYear = info.publishedDate
      ? parseInt(info.publishedDate.split('-')[0], 10)
      : undefined;

    // Cover: we prefer higher resolution (thumbnail > smallThumbnail)
    // and replace http:// with https:// for security reasons
    const rawCover = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
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
