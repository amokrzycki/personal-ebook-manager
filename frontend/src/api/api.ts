import axios, { AxiosError } from 'axios';
import type {
  BooksQueryParams,
  Book,
  CreateBookPayload,
  UpdateBookPayload,
  UpdateProgressPayload,
  LibraryStats, Recommendation, Shelf, CreateShelfPayload
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ message?: string | string[] }>) => {
    const msg = error.response?.data?.message;
    const human = Array.isArray(msg) ? msg.join(', ') : msg ?? error.message;
    return Promise.reject(new Error(human));
  }
);

// Books
export const fetchBooks = async (params?: BooksQueryParams): Promise<Book[]> => {
  const { data } = await api.get<Book[]>('/books', { params });
  return data;
};

export const fetchBook = async (id: string): Promise<Book> => {
  const { data } = await api.get<Book>(`/books/${id}`);
  return data;
};

export const createBook = async (payload: CreateBookPayload): Promise<Book> => {
  const { data } = await api.post<Book>('/books', payload);
  return data;
};

export const updateBook = async (id: string, payload: UpdateBookPayload): Promise<Book> => {
  const { data } = await api.patch<Book>(`/books/${id}`, payload);
  return data;
};

export const updateProgress = async (id: string, payload: UpdateProgressPayload): Promise<Book> => {
  const { data } = await api.patch<Book>(`/books/${id}/progress`, payload);
  return data;
};

export const deleteBook = async (id: string): Promise<void> => {
  await api.delete(`/books/${id}`);
};

export const previewMetadata = async (query: string): Promise<Partial<Book> | null> => {
  try {
    const { data } = await api.post<Partial<Book>>('/books/fetch-metadata', { query });
    return data;
  } catch {
    return null;
  }
};

// Stats & Recommendations

export const fetchStats = async (): Promise<LibraryStats> => {
  const { data } = await api.get<LibraryStats>('/books/stats');
  return data;
};

export const fetchRecommendations = async (): Promise<Recommendation[]> => {
  const { data } = await api.get<Recommendation[]>('/books/recommendations');
  return data;
};

// Shelves
export const fetchShelves = async (): Promise<Shelf[]> => {
  const { data } = await api.get<Shelf[]>('/shelves');
  return data;
};

export const fetchShelf = async (id: string): Promise<Shelf> => {
  const { data } = await api.get<Shelf>(`/shelves/${id}`);
  return data;
};

export const createShelf = async (payload: CreateShelfPayload): Promise<Shelf> => {
  const { data } = await api.post<Shelf>('/shelves', payload);
  return data;
};

export const updateShelf = async (id: string, payload: Partial<CreateShelfPayload>): Promise<Shelf> => {
  const { data } = await api.patch<Shelf>(`/shelves/${id}`, payload);
  return data;
};

export const deleteShelf = async (id: string): Promise<void> => {
  await api.delete(`/shelves/${id}`);
};

export const addBookToShelf = async (shelfId: string, bookId: string): Promise<Shelf> => {
  const { data } = await api.post<Shelf>(`/shelves/${shelfId}/books/${bookId}`);
  return data;
};

export const removeBookFromShelf = async (shelfId: string, bookId: string): Promise<Shelf> => {
  const { data } = await api.delete<Shelf>(`/shelves/${shelfId}/books/${bookId}`);
  return data;
};
