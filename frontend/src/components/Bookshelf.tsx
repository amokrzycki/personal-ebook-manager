import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Alert, Box, Button, Chip, Collapse, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, Grid, InputAdornment, InputLabel,
  MenuItem, Select, Skeleton, Slider, TextField, ToggleButton,
  ToggleButtonGroup, Tooltip, Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useBooks, useShelves } from '../hooks/useBooks';
import {
  type Book,
  type ReadingStatus,
  type BookFormat,
  type BooksQueryParams,
  ReadingStatusLabels,
  BookFormatLabels, type CreateBookPayload, type UpdateProgressPayload
} from '../types';
import { AddBookDialog } from './AddBookDialog';
import { BookCard } from './BookCard';
import { ProgressDialog } from './ProgressDialog';

type DialogState = { type: 'none' } | { type: 'add' } | { type: 'edit'; book: Book }
  | { type: 'progress'; book: Book } | { type: 'delete'; book: Book };
type SortField = NonNullable<BooksQueryParams['sortBy']>;

export const BookShelf: React.FC = () => {
  const [search, setSearch] = useState('');
  const [debSearch, setDebSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | ''>('');
  const [formatFilter, setFormatFilter] = useState<BookFormat | ''>('');
  const [genreFilter, setGenreFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('');
  const [ratingRange, setRatingRange] = useState<[number, number]>([1, 5]);
  const [ratingEnabled, setRatingEnabled] = useState(false);
  const [shelfFilter, setShelfFilter] = useState('');
  const [sortBy, setSortBy] = useState<BooksQueryParams['sortBy']>('createdAt');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' });
  const [actionError, setActionError] = useState<string | null>(null);

  const { shelves } = useShelves();

  // Debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { books, loading, error, addBook, editBook, removeBook, updateBookProgress, refresh } = useBooks();

  // Liczba aktywnych filtrów (dla badge)
  const activeFiltersCount = [statusFilter, formatFilter, genreFilter, tagFilter, authorFilter, seriesFilter, shelfFilter, ratingEnabled].filter(Boolean).length;

  useEffect(() => {
    const params: BooksQueryParams = {
      search: debSearch || undefined,
      status: statusFilter || undefined,
      format: (formatFilter as BookFormat) || undefined,
      genre: genreFilter || undefined,
      tag: tagFilter || undefined,
      author: authorFilter || undefined,
      series: seriesFilter || undefined,
      minRating: ratingEnabled ? ratingRange[0] : undefined,
      maxRating: ratingEnabled ? ratingRange[1] : undefined,
      shelfId: shelfFilter || undefined,
      sortBy, order
    };
    refresh(params);
  }, [debSearch, statusFilter, formatFilter, genreFilter, tagFilter, authorFilter, seriesFilter, ratingRange, ratingEnabled, shelfFilter, sortBy, order]);

  const clearFilters = () => {
    setStatusFilter('');
    setFormatFilter('');
    setGenreFilter('');
    setTagFilter('');
    setAuthorFilter('');
    setSeriesFilter('');
    setRatingEnabled(false);
    setShelfFilter('');
  };

  const handleAdd = useCallback(async (p: CreateBookPayload) => {
    await addBook(p);
  }, [addBook]);
  const handleEdit = useCallback(async (p: CreateBookPayload) => {
    if (dialog.type !== 'edit') return;
    await editBook(dialog.book.id, p);
  }, [dialog, editBook]);
  const handleDelete = useCallback(async () => {
    if (dialog.type !== 'delete') return;
    try {
      await removeBook(dialog.book.id);
      setDialog({ type: 'none' });
    } catch (e) {
      setActionError((e as Error).message);
    }
  }, [dialog, removeBook]);
  const handleProgress = useCallback(async (id: string, payload: UpdateProgressPayload) => {
    await updateBookProgress(id, payload);
  }, [updateBookProgress]);

  return (
    <Box>
      {/* ── Pasek wyszukiwania + sortowania ───────────────────── */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Szukaj w tytule, autorze, opisie, serii…"
                   value={search} onChange={(e) => setSearch(e.target.value)}
                   sx={{ flexGrow: 1, minWidth: 200 }}
                   InputProps={{
                     startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                   }} />

        <Tooltip title={`Filtry${activeFiltersCount ? ` (${activeFiltersCount} aktywnych)` : ''}`}>
          <Button
            variant={activeFiltersCount > 0 ? 'contained' : 'outlined'}
            startIcon={<TuneIcon />}
            onClick={() => setFiltersOpen((o) => !o)}
            size="small"
          >
            Filtry {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
        </Tooltip>

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel><FilterListIcon sx={{ fontSize: 14, mr: 0.5 }} />Sortuj</InputLabel>
          <Select value={sortBy} label="Sortuj" onChange={(e) => setSortBy(e.target.value as SortField)}>
            <MenuItem value="createdAt">Data dodania</MenuItem>
            <MenuItem value="title">Tytuł</MenuItem>
            <MenuItem value="author">Autor</MenuItem>
            <MenuItem value="rating">Ocena</MenuItem>
            <MenuItem value="format">Format</MenuItem>
          </Select>
        </FormControl>

        <ToggleButtonGroup size="small" value={order} exclusive onChange={(_, v) => v && setOrder(v)}>
          <ToggleButton value="DESC">↓</ToggleButton>
          <ToggleButton value="ASC">↑</ToggleButton>
        </ToggleButtonGroup>

        <Button variant="contained" startIcon={<AddIcon />}
                onClick={() => setDialog({ type: 'add' })} sx={{ ml: 'auto' }}>
          Dodaj książkę
        </Button>
      </Box>

      {/* ── Panel filtrów (zwijany) ────────────────────────────── */}
      <Collapse in={filtersOpen}>
        <Box sx={{
          mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 2,
          border: '1px solid', borderColor: 'divider'
        }}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid size={{
              xs: 12, sm: 6, md: 3
            }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status"
                        onChange={(e) => setStatusFilter(e.target.value as ReadingStatus | '')}>
                  <MenuItem value="">Wszystkie</MenuItem>
                  {(Object.keys(ReadingStatusLabels) as ReadingStatus[]).map((s) => (
                    <MenuItem key={s} value={s}>{ReadingStatusLabels[s]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{
              xs: 12, sm: 6, md: 3
            }}>
              <FormControl fullWidth size="small">
                <InputLabel>Format pliku</InputLabel>
                <Select value={formatFilter} label="Format pliku"
                        onChange={(e) => setFormatFilter(e.target.value as BookFormat | '')}>
                  <MenuItem value="">Wszystkie</MenuItem>
                  {(Object.keys(BookFormatLabels) as BookFormat[]).map((f) => (
                    <MenuItem key={f} value={f}>{BookFormatLabels[f]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{
              xs: 12, sm: 6, md: 3
            }}>
              <FormControl fullWidth size="small">
                <InputLabel>Półka</InputLabel>
                <Select value={shelfFilter} label="Półka" onChange={(e) => setShelfFilter(e.target.value)}>
                  <MenuItem value="">Wszystkie</MenuItem>
                  {shelves.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      <Box component="span" sx={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: s.color,
                        mr: 1
                      }} />
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{
              xs: 12, sm: 6, md: 3
            }}>
              <TextField fullWidth size="small" label="Gatunek" placeholder="np. fantasy"
                         value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} />
            </Grid>

            <Grid size={{
              xs: 12, sm: 6, md: 3
            }}>
              <TextField fullWidth size="small" label="Tag" placeholder="np. ulubiona"
                         value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} />
            </Grid>

            <Grid size={{
              xs: 12, sm: 6, md: 3
            }}>
              <TextField fullWidth size="small" label="Autor" placeholder="np. Sapkowski"
                         value={authorFilter} onChange={(e) => setAuthorFilter(e.target.value)} />
            </Grid>

            <Grid size={{
              xs: 12, sm: 6, md: 3
            }}>
              <TextField fullWidth size="small" label="Seria" placeholder="np. Wiedźmin"
                         value={seriesFilter} onChange={(e) => setSeriesFilter(e.target.value)} />
            </Grid>

            <Grid size={{
              xs: 12, sm: 6, md: 3
            }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Ocena: {ratingEnabled ? `${ratingRange[0]}–${ratingRange[1]} ★` : 'wyłączone'}
                  </Typography>
                  <Chip label={ratingEnabled ? 'Wyłącz' : 'Włącz'} size="small"
                        onClick={() => setRatingEnabled((e) => !e)}
                        color={ratingEnabled ? 'primary' : 'default'} sx={{ fontSize: '0.65rem', height: 18 }} />
                </Box>
                <Slider
                  value={ratingRange} onChange={(_, v) => setRatingRange(v as [number, number])}
                  min={1} max={5} step={0.5} disabled={!ratingEnabled}
                  valueLabelDisplay="auto" color="primary"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Grid>
          </Grid>

          {activeFiltersCount > 0 && (
            <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="small" onClick={clearFilters} color="warning">
                Wyczyść filtry ({activeFiltersCount})
              </Button>
            </Box>
          )}
        </Box>
      </Collapse>

      {/* ── Błędy ─────────────────────────────────────────────── */}
      {(error || actionError) && (
        <Alert severity="error" sx={{ mb: 2 }}>{error ?? actionError}</Alert>
      )}

      {/* ── Licznik wyników ────────────────────────────────────── */}
      {!loading && books.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
          {books.length} {books.length === 1 ? 'pozycja' : 'pozycji'}
        </Typography>
      )}

      {/* ── Siatka kart ────────────────────────────────────────── */}
      {loading ? (
        <Grid container spacing={2}>
          {[...Array(8)].map((_, i) => (
            <Grid size={{
              xs: 12, sm: 6, md: 4, lg: 3
            }} key={i}>
              <Skeleton variant="rectangular" height={340} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : books.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <Typography variant="h5" gutterBottom>Brak wyników</Typography>
          <Typography>Zmień kryteria filtrowania lub dodaj nowe książki.</Typography>
          {activeFiltersCount > 0 && (
            <Button variant="outlined" sx={{ mt: 2 }} onClick={clearFilters}>
              Wyczyść filtry
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {books.map((book) => (
            <Grid size={{
              xs: 12, sm: 6, md: 4, lg: 3
            }} key={book.id}>
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

      {/* ── Modale ─────────────────────────────────────────────── */}
      <AddBookDialog open={dialog.type === 'add'} onClose={() => setDialog({ type: 'none' })} onSubmit={handleAdd} />
      <AddBookDialog open={dialog.type === 'edit'} editBook={dialog.type === 'edit' ? dialog.book : null}
                     onClose={() => setDialog({ type: 'none' })} onSubmit={handleEdit} />
      <ProgressDialog open={dialog.type === 'progress'} book={dialog.type === 'progress' ? dialog.book : null}
                      onClose={() => setDialog({ type: 'none' })} onSave={handleProgress} />

      <Dialog open={dialog.type === 'delete'} onClose={() => setDialog({ type: 'none' })}>
        <DialogTitle>Usuń książkę</DialogTitle>
        <DialogContent>
          <Typography>Usunąć <strong>{dialog.type === 'delete' ? `„${dialog.book.title}"` : ''}</strong> z biblioteki?
            Tej operacji nie można cofnąć.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ type: 'none' })}>Anuluj</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Usuń</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
