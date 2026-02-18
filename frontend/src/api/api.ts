import axios, { AxiosError } from 'axios';
import type {
  BooksQueryParams,
  Book,
  CreateBookPayload,
  UpdateBookPayload,
  UpdateProgressPayload,
  LibraryStats,
  Recommendation,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Response interceptor module – normalizes errors into readable messages.
 * In a production environment, a global toast message (Snackbar from MUI) can be connected here.
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string | string[] }>) => {
    const serverMessage = error.response?.data?.message;
    const humanMessage = Array.isArray(serverMessage)
      ? serverMessage.join(', ')
      : (serverMessage ?? error.message);
    // We throw a new Error with a clear message
    return Promise.reject(new Error(humanMessage));
  },
);

/** Retrieves a list of books with optional filters */
export const fetchBooks = async (params?: BooksQueryParams): Promise<Book[]> => {
  const { data } = await api.get<Book[]>('/books', { params });
  return data;
};

/** Retrieves details of a single book */
export const fetchBook = async (id: string): Promise<Book> => {
  const { data } = await api.get<Book>(`/books/${id}`);
  return data;
};

/** Adds a new book to the library */
export const createBook = async (payload: CreateBookPayload): Promise<Book> => {
  const { data } = await api.post<Book>('/books', payload);
  return data;
};

/** Aktualizuje metadane książki */
export const updateBook = async (id: string, payload: UpdateBookPayload): Promise<Book> => {
  const { data } = await api.patch<Book>(`/books/${id}`, payload);
  return data;
};

/** Updates book metadata */
export const updateProgress = async (id: string, payload: UpdateProgressPayload): Promise<Book> => {
  const { data } = await api.patch<Book>(`/books/${id}/progress`, payload);
  return data;
};

/** Deletes a book */
export const deleteBook = async (id: string): Promise<void> => {
  await api.delete(`/books/${id}`);
};

/** Retrieves metadata from Google Books (without saving) – fills out the form */
export const previewMetadata = async (query: string): Promise<Partial<Book> | null> => {
  try {
    const { data } = await api.post<Partial<Book>>('/books/fetch-metadata', { query });
    return data;
  } catch {
    return null; // network error = we do not block the user
  }
};

export const fetchStats = async (): Promise<LibraryStats> => {
  const { data } = await api.get<LibraryStats>('/books/stats');
  return data;
};

export const fetchRecommendations = async (): Promise<Recommendation[]> => {
  const { data } = await api.get<Recommendation[]>('/books/recommendations');
  return data;
};
