import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BarChartIcon from '@mui/icons-material/BarChart';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import {
  AppBar, Box, Container, CssBaseline,
  Tab, Tabs, ThemeProvider, Toolbar, Typography
} from '@mui/material';
import { useState } from 'react';
import { BookShelf } from './components/Bookshelf';
import { RecommendationsPanel } from './components/RecommendationsPanel';
import { ShelvesManager } from './components/ShelvesManager';
import { StatsDashboard } from './components/StatsDashboard';
import { theme } from './theme';

const TABS = [
  { label: 'Biblioteka', icon: <LibraryBooksIcon /> },
  { label: 'Półki', icon: <BookmarkIcon /> },
  { label: 'Statystyki', icon: <BarChartIcon /> },
  { label: 'Rekomendacje', icon: <AutoAwesomeIcon /> }
];

const App = () => {
  const [tab, setTab] = useState(0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppBar position="sticky" elevation={0}
              sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Toolbar sx={{ gap: 2 }}>
          <MenuBookIcon sx={{ color: 'primary.main', fontSize: 30 }} />
          <Typography variant="h5" sx={{
            fontFamily: '"Playfair Display", serif', color: 'primary.main',
            fontWeight: 700, letterSpacing: '0.02em', mr: 'auto'
          }}>
            BookShelf
          </Typography>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
            '& .MuiTab-root': { minHeight: 64, textTransform: 'none', fontWeight: 500, minWidth: 100 },
            '& .Mui-selected': { color: 'primary.main' },
            '& .MuiTabs-indicator': { bgcolor: 'primary.main' }
          }}>
            {TABS.map((t) => (
              <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start" />
            ))}
          </Tabs>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{
        minHeight: '100vh', bgcolor: 'background.default',
        backgroundImage: `
          linear-gradient(rgba(201,168,76,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(201,168,76,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {tab === 0 && (
            <Box>
              <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>Moja Biblioteka</Typography>
              <BookShelf />
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <Typography variant="h4" gutterBottom sx={{ mb: 1 }}>Wirtualne Półki</Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Organizuj książki w kolekcje tematyczne. Jedna książka może być na wielu półkach jednocześnie.
              </Typography>
              <ShelvesManager />
            </Box>
          )}

          {tab === 2 && (
            <Box>
              <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>Statystyki Czytelnictwa</Typography>
              <StatsDashboard />
            </Box>
          )}

          {tab === 3 && (
            <Box>
              <Typography variant="h4" gutterBottom sx={{ mb: 1 }}>Rekomendacje dla Ciebie</Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Analizuję Twoje ulubione gatunki, tagi i autorów. Propozycje z biblioteki + Google Books API.
              </Typography>
              <RecommendationsPanel />
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
