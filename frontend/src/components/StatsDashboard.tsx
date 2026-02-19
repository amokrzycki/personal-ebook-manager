import BarChartIcon from '@mui/icons-material/BarChart';
import BookIcon from '@mui/icons-material/Book';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box, Card, CardContent, Chip, Grid, LinearProgress,
  Skeleton, Tooltip, Typography
} from '@mui/material';
import React from 'react';
import { useStats } from '../hooks/useBooks';
import { type BookFormat, BookFormatColors, BookFormatLabels, ReadingStatusLabels } from '../types';

const StatCard: React.FC<{
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: string;
  sub?: string
}> =
  ({ icon, value, label, color = 'primary.main', sub }) => (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(201,168,76,0.1)', color, display: 'flex' }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={700} color={color}>{value}</Typography>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );

export const StatsDashboard: React.FC = () => {
  const { data: stats, loading } = useStats();

  if (loading) {
    return (
      <Grid container spacing={2}>
        {[...Array(8)].map((_, i) => (
          <Grid size={{
            xs: 12, sm: 6, md: 3
          }} key={i}>
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (!stats) return null;

  return (
    <Box>
      {/* ── Karty główne ──────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{
          xs: 12, sm: 6, md: 3
        }}>
          <StatCard icon={<BookIcon />} value={stats.total} label="Wszystkich pozycji" />
        </Grid>
        <Grid size={{
          xs: 12, sm: 6, md: 3
        }}>
          <StatCard icon={<DoneAllIcon />} value={stats.byStatus.finished} label="Przeczytanych"
                    color="#5CB85C"
                    sub={stats.finishedThisMonth > 0 ? `+${stats.finishedThisMonth} w tym miesiącu` : undefined} />
        </Grid>
        <Grid size={{
          xs: 12, sm: 6, md: 3
        }}>
          <StatCard icon={<StarIcon />} value={stats.avgRating ? `${stats.avgRating}/5` : '—'}
                    label="Średnia ocena" color="#C9A84C" />
        </Grid>
        <Grid size={{
          xs: 12, sm: 6, md: 3
        }}>
          <StatCard icon={<HeadphonesIcon />} value={`${stats.totalAudioHours} h`}
                    label="Godzin audiobooków" color="#8E44AD" />
        </Grid>
        <Grid size={{
          xs: 12, sm: 6, md: 3
        }}>
          <StatCard icon={<TrendingUpIcon />} value={`${stats.avgReadingProgress}%`}
                    label="Śr. postęp (w trakcie)" color="#4A90D9" />
        </Grid>
        <Grid size={{
          xs: 12, sm: 6, md: 3
        }}>
          <StatCard icon={<BarChartIcon />} value={stats.totalPagesRead.toLocaleString('pl-PL')}
                    label="Stron przeczytanych" />
        </Grid>
        <Grid size={{
          xs: 12, sm: 6, md: 3
        }}>
          <StatCard icon={<BookIcon />} value={stats.byStatus.in_progress} label="W trakcie czytania" color="#5BC0DE" />
        </Grid>
        <Grid size={{
          xs: 12, sm: 6, md: 3
        }}>
          <StatCard icon={<BookIcon />} value={stats.byStatus.unread} label="Do przeczytania" color="#9BA8B5" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Statuses */}
        <Grid
          size={{
            xs: 12,
            md: 6
          }}
        >
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Statusy</Typography>
              {(Object.entries(stats.byStatus) as [string, number][]).map(([status, count]) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <Box key={status} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography
                        variant="body2">{ReadingStatusLabels[status as keyof typeof ReadingStatusLabels]}</Typography>
                      <Typography variant="body2" color="text.secondary">{count} ({pct}%)</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        {/* Format breakdowns */}
        <Grid size={{
          xs: 12,
          md: 6
        }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Formaty plików</Typography>
              {Object.entries(stats.byFormat).length === 0 ? (
                <Typography color="text.secondary" variant="body2">Brak danych</Typography>
              ) : (
                Object.entries(stats.byFormat)
                  .sort((a, b) => b[1] - a[1])
                  .map(([fmt, count]) => {
                    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                    const color = BookFormatColors[fmt as BookFormat] ?? '#7F8C8D';
                    return (
                      <Box key={fmt} sx={{ mb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                            <Typography
                              variant="body2">{BookFormatLabels[fmt as BookFormat] ?? fmt.toUpperCase()}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">{count} ({pct}%)</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={pct}
                                        sx={{
                                          bgcolor: 'rgba(255,255,255,0.06)',
                                          '& .MuiLinearProgress-bar': { bgcolor: color }
                                        }} />
                      </Box>
                    );
                  })
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Tags and genres */}
        <Grid size={{
          xs: 12,
          md: 6
        }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Ulubione gatunki</Typography>
              {stats.topGenres.length === 0 ? (
                <Typography color="text.secondary" variant="body2">Dodaj gatunki do swoich książek.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                  {stats.topGenres.map(({ genre, count }) => (
                    <Tooltip key={genre} title={`${count} ${count === 1 ? 'książka' : 'książek'}`}>
                      <Chip label={genre} size="small" color="primary" variant="outlined" />
                    </Tooltip>
                  ))}
                </Box>
              )}

              <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>Popularne tagi</Typography>
              {stats.topTags.length === 0 ? (
                <Typography color="text.secondary" variant="body2">Dodaj tagi do swoich książek.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {stats.topTags.map(({ tag, count }) => (
                    <Tooltip key={tag} title={`${count} ${count === 1 ? 'książka' : 'książek'}`}>
                      <Chip label={tag} size="small" variant="outlined"
                            sx={{ borderColor: 'divider', color: 'text.secondary' }} />
                    </Tooltip>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
