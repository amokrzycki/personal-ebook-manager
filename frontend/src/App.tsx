import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BarChartIcon from '@mui/icons-material/BarChart';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Tab,
  Tabs,
  ThemeProvider,
  Toolbar,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { BookShelf } from './components/Bookshelf';
import { RecommendationsPanel } from './components/RecommendationsPanel';
import { StatsDashboard } from './components/StatsDashboard';
import { theme } from './theme';

const NAV_TABS = [
  { label: 'Moja Biblioteka', icon: <LibraryBooksIcon /> },
  { label: 'Statystyki', icon: <BarChartIcon /> },
  { label: 'Rekomendacje', icon: <AutoAwesomeIcon /> },
];

const App = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <MenuBookIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"Playfair Display", serif',
              color: 'primary.main',
              fontWeight: 700,
              letterSpacing: '0.02em',
              mr: 'auto',
            }}
          >
            BookShelf
          </Typography>

          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              '& .MuiTab-root': { minHeight: 64, textTransform: 'none', fontWeight: 500 },
              '& .Mui-selected': { color: 'primary.main' },
              '& .MuiTabs-indicator': { bgcolor: 'primary.main' },
            }}
          >
            {NAV_TABS.map((tab) => (
              <Tab key={tab.label} label={tab.label} icon={tab.icon} iconPosition="start" />
            ))}
          </Tabs>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          backgroundImage: `
            linear-gradient(rgba(201,168,76,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(201,168,76,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Moja Biblioteka
              </Typography>
              <BookShelf />
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Statystyki Biblioteki
              </Typography>
              <StatsDashboard />
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h4" gutterBottom>
                Rekomendacje dla Ciebie
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Propozycje oparte na Twoich ulubionych gatunkach i tagach.
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
