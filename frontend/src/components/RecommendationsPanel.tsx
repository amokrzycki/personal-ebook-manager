import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonIcon from '@mui/icons-material/Person';
import {
  Alert, Box, Card, CardContent, Chip, Grid,
  LinearProgress, Skeleton, Tooltip, Typography
} from '@mui/material';
import React from 'react';
import { useRecommendations } from '../hooks/useBooks';
import type { Book } from '../types';

export const RecommendationsPanel: React.FC = () => {
  const { recommendations, loading, error } = useRecommendations();

  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((i) => (
          <Grid size={{
            xs: 12, sm: 6, md: 4
          }} key={i}>
            <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) return <Alert severity="error">Błąd: {error}</Alert>;

  if (recommendations.length === 0) {
    return (
      <Alert severity="info" icon={<AutoAwesomeIcon />} sx={{ borderRadius: 2 }}>
        <Typography fontWeight={600} gutterBottom>Brak rekomendacji</Typography>
        <Typography variant="body2">
          Przeczytaj i oceń kilka książek (min. 3 gwiazdki), aby silnik rekomendacji
          poznał Twój gust i zaproponował nowe tytuły.
        </Typography>
      </Alert>
    );
  }

  const local = recommendations.filter((r) => !r.isExternal);
  const external = recommendations.filter((r) => r.isExternal);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        <AutoAwesomeIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
        Analiza Twoich ulubionych gatunków, tagów i autorów.{' '}
        {external.length > 0 && (
          <span>Propozycje zewnętrzne ({external.length}) pochodzą z Google Books API.</span>
        )}
      </Typography>

      {/* Local */}
      {local.length > 0 && (
        <>
          <Typography variant="subtitle2" color="primary.main"
                      sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
            Z Twojej biblioteki
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {local.map(({ book, score, matchedFeatures }, idx) => (
              <RecommendationCard key={book.id ?? idx} book={book} score={score}
                                  matchedFeatures={matchedFeatures} isExternal={false} />
            ))}
          </Grid>
        </>
      )}

      {/* External */}
      {external.length > 0 && (
        <>
          <Typography variant="subtitle2" color="secondary.main"
                      sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
            Propozycje zewnętrzne (Google Books)
          </Typography>
          <Grid container spacing={2}>
            {external.map(({ book, score, matchedFeatures }, idx) => (
              <RecommendationCard key={book.isbn ?? idx} book={book} score={score}
                                  matchedFeatures={matchedFeatures} isExternal={true} />
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};

// ── Karta jednej rekomendacji ─────────────────────────────────────────

interface CardProps {
  book: Partial<Book>;
  score: number;
  matchedFeatures: string[];
  isExternal: boolean;
}

const RecommendationCard: React.FC<CardProps> = ({ book, score, matchedFeatures, isExternal }) => {
  // Rozdziel dopasowane cechy na kategorie
  const authorMatches = matchedFeatures.filter((f) => f.startsWith('author:') || book.author?.toLowerCase().includes(f));
  const genreMatches = matchedFeatures.filter((f) => !f.startsWith('author:') && book.genres?.some((g: string) => g.toLowerCase().includes(f)));
  const otherMatches = matchedFeatures.filter((f) => !authorMatches.includes(f) && !genreMatches.includes(f)).slice(0, 3);
  const hasAuthorMatch = authorMatches.length > 0;

  return (
    <Grid size={{
      xs: 12, sm: 6, md: 4
    }}>
      <Card sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        borderColor: isExternal ? 'secondary.dark' : 'divider',
        position: 'relative'
      }}>
        {isExternal && (
          <Chip label="Google Books" size="small" color="secondary"
                icon={<OpenInNewIcon sx={{ fontSize: '0.7rem !important' }} />}
                sx={{ position: 'absolute', top: 8, right: 8, fontSize: '0.6rem', height: 18, zIndex: 1 }} />
        )}

        <Box sx={{ display: 'flex', gap: 2, p: 2, pb: 1 }}>
          {book.coverUrl ? (
            <Box component="img" src={book.coverUrl} alt={book.title}
                 sx={{ width: 56, height: 76, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }} />
          ) : (
            <Box sx={{
              width: 56, height: 76, bgcolor: 'rgba(201,168,76,0.1)', borderRadius: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <MenuBookIcon color="primary" fontSize="small" />
            </Box>
          )}

          <Box sx={{ minWidth: 0, flex: 1 }}>
            {/* Badge "this author" */}
            {hasAuthorMatch && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.5 }}>
                <PersonIcon sx={{ fontSize: 11, color: 'primary.main' }} />
                <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ fontSize: '0.65rem' }}>
                  Więcej od tego autora
                </Typography>
              </Box>
            )}
            <Typography variant="subtitle2"
                        sx={{
                          fontFamily: '"Playfair Display", serif', display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3
                        }}>
              {book.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {book.author}
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ pt: 0, flex: 1 }}>
          <Tooltip title={`Wynik podobieństwa: ${(score * 100).toFixed(0)}%`}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Dopasowanie</Typography>
                <Typography variant="caption" color="primary.main" fontWeight={700}>
                  {Math.min(100, Math.round(score * 100))}%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={Math.min(100, score * 100)}
                              sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
            </Box>
          </Tooltip>

          {/* Reasons of recommendations */}
          {matchedFeatures.length > 0 && (
            <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
              {[...genreMatches.slice(0, 2), ...otherMatches].map((f) => (
                <Chip key={f} label={f} size="small" color="primary" variant="outlined"
                      sx={{ fontSize: '0.6rem', height: 18 }} />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
};
