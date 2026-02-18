/**
 * types/index.ts
 * ──────────────
 * Wspólne typy TypeScript używane w całym frontendzie.
 * Odzwierciedlają struktury danych zwracane przez REST API backendu.
 */

// ── Enumeracja statusów czytania ──────────────────────────────────────
export type ReadingStatus = 'unread' | 'in_progress' | 'finished' | 'abandoned';

/** Polskie etykiety statusów do wyświetlenia w UI */
export const ReadingStatusLabels: Record<ReadingStatus, string> = {
  unread: 'Do przeczytania',
  in_progress: 'W trakcie',
  finished: 'Przeczytana',
  abandoned: 'Porzucona',
};

/** Kolory MUI dla każdego statusu */
export const ReadingStatusColors: Record<
  ReadingStatus,
  'default' | 'info' | 'success' | 'warning'
> = {
  unread: 'default',
  in_progress: 'info',
  finished: 'success',
  abandoned: 'warning',
};

// ── Model książki ─────────────────────────────────────────────────────
export interface Book {
  id: string;
  title: string;
  author: string;
  series: string | null;
  seriesNumber: number | null;
  isbn: string | null;
  description: string | null;
  coverUrl: string | null;
  publishedYear: number | null;
  publisher: string | null;
  totalPages: number | null;
  genres: string[] | null;
  tags: string[] | null;
  status: ReadingStatus;
  currentPage: number;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

// ── DTO do tworzenia / aktualizacji ──────────────────────────────────
export interface CreateBookPayload {
  title: string;
  author: string;
  series?: string;
  seriesNumber?: number;
  isbn?: string;
  description?: string;
  coverUrl?: string;
  publishedYear?: number;
  publisher?: string;
  totalPages?: number;
  genres?: string[];
  tags?: string[];
  status?: ReadingStatus;
  currentPage?: number;
  rating?: number;
}

export type UpdateBookPayload = Partial<CreateBookPayload>;

export interface UpdateProgressPayload {
  currentPage?: number;
  progressPercent?: number;
}

// ── Statystyki ───────────────────────────────────────────── ───────────
export interface LibraryStats {
  total: number;
  byStatus: Record<ReadingStatus, number>;
  avgRating: number | null;
  totalPagesRead: number;
  topGenres: Array<{ genre: string; count: number }>;
}

// ── Rekomendacje ──────────────────────────────────────────────────────
export interface Recommendation {
  book: Book;
  score: number;
  matchedFeatures: string[];
}

// ── Parametry zapytań do API ──────────────────────────────────────────
export interface BooksQueryParams {
  search?: string;
  status?: ReadingStatus;
  genre?: string;
  sortBy?: 'title' | 'author' | 'rating' | 'createdAt' | 'status';
  order?: 'ASC' | 'DESC';
}
