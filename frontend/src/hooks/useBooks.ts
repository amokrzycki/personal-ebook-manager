import { useCallback, useEffect, useState } from 'react';
import * as api from '../api/api';
import type {
  BooksQueryParams,
  Book,
  UpdateProgressPayload,
  LibraryStats,
  Recommendation,
  Shelf,
  CreateShelfPayload, CreateBookPayload, UpdateBookPayload
} from '../types';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useBooks(initialParams?: BooksQueryParams) {
  const [state, setState] = useState<AsyncState<Book[]>>({ data: null, loading: true, error: null });
  const [params, setParams] = useState<BooksQueryParams>(initialParams ?? {});

  const load = useCallback(async (p?: BooksQueryParams) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const books = await api.fetchBooks(p ?? params);
      setState({ data: books, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, [params]);

  useEffect(() => {
    load();
  }, []);

  const refresh = useCallback((newParams?: BooksQueryParams) => {
    const merged = { ...params, ...newParams };
    setParams(merged);
    return load(merged);
  }, [params, load]);

  const addBook = useCallback(async (payload: CreateBookPayload) => {
    const book = await api.createBook(payload);
    await load();
    return book;
  }, [load]);

  const editBook = useCallback(async (id: string, payload: UpdateBookPayload) => {
    const book = await api.updateBook(id, payload);
    await load();
    return book;
  }, [load]);

  const removeBook = useCallback(async (id: string) => {
    await api.deleteBook(id);
    await load();
  }, [load]);

  const updateBookProgress = useCallback(async (id: string, payload: UpdateProgressPayload) => {
    // Optimistic update
    setState((s) => ({
      ...s,
      data: s.data?.map((b) => {
        if (b.id !== id) return b;
        const updatedPage = payload.currentPage ?? b.currentPage;
        const updatedAudio = payload.audioProgressSeconds ?? b.audioProgressSeconds;
        return { ...b, currentPage: updatedPage, audioProgressSeconds: updatedAudio };
      }) ?? null
    }));
    try {
      await api.updateProgress(id, payload);
      await load();
    } catch (err) {
      await load();
      throw err;
    }
  }, [load]);

  return {
    books: state.data ?? [], loading: state.loading, error: state.error,
    refresh, addBook, editBook, removeBook, updateBookProgress
  };
}

// ── Hook: statystyki ─────────────────────────────────────────────────

export function useStats() {
  const [state, setState] = useState<AsyncState<LibraryStats>>({ data: null, loading: true, error: null });
  useEffect(() => {
    api.fetchStats()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => setState({ data: null, loading: false, error: (err as Error).message }));
  }, []);
  return state;
}

// ── Hook: rekomendacje ────────────────────────────────────────────────

export function useRecommendations() {
  const [state, setState] = useState<AsyncState<Recommendation[]>>({ data: null, loading: true, error: null });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    api.fetchRecommendations()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => setState({ data: null, loading: false, error: (err as Error).message }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  return { ...state, recommendations: state.data ?? [], refresh: load };
}

// ── Hook: półki ───────────────────────────────────────────────────────

export function useShelves() {
  const [state, setState] = useState<AsyncState<Shelf[]>>({ data: null, loading: true, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const shelves = await api.fetchShelves();
      setState({ data: shelves, loading: false, error: null });
    } catch (err) {
      setState({ data: null, loading: false, error: (err as Error).message });
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  const addShelf = useCallback(async (payload: CreateShelfPayload) => {
    const shelf = await api.createShelf(payload);
    await load();
    return shelf;
  }, [load]);

  const editShelf = useCallback(async (id: string, payload: Partial<CreateShelfPayload>) => {
    const shelf = await api.updateShelf(id, payload);
    await load();
    return shelf;
  }, [load]);

  const removeShelf = useCallback(async (id: string) => {
    await api.deleteShelf(id);
    await load();
  }, [load]);

  const addBook = useCallback(async (shelfId: string, bookId: string) => {
    await api.addBookToShelf(shelfId, bookId);
    await load();
  }, [load]);

  const removeBook = useCallback(async (shelfId: string, bookId: string) => {
    await api.removeBookFromShelf(shelfId, bookId);
    await load();
  }, [load]);

  return {
    shelves: state.data ?? [], loading: state.loading, error: state.error,
    refresh: load, addShelf, editShelf, removeShelf, addBook, removeBook
  };
}
