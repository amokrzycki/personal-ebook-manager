/**
 * theme/index.ts
 * ──────────────
 * Konfiguracja motywu Material UI.
 *
 * Paleta: ciemny motyw oparty na głębokim atramentowym granatowyu (#0D1B2A)
 * z akcentami w kolorze antycznego złota (#C9A84C) – nawiązanie do okładek
 * klasycznych, luksusowych edycji książek.
 *
 * Typografia: Playfair Display (nagłówki) + Lato (treść) – para łącząca
 * elegancki serif z czytelnym sans-serif.
 */

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#C9A84C', // antyczne złoto
      light: '#E2C47A',
      dark: '#9E7A2E',
      contrastText: '#0D1B2A',
    },
    secondary: {
      main: '#4A90D9', // stalowy błękit
      light: '#7BB3E8',
      dark: '#2C6BAD',
    },
    background: {
      default: '#0D1B2A', // głęboki granat
      paper: '#152233', // nieco jaśniejszy dla kart
    },
    text: {
      primary: '#EAE0CC', // kremowa biel – jak papier
      secondary: '#9BA8B5',
    },
    success: { main: '#5CB85C' },
    warning: { main: '#F0AD4E' },
    info: { main: '#5BC0DE' },
    divider: 'rgba(201, 168, 76, 0.15)',
  },

  typography: {
    // Playfair Display wymaga importu z Google Fonts w index.html
    fontFamily: '"Lato", "Helvetica Neue", sans-serif',
    h1: { fontFamily: '"Playfair Display", serif', fontWeight: 700 },
    h2: { fontFamily: '"Playfair Display", serif', fontWeight: 700 },
    h3: { fontFamily: '"Playfair Display", serif', fontWeight: 600 },
    h4: { fontFamily: '"Playfair Display", serif', fontWeight: 600 },
    h5: { fontFamily: '"Playfair Display", serif', fontWeight: 500 },
    h6: { fontFamily: '"Playfair Display", serif', fontWeight: 500 },
  },

  shape: { borderRadius: 8 },

  components: {
    // Karty z subtelnym obramowaniem w kolorze złota
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(201, 168, 76, 0.12)',
          backgroundImage: 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
        },
      },
    },

    // Przyciski z efektem shine przy hover
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: 'linear-gradient(135deg, #C9A84C 0%, #E2C47A 100%)',
          color: '#0D1B2A',
          fontWeight: 700,
          letterSpacing: '0.05em',
        },
      },
    },

    // Chip – tagi i gatunki
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },

    // LinearProgress – pasek postępu czytania
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 6 },
        bar: {
          background: 'linear-gradient(90deg, #C9A84C, #E2C47A)',
          borderRadius: 4,
        },
      },
    },
  },
});
