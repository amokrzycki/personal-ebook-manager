import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import StarIcon from '@mui/icons-material/Star';
import {
  Box, Card, CardContent, CardMedia,
  Chip, IconButton, LinearProgress, Tooltip, Typography
} from '@mui/material';
import React from 'react';
import {
  AUDIO_FORMATS, type Book, BookFormatColors, BookFormatLabels,
  ReadingStatusColors, ReadingStatusLabels, formatDurationHuman
} from '../types';

interface Props {
  book: Book;
  onEditProgress: (book: Book) => void;
  onEditDetails: (book: Book) => void;
  onDelete: (book: Book) => void;
}

const CoverImage: React.FC<{ url: string | null; title: string; isAudio: boolean }> = ({ url, title, isAudio }) => {
  if (url) {
    return (
      <CardMedia
        component="img"
        image={url}
        alt={`Okładka: ${title}`}
        sx={{ height: 190, objectFit: 'cover' }}
      />
    );
  }
  return (
    <Box sx={{
      height: 190,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1,
      background: isAudio
        ? 'linear-gradient(135deg, #1a0a2e 0%, #2d1b5e 100%)'
        : 'linear-gradient(135deg, #1a2e42 0%, #243b55 100%)'
    }}>
      {isAudio
        ? <HeadphonesIcon sx={{ fontSize: 56, color: '#8E44AD', opacity: 0.7 }} />
        : <MenuBookIcon sx={{ fontSize: 56, color: 'primary.main', opacity: 0.6 }} />}
      <Typography variant="caption" color="text.secondary" sx={{ px: 2, textAlign: 'center' }}>
        Brak okładki
      </Typography>
    </Box>
  );
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <StarIcon key={s} sx={{
        fontSize: 13,
        color: s <= rating ? 'primary.main' : 'text.secondary',
        opacity: s <= rating ? 1 : 0.3
      }} />
    ))}
    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>{rating.toFixed(1)}</Typography>
  </Box>
);

export const BookCard = ({ book, onEditProgress, onEditDetails, onDelete }: Props) => {
  const isAudio = AUDIO_FORMATS.includes(book.format);
  const progress = isAudio ? (book.audioProgressPercent ?? 0) : (book.readingProgressPercent ?? 0);
  const showProgress = book.status === 'in_progress';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Cover + Badge format */}
      <Box sx={{ position: 'relative' }}>
        <CoverImage url={book.coverUrl} title={book.title} isAudio={isAudio} />
        <Chip
          label={BookFormatLabels[book.format]}
          size="small"
          sx={{
            position: 'absolute', top: 8, right: 8,
            bgcolor: BookFormatColors[book.format], color: '#fff',
            fontSize: '0.6rem', height: 18, fontWeight: 700
          }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Series */}
        {book.series && (
          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, display: 'block' }}>
            {book.series}{book.seriesNumber ? ` #${book.seriesNumber}` : ''}
          </Typography>
        )}

        {/* Title */}
        <Typography variant="h6" sx={{
          fontFamily: '"Playfair Display", serif', fontSize: '0.95rem',
          lineHeight: 1.3, mt: 0.25, mb: 0.5,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {book.title}
        </Typography>

        {/* Author */}
        <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 0.75 }}>
          {book.author}
        </Typography>

        {/* Status + grade */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mb: 0.75 }}>
          <Chip label={ReadingStatusLabels[book.status]} color={ReadingStatusColors[book.status]} size="small"
                sx={{ fontSize: '0.68rem', height: 20 }} />
          {book.rating !== null && <StarRating rating={book.rating} />}
        </Box>

        {/* Reading progress */}
        {showProgress && (
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {isAudio ? '🎧 Postęp' : '📖 Postęp'}
              </Typography>
              <Typography variant="caption" color="primary.main" fontWeight={700}>{progress}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.4, display: 'block' }}>
              {isAudio
                ? `${formatDurationHuman(book.audioProgressSeconds)} / ${book.audioDurationSeconds ? formatDurationHuman(book.audioDurationSeconds) : '?'}`
                : `${book.currentPage} / ${book.totalPages ?? '?'} stron`
              }
            </Typography>
          </Box>
        )}

        {/* Genres */}
        {book.genres && book.genres.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
            {book.genres.slice(0, 2).map((g) => (
              <Chip key={g} label={g} size="small" variant="outlined"
                    sx={{ fontSize: '0.62rem', height: 18, borderColor: 'divider' }} />
            ))}
          </Box>
        )}

        {/* Shelves */}
        {book.shelves?.length > 0 && (
          <Box sx={{ mt: 0.75, display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
            {book.shelves.slice(0, 2).map((s) => (
              <Chip key={s.id} label={s.name} size="small"
                    sx={{
                      fontSize: '0.6rem',
                      height: 18,
                      bgcolor: s.color + '22',
                      color: s.color,
                      borderColor: s.color,
                      border: '1px solid'
                    }} />
            ))}
            {book.shelves.length > 2 && (
              <Typography variant="caption" color="text.secondary">+{book.shelves.length - 2}</Typography>
            )}
          </Box>
        )}
      </CardContent>

      {/* Actions */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 0.5,
        px: 1,
        pb: 1,
        pt: 1,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Tooltip title={isAudio ? 'Aktualizuj odsłuchany czas' : 'Aktualizuj postęp czytania'}>
          <IconButton size="small" onClick={() => onEditProgress(book)} color="info">
            {isAudio ? <HeadphonesIcon fontSize="small" /> : <MenuBookIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Edytuj szczegóły">
          <IconButton size="small" onClick={() => onEditDetails(book)}>
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
