import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useRecommendations } from '../hooks/useBooks';

export const RecommendationsPanel = () => {
  const { recommendations, loading, error } = useRecommendations();

  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3].map((i) => (
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
            key={i}
          >
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return <Alert severity="error">Błąd pobierania rekomendacji: {error}</Alert>;
  }

  if (recommendations.length === 0) {
    return (
      <Alert severity="info" icon={<AutoAwesomeIcon />} sx={{ borderRadius: 2 }}>
        <Typography fontWeight={600} gutterBottom>
          Brak rekomendacji
        </Typography>
        <Typography variant="body2">
          Przeczytaj kilka książek i oceń je na <strong>3 gwiazdki lub więcej</strong>, aby system
          mógł poznać Twoje preferencje i zaproponować kolejne tytuły.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <AutoAwesomeIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
        Rekomendacje oparte na Twoich ulubionych gatunkach i tagach
      </Typography>

      <Grid container spacing={2}>
        {recommendations.map(({ book, score, matchedFeatures }) => (
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
            key={book.id}
          >
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Nagłówek z okładką */}
              <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
                {book.coverUrl ? (
                  <Box
                    component="img"
                    src={book.coverUrl}
                    alt={book.title}
                    sx={{
                      width: 60,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 1,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 60,
                      height: 80,
                      bgcolor: 'rgba(201,168,76,0.1)',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MenuBookIcon color="primary" />
                  </Box>
                )}

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontFamily: '"Playfair Display", serif',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {book.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {book.author}
                  </Typography>
                </Box>
              </Box>

              <CardContent sx={{ pt: 0 }}>
                {/* Wynik podobieństwa */}
                <Tooltip title={`Wynik podobieństwa: ${(score * 100).toFixed(0)}%`}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Dopasowanie
                      </Typography>
                      <Typography variant="caption" color="primary.main" fontWeight={700}>
                        {(score * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, score * 100)}
                      sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}
                    />
                  </Box>
                </Tooltip>

                {/* Dopasowane cechy */}
                {matchedFeatures.length > 0 && (
                  <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {matchedFeatures.slice(0, 4).map((f) => (
                      <Chip
                        key={f}
                        label={f}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
