import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const tracks = [
  {
    id: 'track-001',
    title: 'Midnight Jazz Cafe',
    artist: 'The Velvet Ensemble',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20vinyl%20record%20cover%20jazz%20cafe%20midnight%20warm%20orange%20lighting%20abstract&image_size=square',
    audioUrl: '',
    duration: 245
  },
  {
    id: 'track-002',
    title: 'Electric Dreams',
    artist: 'Neon Pulse',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=retro%20synthwave%20album%20cover%20electric%20purple%20blue%20neon%20grid%20sunset&image_size=square',
    audioUrl: '',
    duration: 198
  },
  {
    id: 'track-003',
    title: 'Folk Tales of Autumn',
    artist: 'Woodland Strings',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=folk%20music%20album%20cover%20autumn%20forest%20warm%20brown%20orange%20acoustic%20guitar&image_size=square',
    audioUrl: '',
    duration: 312
  },
  {
    id: 'track-004',
    title: 'Underground Beats',
    artist: 'Sub Bass Collective',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=underground%20hiphop%20album%20cover%20dark%20gritty%20urban%20street%20art%20graffiti&image_size=square',
    audioUrl: '',
    duration: 223
  },
  {
    id: 'track-005',
    title: 'Cosmic Drift',
    artist: 'Stellar Voyager',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ambient%20space%20music%20album%20cover%20deep%20blue%20purple%20galaxy%20stars%20nebula&image_size=square',
    audioUrl: '',
    duration: 367
  },
  {
    id: 'track-006',
    title: 'Soulful Rain',
    artist: 'Melody Blue',
    coverUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=soul%20music%20album%20cover%20rainy%20window%20blue%20moody%20vintage%20microphone&image_size=square',
    audioUrl: '',
    duration: 278
  }
];

let favorites = [];

app.get('/music/tracks', (req, res) => {
  res.json(tracks);
});

app.get('/music/favorites', (req, res) => {
  res.json(favorites);
});

app.post('/music/favorites', (req, res) => {
  const { trackId } = req.body;
  if (!trackId) {
    return res.status(400).json({ success: false, message: 'trackId is required' });
  }
  const existing = favorites.find(f => f.trackId === trackId);
  if (existing) {
    return res.json({ success: true, id: existing.id, message: 'Already in favorites' });
  }
  const favorite = {
    id: uuidv4(),
    trackId,
    createdAt: Date.now()
  };
  favorites.push(favorite);
  res.json({ success: true, id: favorite.id });
});

app.delete('/music/favorites/:id', (req, res) => {
  const { id } = req.params;
  const index = favorites.findIndex(f => f.id === id || f.trackId === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Favorite not found' });
  }
  favorites.splice(index, 1);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Vinyl Turntable API server running on http://localhost:${PORT}`);
});
