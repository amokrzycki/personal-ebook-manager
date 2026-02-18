import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useBooks } from '../hooks/useBooks';
import { ReadingStatusLabels } from '../types';
import type { Book, CreateBookPayload, ReadingStatus } from '../types';
import { AddBookDialog } from './AddBookDialog';
import { BookCard } from './BookCard';
import { ProgressDialog } from './ProgressDialog';

/** Typ stanu modali */
type DialogState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'edit'; book: Book }
  | { type: 'progress'; book: Book }
  | { type: 'delete'; book: Book };

export const BookShelf = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | ''>('');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'rating' | 'createdAt'>('createdAt');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' });
  const [actionError, setActionError] = useState<string | null>(null);

  // Debounce wyszukiwania (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { books, loading, error, addBook, editBook, removeBook, updateBookProgress, refresh } =
    useBooks();

  // Odśwież listę gdy zmienią się parametry filtrów/sortowania
  useEffect(() => {
    refresh({
      search: debouncedSearch || undefined,
      status: (statusFilter as ReadingStatus) || undefined,
      sortBy,
      order,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, sortBy, order]);

  const handleAdd = useCallback(
    async (payload: CreateBookPayload) => {
      setActionError(null);
      await addBook(payload);
    },
    [addBook],
  );

  const handleEdit = useCallback(
    async (payload: CreateBookPayload) => {
      if (dialog.type !== 'edit') return;
      setActionError(null);
      await editBook(dialog.book.id, payload);
    },
    [dialog, editBook],
  );

  const handleDelete = useCallback(async () => {
    if (dialog.type !== 'delete') return;
    setActionError(null);
    try {
      await removeBook(dialog.book.id);
      setDialog({ type: 'none' });
    } catch (err) {
      setActionError((err as Error).message);
    }
  }, [dialog, removeBook]);

  const handleProgressSave = useCallback(
    async (bookId: string, currentPage: number) => {
      await updateBookProgress(bookId, { currentPage });
    },
    [updateBookProgress],
  );

  return (
    <Box>
      {/* ── Pasek narzędzi (filtry + dodaj) ─────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Wyszukiwarka */}
        <TextField
          size="small"
          placeholder="Szukaj tytułu lub autora…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* Filtr statusu */}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>
            <FilterListIcon sx={{ fontSize: 16, mr: 0.5 }} />
            Status
          </InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value as ReadingStatus | '')}
          >
            <MenuItem value="">Wszystkie</MenuItem>
            {(Object.keys(ReadingStatusLabels) as ReadingStatus[]).map((s) => (
              <MenuItem key={s} value={s}>
                {ReadingStatusLabels[s]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Sortowanie */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>
            <SortIcon sx={{ fontSize: 16, mr: 0.5 }} />
            Sortuj
          </InputLabel>
          <Select
            value={sortBy}
            label="Sortuj"
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <MenuItem value="createdAt">Data dodania</MenuItem>
            <MenuItem value="title">Tytuł</MenuItem>
            <MenuItem value="author">Autor</MenuItem>
            <MenuItem value="rating">Ocena</MenuItem>
          </Select>
        </FormControl>

        {/* Kierunek sortowania */}
        <ToggleButtonGroup
          size="small"
          value={order}
          exclusive
          onChange={(_, v) => v && setOrder(v)}
        >
          <ToggleButton value="DESC">↓</ToggleButton>
          <ToggleButton value="ASC">↑</ToggleButton>
        </ToggleButtonGroup>

        {/* Przycisk Dodaj */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialog({ type: 'add' })}
          sx={{ ml: 'auto' }}
        >
          Dodaj książkę
        </Button>
      </Box>

      {/* ── Lista błędów ─────────────────────────────────────────────── */}
      {(error || actionError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error ?? actionError}
        </Alert>
      )}

      {/* ── Siatka kart ─────────────────────────────────────────────── */}
      {loading ? (
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => (
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 4,
                lg: 3,
              }}
              key={i}
            >
              <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : books.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography variant="h5" gutterBottom>
            Półka jest pusta
          </Typography>
          <Typography>
            Kliknij „Dodaj książkę", aby rozpocząć budowanie swojej biblioteki.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {books.map((book) => (
            <Grid
              size={{
                xs: 12,
                sm: 6,
                md: 4,
                lg: 3,
              }}
              key={book.id}
            >
              <BookCard
                book={book}
                onEditProgress={(b) => setDialog({ type: 'progress', book: b })}
                onEditDetails={(b) => setDialog({ type: 'edit', book: b })}
                onDelete={(b) => setDialog({ type: 'delete', book: b })}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Modale ──────────────────────────────────────────────────── */}

      {/* Dialog dodawania */}
      <AddBookDialog
        open={dialog.type === 'add'}
        onClose={() => setDialog({ type: 'none' })}
        onSubmit={handleAdd}
      />

      {/* Dialog edycji */}
      <AddBookDialog
        open={dialog.type === 'edit'}
        editBook={dialog.type === 'edit' ? dialog.book : null}
        onClose={() => setDialog({ type: 'none' })}
        onSubmit={handleEdit}
      />

      {/* Dialog postępu */}
      <ProgressDialog
        open={dialog.type === 'progress'}
        book={dialog.type === 'progress' ? dialog.book : null}
        onClose={() => setDialog({ type: 'none' })}
        onSave={handleProgressSave}
      />

      {/* Potwierdzenie usuwania */}
      <Dialog open={dialog.type === 'delete'} onClose={() => setDialog({ type: 'none' })}>
        <DialogTitle>Usuń książkę</DialogTitle>
        <DialogContent>
          <Typography>
            Czy na pewno chcesz usunąć{' '}
            <strong>{dialog.type === 'delete' ? `"${dialog.book.title}"` : ''}</strong> z
            biblioteki? Tej operacji nie można cofnąć.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ type: 'none' })}>Anuluj</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Usuń
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
