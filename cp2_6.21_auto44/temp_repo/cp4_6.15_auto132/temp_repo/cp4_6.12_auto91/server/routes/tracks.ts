import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { tracksMap, commentsMap } from '../index';
import type { Track, TrackWithCounts } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'public', 'uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'track-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/ogg') {
    cb(null, true);
  } else {
    cb(new Error('Only MP3 and OGG files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

const generateWaveform = (): number[] => {
  return Array.from({ length: 40 }, () => Math.random());
};

const getCommentCount = (trackId: string): number => {
  let count = 0;
  for (const comment of commentsMap.values()) {
    if (comment.targetId === trackId && comment.targetType === 'track') {
      count++;
    }
  }
  return count;
};

router.get('/', (_req: Request, res: Response<TrackWithCounts[]>) => {
  const tracks = Array.from(tracksMap.values()).map(track => ({
    ...track,
    commentCount: getCommentCount(track.id),
  }));
  res.json(tracks);
});

router.post('/', upload.single('audio'), (req: Request, res: Response<Track | { error: string }>) => {
  try {
    const { title, artist, coverUrl } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ error: 'Title and artist are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const audioUrl = `/uploads/${req.file.filename}`;

    const newTrack: Track = {
      id: uuidv4(),
      title,
      artist,
      coverUrl: coverUrl || `https://picsum.photos/seed/${uuidv4()}/300/300`,
      audioUrl,
      waveformData: generateWaveform(),
      likes: 0,
      createdAt: new Date(),
    };

    tracksMap.set(newTrack.id, newTrack);
    res.status(201).json(newTrack);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to upload track' });
    }
  }
});

router.get('/:id', (req: Request, res: Response<Track | { error: string }>) => {
  const { id } = req.params;
  const track = tracksMap.get(id);

  if (!track) {
    return res.status(404).json({ error: 'Track not found' });
  }

  res.json(track);
});

router.post('/:id/like', (req: Request, res: Response<Track | { error: string }>) => {
  const { id } = req.params;
  const track = tracksMap.get(id);

  if (!track) {
    return res.status(404).json({ error: 'Track not found' });
  }

  track.likes += 1;
  tracksMap.set(id, track);
  res.json(track);
});

router.delete('/:id', (req: Request, res: Response<{ message: string } | { error: string }>) => {
  const { id } = req.params;

  if (!tracksMap.has(id)) {
    return res.status(404).json({ error: 'Track not found' });
  }

  tracksMap.delete(id);
  res.json({ message: 'Track deleted successfully' });
});

export default router;
