import HeadphonesIcon from '@mui/icons-material/Headphones';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Slider, TextField, Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { AUDIO_FORMATS, type Book, formatDuration, formatDurationHuman } from '../types';

interface Props {
  open: boolean;
  book: Book | null;
  onClose: () => void;
  onSave: (bookId: string, payload: { currentPage?: number; audioProgressSeconds?: number }) => Promise<void>;
}

export const ProgressDialog: React.FC<Props> = ({ open, book, onClose, onSave }) => {
  const [page, setPage] = useState(0);
  const [audioSecs, setAudioSecs] = useState(0);
  const [timeInput, setTimeInput] = useState('0:00:00');
  const [saving, setSaving] = useState(false);

  const isAudio = book ? AUDIO_FORMATS.includes(book.format) : false;

  useEffect(() => {
    if (!book) return;
    setPage(book.currentPage);
    setAudioSecs(book.audioProgressSeconds);
    setTimeInput(formatDuration(book.audioProgressSeconds));
  }, [book]);

  // Parsuj HH:MM:SS / MM:SS na sekundy
  const parseTimeInput = (v: string): number => {
    const parts = v.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  const handleTimeChange = (v: string) => {
    setTimeInput(v);
    const secs = parseTimeInput(v);
    if (!isNaN(secs)) setAudioSecs(secs);
  };

  const handleSliderChange = (_: Event, v: number | number[]) => {
    const val = v as number;
    if (isAudio) {
      setAudioSecs(val);
      setTimeInput(formatDuration(val));
    } else {
      setPage(val);
    }
  };

  const handleSave = async () => {
    if (!book) return;
    setSaving(true);
    try {
      if (isAudio) {
        await onSave(book.id, { audioProgressSeconds: audioSecs });
      } else {
        await onSave(book.id, { currentPage: page });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const percent = book
    ? isAudio
      ? book.audioDurationSeconds ? Math.round((audioSecs / book.audioDurationSeconds) * 100) : 0
      : book.totalPages ? Math.round((page / book.totalPages) * 100) : 0
    : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isAudio
          ? <><HeadphonesIcon color="secondary" /> Postęp słuchania</>
          : <><MenuBookIcon color="info" /> Postęp czytania</>}
      </DialogTitle>

      <DialogContent>
        {book && (
          <Box sx={{ pt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom noWrap>
              {book.title}
            </Typography>

            <Typography gutterBottom sx={{ mt: 1.5 }}>
              Postęp: <strong style={{ color: '#C9A84C' }}>{percent}%</strong>
            </Typography>

            {/* Suwak */}
            <Slider
              value={isAudio ? audioSecs : page}
              onChange={handleSliderChange}
              min={0}
              max={isAudio ? (book.audioDurationSeconds ?? 3600) : (book.totalPages ?? 100)}
              color="primary"
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => isAudio ? formatDurationHuman(v) : `${v} str.`}
            />

            {/* Input */}
            {isAudio ? (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Odsłuchany czas (HH:MM:SS)"
                  value={timeInput}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  placeholder="1:23:45"
                  helperText={book.audioDurationSeconds
                    ? `Łącznie: ${formatDurationHuman(book.audioDurationSeconds)}`
                    : 'Brak informacji o długości'}
                />
              </Box>
            ) : (
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
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Anuluj</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>Zapisz</Button>
      </DialogActions>
    </Dialog>
  );
};
