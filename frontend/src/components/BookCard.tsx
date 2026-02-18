import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import StarIcon from '@mui/icons-material/Star';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import { type Book, ReadingStatusColors, ReadingStatusLabels } from '../types';

interface BookCardProps {
  book: Book;
  onEditProgress: (book: Book) => void;
  onEditDetails: (book: Book) => void;
  onDelete: (book: Book) => void;
}

/** Komponent okładki z graceful fallback */
const CoverImage: React.FC<{ url: string | null; title: string }> = ({ url, title }) => {
  if (url) {
    return (
      <CardMedia
        component="img"
        image={url}
        alt={`Okładka: ${title}`}
        sx={{ height: 200, objectFit: 'cover' }}
      />
    );
  }

  // Fallback: gradient z ikoną książki
  return (
    <Box
      sx={{
        height: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a2e42 0%, #243b55 100%)',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <MenuBookIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.6 }} />
      <Typography variant="caption" color="text.secondary" sx={{ px: 2, textAlign: 'center' }}>
        Brak okładki
      </Typography>
    </Box>
  );
};

/** Wizualizacja oceny gwiazdkowej (1–5) */
const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <StarIcon
        key={star}
        sx={{
          fontSize: 14,
          color: star <= rating ? 'primary.main' : 'text.secondary',
          opacity: star <= rating ? 1 : 0.3,
        }}
      />
    ))}
    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
      {rating.toFixed(1)}
    </Typography>
  </Box>
);

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onEditProgress,
  onEditDetails,
  onDelete,
}) => {
  const showProgress = book.status === 'in_progress' && book.totalPages !== null;
  const progress = book.readingProgressPercent ?? 0;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* ── Okładka ──────────────────────────────────────────────── */}
      <CoverImage url={book.coverUrl} title={book.title} />

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* ── Seria ──────────────────────────────────────────────── */}
        {book.series && (
          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
            {book.series}
            {book.seriesNumber ? ` #${book.seriesNumber}` : ''}
          </Typography>
        )}

        {/* ── Tytuł ──────────────────────────────────────────────── */}
        <Typography
          variant="h6"
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '1rem',
            lineHeight: 1.3,
            mt: 0.25,
            mb: 0.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {book.title}
        </Typography>

        {/* ── Autor ──────────────────────────────────────────────── */}
        <Typography variant="body2" color="text.secondary" noWrap>
          {book.author}
        </Typography>

        {/* ── Status + ocena ─────────────────────────────────────── */}
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={ReadingStatusLabels[book.status]}
            color={ReadingStatusColors[book.status]}
            size="small"
            sx={{ fontSize: '0.7rem' }}
          />
          {book.rating !== null && <StarRating rating={book.rating} />}
        </Box>

        {/* ── Pasek postępu czytania ──────────────────────────────── */}
        {showProgress && (
          <Box sx={{ mt: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Postęp
              </Typography>
              <Typography variant="caption" color="primary.main" fontWeight={600}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ bgcolor: 'rgba(255,255,255,0.08)' }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {book.currentPage} / {book.totalPages} stron
            </Typography>
          </Box>
        )}

        {/* ── Tagi gatunkowe ──────────────────────────────────────── */}
        {book.genres && book.genres.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {book.genres.slice(0, 3).map((genre) => (
              <Chip
                key={genre}
                label={genre}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65rem', height: 20, borderColor: 'divider' }}
              />
            ))}
          </Box>
        )}
      </CardContent>

      {/* ── Przyciski akcji ─────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 0.5,
          px: 1,
          pb: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          pt: 1,
        }}
      >
        <Tooltip title="Aktualizuj postęp czytania">
          <IconButton size="small" onClick={() => onEditProgress(book)} color="info">
            <MenuBookIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edytuj szczegóły">
          <IconButton size="small" onClick={() => onEditDetails(book)} color="default">
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Usuń z biblioteki">
          <IconButton size="small" onClick={() => onDelete(book)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );
};
