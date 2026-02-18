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

// ── Konfiguracja instancji Axios ──────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Interceptor odpowiedzi – normalizuje błędy do czytelnych komunikatów.
 * W produkcji można tu podpiąć globalny toast (Snackbar z MUI).
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string | string[] }>) => {
    const serverMessage = error.response?.data?.message;
    const humanMessage = Array.isArray(serverMessage)
      ? serverMessage.join(', ')
      : (serverMessage ?? error.message);
    // Rzucamy nowy Error z czytelnym komunikatem
    return Promise.reject(new Error(humanMessage));
  },
);

// ── Książki ──────────────────────────────────────────────────────────

/** Pobiera listę książek z opcjonalnymi filtrami */
export const fetchBooks = async (params?: BooksQueryParams): Promise<Book[]> => {
  const { data } = await api.get<Book[]>('/books', { params });
  return data;
};

/** Pobiera szczegóły jednej książki */
export const fetchBook = async (id: string): Promise<Book> => {
  const { data } = await api.get<Book>(`/books/${id}`);
  return data;
};

/** Dodaje nową książkę do biblioteki */
export const createBook = async (payload: CreateBookPayload): Promise<Book> => {
  const { data } = await api.post<Book>('/books', payload);
  return data;
};

/** Aktualizuje metadane książki */
export const updateBook = async (id: string, payload: UpdateBookPayload): Promise<Book> => {
  const { data } = await api.patch<Book>(`/books/${id}`, payload);
  return data;
};

/** Aktualizuje postęp czytania */
export const updateProgress = async (id: string, payload: UpdateProgressPayload): Promise<Book> => {
  const { data } = await api.patch<Book>(`/books/${id}/progress`, payload);
  return data;
};

/** Usuwa książkę */
export const deleteBook = async (id: string): Promise<void> => {
  await api.delete(`/books/${id}`);
};

// ── Podgląd metadanych Google Books ──────────────────────────────────

/** Pobiera metadane z Google Books (bez zapisu) – wypełnia formularz */
export const previewMetadata = async (query: string): Promise<Partial<Book> | null> => {
  try {
    const { data } = await api.post<Partial<Book>>('/books/fetch-metadata', { query });
    return data;
  } catch {
    return null; // błąd sieci = nie blokujemy użytkownika
  }
};

// ── Statystyki i rekomendacje ─────────────────────────────────────────

export const fetchStats = async (): Promise<LibraryStats> => {
  const { data } = await api.get<LibraryStats>('/books/stats');
  return data;
};

export const fetchRecommendations = async (): Promise<Recommendation[]> => {
  const { data } = await api.get<Recommendation[]>('/books/recommendations');
  return data;
};
