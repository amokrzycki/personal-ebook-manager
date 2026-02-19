export type BookFormat = 'epub' | 'mobi' | 'pdf' | 'azw' | 'cbr' | 'cbz' | 'mp3' | 'm4b' | 'other';

export const AUDIO_FORMATS: BookFormat[] = ['mp3', 'm4b'];

export const BookFormatLabels: Record<BookFormat, string> = {
  epub: 'EPUB', mobi: 'MOBI', pdf: 'PDF',
  azw: 'AZW', cbr: 'CBR', cbz: 'CBZ',
  mp3: 'MP3 Audio', m4b: 'M4B Audio', other: 'Inny'
};

/** Kolory chipów formatów */
export const BookFormatColors: Record<BookFormat, string> = {
  epub: '#4A90D9', mobi: '#7B68EE', pdf: '#E74C3C',
  azw: '#F39C12', cbr: '#27AE60', cbz: '#16A085',
  mp3: '#8E44AD', m4b: '#6C3483', other: '#7F8C8D'
};

// ── Statusy czytania ────────────────────────────────────────────────

export type ReadingStatus = 'unread' | 'in_progress' | 'finished' | 'abandoned';

export const ReadingStatusLabels: Record<ReadingStatus, string> = {
  unread: 'Do przeczytania',
  in_progress: 'W trakcie',
  finished: 'Przeczytana',
  abandoned: 'Porzucona'
};

export const ReadingStatusColors: Record<ReadingStatus, 'default' | 'info' | 'success' | 'warning'> = {
  unread: 'default', in_progress: 'info', finished: 'success', abandoned: 'warning'
};

// ── Wirtualna półka ─────────────────────────────────────────────────

export interface Shelf {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  bookCount?: number;
  books?: Book[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateShelfPayload {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

// ── Model książki ───────────────────────────────────────────────────

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
  format: BookFormat;
  audioDurationSeconds: number | null;
  audioProgressSeconds: number;
  readingProgressPercent: number;
  audioProgressPercent: number;
  isAudiobook: boolean;
  shelves: Shelf[];
  createdAt: string;
  updatedAt: string;
}

// Interfaces for payloads used when creating or updating books, as well as updating reading progress. These define the expected structure of data sent to the API when performing these operations.
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
  format?: BookFormat;
  audioDurationSeconds?: number;
  audioProgressSeconds?: number;
  shelfIds?: string[];
}

export type UpdateBookPayload = Partial<CreateBookPayload>;

export interface UpdateProgressPayload {
  currentPage?: number;
  progressPercent?: number;
  audioProgressSeconds?: number;
}

// ── Parametry filtrowania ────────────────────────────────────────────

export interface BooksQueryParams {
  search?: string;
  status?: ReadingStatus;
  genre?: string;
  tag?: string;
  format?: BookFormat;
  author?: string;
  series?: string;
  minRating?: number;
  maxRating?: number;
  shelfId?: string;
  sortBy?: 'title' | 'author' | 'rating' | 'createdAt' | 'status' | 'format';
  order?: 'ASC' | 'DESC';
}

// ── Statystyki ───────────────────────────────────────────────────────

export interface LibraryStats {
  total: number;
  byStatus: Record<ReadingStatus, number>;
  byFormat: Record<BookFormat, number>;
  avgRating: number | null;
  totalPagesRead: number;
  totalAudioHours: number;
  avgReadingProgress: number;
  finishedThisMonth: number;
  topGenres: Array<{ genre: string; count: number }>;
  topTags: Array<{ tag: string; count: number }>;
}

// ── Rekomendacje ─────────────────────────────────────────────────────

export interface Recommendation {
  book: Book | Partial<Book>;
  score: number;
  matchedFeatures: string[];
  isExternal: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Formatuje sekundy jako HH:MM:SS lub MM:SS */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Formatuje sekundy jako "X godz. Y min." */
export function formatDurationHuman(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} godz. ${m} min.`;
  return `${m} min.`;
}
