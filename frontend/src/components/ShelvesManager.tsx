import AddIcon from '@mui/icons-material/Add';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, TextField, Tooltip, Typography
} from '@mui/material';
import React, { useState } from 'react';
import { useShelves } from '../hooks/useBooks';
import type { CreateShelfPayload, Shelf } from '../types';

// Predefiniowane kolory
const PRESET_COLORS = [
  '#4A90D9', '#C9A84C', '#E74C3C', '#27AE60',
  '#8E44AD', '#F39C12', '#16A085', '#2C3E50'
];

// Predefiniowane ikony (nazwy – renderujemy odpowiedni komponent)
const ICON_OPTIONS = [
  { name: 'bookmark', label: '🔖 Zakładka' },
  { name: 'star', label: '⭐ Gwiazda' },
  { name: 'favorite', label: '❤️ Ulubione' },
  { name: 'school', label: '🎓 Nauka' },
  { name: 'headphones', label: '🎧 Audiobooki' },
  { name: 'list', label: '📋 Lista' }
];

/** Komponent ikony półki */
const ShelfIconComponent: React.FC<{ icon: string; color?: string }> = ({ icon, color }) => {
  const sx = { color: color ?? 'inherit', fontSize: 20 };
  switch (icon) {
    case 'headphones':
      return <HeadphonesIcon sx={sx} />;
    case 'star':
      return <span style={{ fontSize: 18 }}>⭐</span>;
    case 'favorite':
      return <span style={{ fontSize: 18 }}>❤️</span>;
    case 'school':
      return <span style={{ fontSize: 18 }}>🎓</span>;
    case 'list':
      return <span style={{ fontSize: 18 }}>📋</span>;
    default:
      return <BookmarkIcon sx={sx} />;
  }
};

// ── Dialog tworzenia/edycji półki ────────────────────────────────────

interface ShelfDialogProps {
  open: boolean;
  editing?: Shelf | null;
  onClose: () => void;
  onSubmit: (payload: CreateShelfPayload) => Promise<void>;
}

const ShelfDialog: React.FC<ShelfDialogProps> = ({ open, editing, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState('bookmark');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description ?? '');
      setColor(editing.color);
      setIcon(editing.icon);
    } else {
      setName('');
      setDescription('');
      setColor(PRESET_COLORS[0]);
      setIcon('bookmark');
    }
    setError(null);
  }, [editing, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Nazwa półki jest wymagana');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() || undefined, color, icon });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Edytuj półkę' : 'Nowa półka'}</DialogTitle>
      <DialogContent>
        <TextField fullWidth label="Nazwa półki *" value={name}
                   onChange={(e) => setName(e.target.value)} sx={{ mt: 1, mb: 2 }} />
        <TextField fullWidth label="Opis (opcjonalnie)" value={description}
                   onChange={(e) => setDescription(e.target.value)} multiline rows={2} sx={{ mb: 2 }} />

        {/* Wybór koloru */}
        <Typography variant="subtitle2" gutterBottom>Kolor</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {PRESET_COLORS.map((c) => (
            <Box key={c} onClick={() => setColor(c)} sx={{
              width: 28, height: 28, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
              border: color === c ? '3px solid white' : '3px solid transparent',
              boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
              transition: 'all 0.15s'
            }} />
          ))}
        </Box>

        {/* Wybór ikony */}
        <Typography variant="subtitle2" gutterBottom>Ikona</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          {ICON_OPTIONS.map((o) => (
            <Chip key={o.name} label={o.label} size="small" onClick={() => setIcon(o.name)}
                  variant={icon === o.name ? 'filled' : 'outlined'} color={icon === o.name ? 'primary' : 'default'} />
          ))}
        </Box>

        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Anuluj</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={18} /> : editing ? 'Zapisz' : 'Utwórz'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Główny komponent ─────────────────────────────────────────────────

export const ShelvesManager: React.FC = () => {
  const { shelves, loading, error, addShelf, editShelf, removeShelf } = useShelves();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Shelf | null>(null);

  const handleSubmit = async (payload: CreateShelfPayload) => {
    if (editingShelf) {
      await editShelf(editingShelf.id, payload);
    } else {
      await addShelf(payload);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          {shelves.length === 0
            ? 'Nie masz jeszcze żadnych półek. Utwórz pierwszą!'
            : `${shelves.length} półek w bibliotece`}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}
                onClick={() => {
                  setEditingShelf(null);
                  setDialogOpen(true);
                }}>
          Nowa półka
        </Button>
      </Box>

      {shelves.length === 0 ? (
        <Box sx={{
          textAlign: 'center', py: 8, border: '2px dashed', borderColor: 'divider',
          borderRadius: 3, color: 'text.secondary'
        }}>
          <LibraryBooksIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
          <Typography variant="h6">Brak wirtualnych półek</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Utwórz półkę, aby organizować książki w kolekcje (np. „Do przeczytania w wakacje").
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {shelves.map((shelf) => (
            <Grid size={{
              xs: 12, sm: 6, md: 4
            }} key={shelf.id}>
              <Card sx={{
                borderLeft: `4px solid ${shelf.color}`,
                '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px rgba(0,0,0,0.3)` },
                transition: 'all 0.2s'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        p: 1, borderRadius: 1.5, bgcolor: shelf.color + '22',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <ShelfIconComponent icon={shelf.icon} color={shelf.color} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>{shelf.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {shelf.bookCount ?? 0} {shelf.bookCount === 1 ? 'książka' : 'książek'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Tooltip title="Edytuj półkę">
                        <IconButton size="small" onClick={() => {
                          setEditingShelf(shelf);
                          setDialogOpen(true);
                        }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Usuń półkę">
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(shelf)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {shelf.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} noWrap>
                      {shelf.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/edit dialog */}
      <ShelfDialog
        open={dialogOpen}
        editing={editingShelf}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      {/* Confirm delete */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Usuń półkę</DialogTitle>
        <DialogContent>
          <Typography>
            Czy na pewno chcesz usunąć półkę <strong>„{deleteTarget?.name}"</strong>?
            Książki pozostaną w bibliotece.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Anuluj</Button>
          <Button color="error" variant="contained" onClick={async () => {
            if (deleteTarget) {
              await removeShelf(deleteTarget.id);
              setDeleteTarget(null);
            }
          }}>Usuń</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
