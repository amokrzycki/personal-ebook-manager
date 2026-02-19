import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControl, Grid, InputAdornment, InputLabel,
  MenuItem, Select, Slider, TextField, Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { previewMetadata } from '../api/api';
import { useShelves } from '../hooks/useBooks';
import {
  type CreateBookPayload,
  type BookFormat,
  type Book,
  AUDIO_FORMATS,
  BookFormatLabels,
  ReadingStatusLabels, type ReadingStatus
} from '../types';

interface Props {
  open: boolean;
  editBook?: Book | null;
  onClose: () => void;
  onSubmit: (payload: CreateBookPayload) => Promise<void>;
}

const EMPTY: CreateBookPayload = {
  title: '', author: '', series: '', isbn: '', format: 'epub' as BookFormat,
  totalPages: undefined, audioDurationSeconds: undefined,
  genres: [], tags: [], status: 'unread', currentPage: 0, rating: undefined,
  shelfIds: []
};

export const AddBookDialog: React.FC<Props> = ({ open, editBook, onClose, onSubmit }) => {
  const [form, setForm] = useState<CreateBookPayload>(EMPTY);
  const [autoQuery, setAutoQuery] = useState('');
  const [autoLoading, setAutoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [genreInput, setGenreInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { shelves } = useShelves();

  const isAudio = AUDIO_FORMATS.includes(form.format as BookFormat);

  useEffect(() => {
    if (editBook) {
      setForm({
        title: editBook.title, author: editBook.author,
        series: editBook.series ?? '', isbn: editBook.isbn ?? '',
        totalPages: editBook.totalPages ?? undefined,
        audioDurationSeconds: editBook.audioDurationSeconds ?? undefined,
        audioProgressSeconds: editBook.audioProgressSeconds,
        genres: editBook.genres ?? [], tags: editBook.tags ?? [],
        status: editBook.status, currentPage: editBook.currentPage,
        rating: editBook.rating ?? undefined,
        format: editBook.format, shelfIds: editBook.shelves?.map((s) => s.id) ?? [],
        description: editBook.description ?? '', coverUrl: editBook.coverUrl ?? '',
        publishedYear: editBook.publishedYear ?? undefined, publisher: editBook.publisher ?? ''
      });
    } else {
      setForm(EMPTY);
    }
    setError(null);
  }, [editBook, open]);

  const set = (field: keyof CreateBookPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAutofill = async () => {
    const q = autoQuery.trim() || form.isbn || form.title;
    if (!q) return;
    setAutoLoading(true);
    const meta = await previewMetadata(q);
    setAutoLoading(false);
    if (meta) {
      setForm((f) => ({
        ...f,
        title: meta.title ?? f.title, author: meta.author ?? f.author,
        description: meta.description ?? f.description, coverUrl: meta.coverUrl ?? f.coverUrl,
        totalPages: meta.totalPages ?? f.totalPages, publishedYear: meta.publishedYear ?? f.publishedYear,
        publisher: meta.publisher ?? f.publisher,
        genres: meta.genres?.length ? meta.genres : f.genres, isbn: meta.isbn ?? f.isbn
      }));
    }
  };

  const handleAddGenre = () => {
    const g = genreInput.trim();
    if (g && !form.genres?.includes(g)) setForm((f) => ({ ...f, genres: [...(f.genres ?? []), g] }));
    setGenreInput('');
  };
  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags?.includes(t)) setForm((f) => ({ ...f, tags: [...(f.tags ?? []), t] }));
    setTagInput('');
  };

  const toggleShelf = (id: string) => {
    setForm((f) => {
      const ids = f.shelfIds ?? [];
      return { ...f, shelfIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] };
    });
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.author.trim()) {
      setError('Tytuł i autor są wymagane');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{editBook ? 'Edytuj książkę' : 'Dodaj nową książkę'}</DialogTitle>

      <DialogContent dividers>
        {/* Autocomplete */}
        <Box sx={{
          mb: 3,
          p: 2,
          bgcolor: 'rgba(201,168,76,0.06)',
          borderRadius: 2,
          border: '1px dashed rgba(201,168,76,0.3)'
        }}>
          <Typography variant="subtitle2" color="primary.main" gutterBottom>
            <AutoAwesomeIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
            Autouzupełnij metadane
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth size="small" placeholder="ISBN lub tytuł…"
                       value={autoQuery} onChange={(e) => setAutoQuery(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleAutofill()} />
            <Button variant="contained" onClick={handleAutofill} disabled={autoLoading} size="small"
                    sx={{ minWidth: 130 }}>
              {autoLoading ? <CircularProgress size={16} /> : 'Pobierz dane'}
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {/* Title */}
          <Grid size={{
            xs: 12, md: 8
          }}>
            <TextField required fullWidth label="Tytuł" value={form.title} onChange={set('title')} />
          </Grid>

          {/* Format – key for audiobooks */}
          <Grid size={{
            xs: 12, md: 4
          }}>
            <FormControl fullWidth>
              <InputLabel>Format pliku</InputLabel>
              <Select value={form.format ?? 'epub'} label="Format pliku"
                      onChange={(e) => setForm((f) => ({ ...f, format: e.target.value as BookFormat }))}>
                {(Object.keys(BookFormatLabels) as BookFormat[]).map((fmt) => (
                  <MenuItem key={fmt} value={fmt}>{BookFormatLabels[fmt]}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Author */}
          <Grid size={{
            xs: 12, md: 8
          }}>
            <TextField required fullWidth label="Autor" value={form.author} onChange={set('author')} />
          </Grid>

          {/* ISBN */}
          <Grid size={{
            xs: 12, md: 4
          }}>
            <TextField fullWidth label="ISBN" value={form.isbn ?? ''} onChange={set('isbn')} />
          </Grid>

          {/* Series */}
          <Grid size={{
            xs: 12, md: 8
          }}>
            <TextField fullWidth label="Seria" value={form.series ?? ''} onChange={set('series')} />
          </Grid>

          <Grid size={{
            xs: 12, md: 4
          }}>
            <TextField fullWidth label="Nr w serii" type="number"
                       value={form.seriesNumber ?? ''} onChange={set('seriesNumber')} />
          </Grid>

          {/* Page or audio time */}
          {isAudio ? (
            <>
              <Grid size={{
                xs: 12, md: 6
              }}>
                <TextField fullWidth label="Łączny czas (sekundy)" type="number"
                           value={form.audioDurationSeconds ?? ''}
                           onChange={(e) => setForm((f) => ({
                             ...f,
                             audioDurationSeconds: parseInt(e.target.value) || undefined
                           }))}
                           helperText="np. 3600 = 1 godzina" />
              </Grid>
              <Grid size={{
                xs: 12, md: 6
              }}>
                <TextField fullWidth label="Odsłuchany czas (sekundy)" type="number"
                           value={form.audioProgressSeconds ?? 0}
                           onChange={(e) => setForm((f) => ({
                             ...f,
                             audioProgressSeconds: parseInt(e.target.value) || 0
                           }))} />
              </Grid>
            </>
          ) : (
            <>
              <Grid size={{
                xs: 12, md: 4
              }}>
                <TextField fullWidth label="Liczba stron" type="number"
                           value={form.totalPages ?? ''}
                           onChange={(e) => setForm((f) => ({
                             ...f,
                             totalPages: parseInt(e.target.value) || undefined
                           }))}
                           InputProps={{ endAdornment: <InputAdornment position="end">str.</InputAdornment> }} />
              </Grid>
              <Grid size={{
                xs: 12, md: 4
              }}>
                <TextField fullWidth label="Aktualna strona" type="number"
                           value={form.currentPage ?? 0} onChange={set('currentPage')} />
              </Grid>
              <Grid size={{
                xs: 12, md: 4
              }}>
                <TextField fullWidth label="Rok wydania" type="number"
                           value={form.publishedYear ?? ''} onChange={set('publishedYear')} />
              </Grid>
            </>
          )}

          {/* Status */}
          <Grid size={{
            xs: 12, md: 6
          }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={form.status ?? 'unread'} label="Status"
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ReadingStatus }))}>
                {(Object.keys(ReadingStatusLabels) as ReadingStatus[]).map((s) => (
                  <MenuItem key={s} value={s}>{ReadingStatusLabels[s]}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Cover URL */}
          <Grid size={{
            xs: 12, md: 6
          }}>
            <TextField fullWidth label="URL okładki" value={form.coverUrl ?? ''} onChange={set('coverUrl')} />
          </Grid>

          {/* Grade */}
          <Grid size={{
            xs: 12
          }}>
            <Typography gutterBottom>Ocena: {form.rating ? `${form.rating}/5` : 'Brak'}</Typography>
            <Slider value={form.rating ?? 0}
                    onChange={(_, v) => setForm((f) => ({ ...f, rating: v === 0 ? undefined : (v as number) }))}
                    min={0} max={5} step={0.5} color="primary" valueLabelDisplay="auto"
                    marks={[{ value: 0, label: 'Brak' }, { value: 1, label: '1' }, { value: 3, label: '3' }, {
                      value: 5,
                      label: '5'
                    }]} />
          </Grid>

          {/* Description */}
          <Grid size={{
            xs: 12
          }}>
            <TextField fullWidth multiline rows={2} label="Opis" value={form.description ?? ''}
                       onChange={set('description')} />
          </Grid>

          <Grid size={{
            xs: 12
          }}><Divider /></Grid>

          {/* Genres */}
          <Grid size={{
            xs: 12, md: 6
          }}>
            <Typography variant="subtitle2" gutterBottom>Gatunki</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField size="small" placeholder="Dodaj gatunek…" value={genreInput}
                         onChange={(e) => setGenreInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleAddGenre()} />
              <Button size="small" onClick={handleAddGenre}>Dodaj</Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {form.genres?.map((g) => (
                <Chip key={g} label={g} size="small"
                      onDelete={() => setForm((f) => ({ ...f, genres: f.genres?.filter((x) => x !== g) }))} />
              ))}
            </Box>
          </Grid>

          {/* Tags */}
          <Grid size={{
            xs: 12, md: 6
          }}>
            <Typography variant="subtitle2" gutterBottom>Tagi</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField size="small" placeholder="Dodaj tag…" value={tagInput}
                         onChange={(e) => setTagInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} />
              <Button size="small" onClick={handleAddTag}>Dodaj</Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {form.tags?.map((t) => (
                <Chip key={t} label={t} size="small" variant="outlined"
                      onDelete={() => setForm((f) => ({ ...f, tags: f.tags?.filter((x) => x !== t) }))} />
              ))}
            </Box>
          </Grid>

          {/* Shelves */}
          {shelves.length > 0 && (
            <Grid size={{
              xs: 12
            }}>
              <Divider sx={{ mb: 1.5 }} />
              <Typography variant="subtitle2" gutterBottom>Dodaj do półek</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {shelves.map((s) => {
                  const selected = (form.shelfIds ?? []).includes(s.id);
                  return (
                    <Chip key={s.id} label={s.name} onClick={() => toggleShelf(s.id)}
                          sx={{
                            bgcolor: selected ? s.color + '33' : 'transparent',
                            color: selected ? s.color : 'text.secondary',
                            borderColor: selected ? s.color : 'divider', border: '1px solid',
                            fontWeight: selected ? 700 : 400,
                            transition: 'all 0.15s'
                          }} />
                  );
                })}
              </Box>
            </Grid>
          )}
        </Grid>

        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Anuluj</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <CircularProgress size={20} /> : editBook ? 'Zapisz zmiany' : 'Dodaj do biblioteki'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
