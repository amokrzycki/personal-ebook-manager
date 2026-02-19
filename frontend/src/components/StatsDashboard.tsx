import BookIcon from '@mui/icons-material/Book';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Skeleton,
  Typography
} from '@mui/material';
import React from 'react';
import { useStats } from '../hooks/useBooks';
import { ReadingStatusLabels } from '../types';

const StatCard: React.FC<{
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: string;
}> = ({ icon, value, label, color = 'primary.main' }) => (
  <Card>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'rgba(201,168,76,0.1)',
          color,
          display: 'flex'
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={700} color={color}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

export const StatsDashboard: React.FC = () => {
  const { data: stats, loading, error } = useStats();

  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error || !stats) return null;

  const total = stats.total;

  return (
    <Box>
      {/* Main statistic cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard icon={<BookIcon />} value={total} label="Wszystkich książek" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<DoneAllIcon />}
            value={stats.byStatus.finished}
            label="Przeczytanych"
            color="#5CB85C"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<StarIcon />}
            value={stats.avgRating ? `${stats.avgRating} / 5` : '—'}
            label="Średnia ocena"
            color="#C9A84C"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<TrendingUpIcon />}
            value={stats.totalPagesRead.toLocaleString('pl-PL')}
            label="Stron przeczytanych"
            color="#4A90D9"
          />
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
              <Typography variant="h6" gutterBottom>
                Rozkład statusów
              </Typography>
              {(Object.entries(stats.byStatus) as [string, number][])
                .filter(([, count]) => count > 0)
                .map(([status, count]) => {
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <Box key={status} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">
                          {ReadingStatusLabels[status as keyof typeof ReadingStatusLabels]}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {count} ({pct}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}
                      />
                    </Box>
                  );
                })}
            </CardContent>
          </Card>
        </Grid>

        {/* Top genres */}
        <Grid
          size={{
            xs: 12,
            md: 6
          }}
        >
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Najczęstsze gatunki
              </Typography>
              {stats.topGenres.length === 0 ? (
                <Typography color="text.secondary">
                  Dodaj gatunki do swoich książek, żeby zobaczyć statystyki.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {stats.topGenres.map(({ genre, count }) => (
                    <Chip
                      key={genre}
                      label={`${genre} (${count})`}
                      color="primary"
                      variant="outlined"
                    />
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
