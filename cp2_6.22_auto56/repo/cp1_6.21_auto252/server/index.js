import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const tours = [];
const shows = [];
const songs = [];

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Tours
app.get('/api/tours', (_req, res) => {
  res.json(tours);
});

app.post('/api/tours', (req, res) => {
  const tour = {
    id: uuidv4(),
    name: req.body.name,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    members: req.body.members || [],
  };
  tours.push(tour);
  res.status(201).json(tour);
});

app.get('/api/tours/:id', (req, res) => {
  const tour = tours.find((t) => t.id === req.params.id);
  if (!tour) return res.status(404).json({ error: 'Tour not found' });
  res.json(tour);
});

app.put('/api/tours/:id', (req, res) => {
  const idx = tours.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Tour not found' });
  tours[idx] = { ...tours[idx], ...req.body, id: tours[idx].id };
  res.json(tours[idx]);
});

app.delete('/api/tours/:id', (req, res) => {
  const idx = tours.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Tour not found' });

  const tourId = req.params.id;
  const relatedShowIds = shows.filter((s) => s.tourId === tourId).map((s) => s.id);

  for (let i = songs.length - 1; i >= 0; i--) {
    if (relatedShowIds.includes(songs[i].showId)) {
      songs.splice(i, 1);
    }
  }

  for (let i = shows.length - 1; i >= 0; i--) {
    if (shows[i].tourId === tourId) {
      shows.splice(i, 1);
    }
  }

  tours.splice(idx, 1);
  res.status(204).end();
});

// Shows
app.get('/api/shows', (req, res) => {
  const { tourId } = req.query;
  let result = shows;
  if (tourId) {
    result = shows.filter((s) => s.tourId === tourId);
  }
  res.json(result);
});

app.post('/api/shows', (req, res) => {
  const show = {
    id: uuidv4(),
    tourId: req.body.tourId,
    venue: req.body.venue,
    date: req.body.date,
    notes: req.body.notes || '',
  };
  shows.push(show);
  res.status(201).json(show);
});

app.get('/api/shows/:id', (req, res) => {
  const show = shows.find((s) => s.id === req.params.id);
  if (!show) return res.status(404).json({ error: 'Show not found' });
  res.json(show);
});

app.put('/api/shows/:id', (req, res) => {
  const idx = shows.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Show not found' });
  shows[idx] = { ...shows[idx], ...req.body, id: shows[idx].id };
  res.json(shows[idx]);
});

app.delete('/api/shows/:id', (req, res) => {
  const idx = shows.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Show not found' });

  const showId = req.params.id;
  for (let i = songs.length - 1; i >= 0; i--) {
    if (songs[i].showId === showId) {
      songs.splice(i, 1);
    }
  }

  shows.splice(idx, 1);
  res.status(204).end();
});

app.put('/api/shows/:id/songs-reorder', (req, res) => {
  const show = shows.find((s) => s.id === req.params.id);
  if (!show) return res.status(404).json({ error: 'Show not found' });

  const { songIds } = req.body;
  if (!Array.isArray(songIds)) return res.status(400).json({ error: 'songIds must be an array' });

  songIds.forEach((songId, order) => {
    const song = songs.find((s) => s.id === songId && s.showId === req.params.id);
    if (song) {
      song.order = order;
    }
  });

  const reordered = songs
    .filter((s) => s.showId === req.params.id)
    .sort((a, b) => a.order - b.order);
  res.json(reordered);
});

// Songs
app.get('/api/songs', (req, res) => {
  const { showId } = req.query;
  let result = songs;
  if (showId) {
    result = songs.filter((s) => s.showId === showId);
  }
  res.json(result);
});

app.post('/api/songs', (req, res) => {
  const song = {
    id: uuidv4(),
    showId: req.body.showId,
    name: req.body.name,
    duration: req.body.duration,
    order: req.body.order,
  };
  songs.push(song);
  res.status(201).json(song);
});

app.get('/api/songs/:id', (req, res) => {
  const song = songs.find((s) => s.id === req.params.id);
  if (!song) return res.status(404).json({ error: 'Song not found' });
  res.json(song);
});

app.put('/api/songs/:id', (req, res) => {
  const idx = songs.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Song not found' });
  songs[idx] = { ...songs[idx], ...req.body, id: songs[idx].id };
  res.json(songs[idx]);
});

app.delete('/api/songs/:id', (req, res) => {
  const idx = songs.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Song not found' });
  songs.splice(idx, 1);
  res.status(204).end();
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
