// Enumerations of possible reading statuses for books in the library
export type ReadingStatus = 'unread' | 'in_progress' | 'finished' | 'abandoned';

// Mapping of reading statuses to human-readable labels
export const ReadingStatusLabels: Record<ReadingStatus, string> = {
  unread: 'Do przeczytania',
  in_progress: 'W trakcie',
  finished: 'Przeczytana',
  abandoned: 'Porzucona'
};

// Mapping of reading statuses to color codes for UI representation
export const ReadingStatusColors: Record<
  ReadingStatus,
  'default' | 'info' | 'success' | 'warning'
> = {
  unread: 'default',
  in_progress: 'info',
  finished: 'success',
  abandoned: 'warning'
};

// Main interface representing a book in the library system, including all relevant metadata and status information
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
}

export type UpdateBookPayload = Partial<CreateBookPayload>;

export interface UpdateProgressPayload {
  currentPage?: number;
  progressPercent?: number;
}

// Statistics about the library, including total number of books, distribution by reading status, average rating, total pages read, and top genres. This interface defines the structure of the data returned by the API when fetching library statistics.
export interface LibraryStats {
  total: number;
  byStatus: Record<ReadingStatus, number>;
  avgRating: number | null;
  totalPagesRead: number;
  topGenres: Array<{ genre: string; count: number }>;
}

// Interface representing a book recommendation, which includes the recommended book, a relevance score, and a list of features that matched the user's preferences. This structure is used to present personalized book suggestions to users based on their reading history and preferences.
export interface Recommendation {
  book: Book;
  score: number;
  matchedFeatures: string[];
}

// Interface for query parameters when fetching a list of books, allowing for filtering by search term, reading status, genre, and sorting options. This defines the structure of the parameters that can be sent to the API to retrieve a filtered and sorted list of books from the library.
export interface BooksQueryParams {
  search?: string;
  status?: ReadingStatus;
  genre?: string;
  sortBy?: 'title' | 'author' | 'rating' | 'createdAt' | 'status';
  order?: 'ASC' | 'DESC';
}
