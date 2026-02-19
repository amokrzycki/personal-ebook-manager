import { useCallback, useEffect, useState } from 'react';
import type {
  BooksQueryParams,
  Book,
  CreateBookPayload,
  UpdateBookPayload,
  UpdateProgressPayload,
  LibraryStats,
  Recommendation
} from '../types';
import * as api from '../api/api';

// Common state for data hooks
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Hook: list of books
export function useBooks(initialParams?: BooksQueryParams) {
  const [state, setState] = useState<AsyncState<Book[]>>({
    data: null,
    loading: true,
    error: null
  });
  const [params, setParams] = useState<BooksQueryParams>(initialParams ?? {});

  const load = useCallback(
    async (queryParams?: BooksQueryParams) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const books = await api.fetchBooks(queryParams ?? params);
        setState({ data: books, loading: false, error: null });
      } catch (err) {
        setState({ data: null, loading: false, error: (err as Error).message });
      }
    },
    [params]
  );

  useEffect(() => {
    load();
  }, [load]);

  /** Refreshes the list with new query parameters */
  const refresh = useCallback(
    (newParams?: BooksQueryParams) => {
      const merged = { ...params, ...newParams };
      setParams(merged);
      return load(merged);
    },
    [params, load]
  );

  /** Adds a book and refreshes the list */
  const addBook = useCallback(
    async (payload: CreateBookPayload): Promise<Book> => {
      const book = await api.createBook(payload);
      await load();
      return book;
    },
    [load]
  );

  /** Updates metadata and refreshes the list */
  const editBook = useCallback(
    async (id: string, payload: UpdateBookPayload): Promise<Book> => {
      const book = await api.updateBook(id, payload);
      await load();
      return book;
    },
    [load]
  );

  /** Deletes the book and refreshes the list */
  const removeBook = useCallback(
    async (id: string): Promise<void> => {
      await api.deleteBook(id);
      await load();
    },
    [load]
  );

  /** Updates reading progress locally (optimistic update) + sync with API */
  const updateBookProgress = useCallback(
    async (id: string, payload: UpdateProgressPayload): Promise<void> => {
      // Optimistic update
      setState((s) => ({
        ...s,
        data:
          s.data?.map((b) => {
            if (b.id !== id) return b;
            const updatedPage =
              payload.currentPage ??
              (payload.progressPercent && b.totalPages
                ? Math.round((payload.progressPercent / 100) * b.totalPages)
                : b.currentPage);
            return { ...b, currentPage: updatedPage };
          }) ?? null
      }));

      // Sync z API w tle
      try {
        await api.updateProgress(id, payload);
        await load();
      } catch (err) {
        // Przy błędzie cofamy optimistic update
        await load();
        throw err;
      }
    },
    [load]
  );

  return {
    books: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh,
    addBook,
    editBook,
    removeBook,
    updateBookProgress
  };
}

// Hook: statystyki biblioteki

export function useStats() {
  const [state, setState] = useState<AsyncState<LibraryStats>>({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    api
      .fetchStats()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => setState({ data: null, loading: false, error: (err as Error).message }));
  }, []);

  return state;
}

// Hook: rekomendacje

export function useRecommendations() {
  const [state, setState] = useState<AsyncState<Recommendation[]>>({
    data: null,
    loading: true,
    error: null
  });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    api
      .fetchRecommendations()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => setState({ data: null, loading: false, error: (err as Error).message }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, recommendations: state.data ?? [], refresh: load };
}
