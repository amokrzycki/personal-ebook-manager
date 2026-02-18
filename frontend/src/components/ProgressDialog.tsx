import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { Book } from '../types';

interface ProgressDialogProps {
  open: boolean;
  book: Book | null;
  onClose: () => void;
  onSave: (bookId: string, currentPage: number) => Promise<void>;
}

export const ProgressDialog = ({ open, book, onClose, onSave }: ProgressDialogProps) => {
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (book) setPage(book.currentPage);
  }, [book]);

  const percent = book?.totalPages ? Math.min(100, Math.round((page / book.totalPages) * 100)) : 0;

  const handleSave = async () => {
    if (!book) return;
    setSaving(true);
    try {
      await onSave(book.id, page);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Aktualizuj postęp</DialogTitle>
      <DialogContent>
        {book && (
          <Box sx={{ pt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              {book.title}
            </Typography>

            {/* Suwak procentowy */}
            <Typography gutterBottom>
              Postęp: <strong style={{ color: '#C9A84C' }}>{percent}%</strong>
            </Typography>
            {book.totalPages && (
              <Slider
                value={page}
                onChange={(_, v) => setPage(v as number)}
                min={0}
                max={book.totalPages}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v} str. (${Math.round((v / book.totalPages!) * 100)}%)`}
                color="primary"
              />
            )}

            {/* Pole tekstowe na numer strony */}
            <TextField
              fullWidth
              type="number"
              label="Numer strony"
              value={page}
              onChange={(e) => setPage(Math.max(0, parseInt(e.target.value, 10) || 0))}
              sx={{ mt: 2 }}
              inputProps={{ min: 0, max: book.totalPages ?? undefined }}
              helperText={book.totalPages ? `Łącznie: ${book.totalPages} stron` : undefined}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Anuluj</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          Zapisz
        </Button>
      </DialogActions>
    </Dialog>
  );
};
