import express from 'express';
import cors from 'cors';
import { generatePlaylist, Song, mockSongs } from './songLogic.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let favorites: Song[] = [];

app.get('/api/generate', (req, res) => {
  const { scene, mood } = req.query;
  
  if (!scene || !mood) {
    return res.status(400).json({ error: 'Scene and mood parameters are required' });
  }

  const playlist = generatePlaylist(scene as string, mood as string, 5);
  
  res.json(playlist);
});

app.get('/api/favorites', (_req, res) => {
  res.json(favorites);
});

app.post('/api/favorites', (req, res) => {
  const { songId } = req.body;
  
  if (!songId) {
    return res.status(400).json({ error: 'songId is required' });
  }

  const song = mockSongs.find(s => s.id === songId);
  
  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  const exists = favorites.find(s => s.id === songId);
  if (exists) {
    return res.status(409).json({ error: 'Song already in favorites' });
  }

  favorites.push(song);
  res.status(201).json(song);
});

app.delete('/api/favorites/:songId', (req, res) => {
  const { songId } = req.params;
  
  const index = favorites.findIndex(s => s.id === songId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Favorite not found' });
  }

  const removed = favorites.splice(index, 1)[0];
  res.json(removed);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
