import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { fileURLToPath } from 'url';

import db from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const JWT_SECRET = 'synthwave-secret-key';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const audioTypes = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/mp4',
  'audio/webm',
  'audio/x-m4a',
];

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (audioTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

function getAudioDuration(_filePath: string): number {
  return 0;
}

interface AuthRequest extends express.Request {
  userId?: string;
}

function authMiddleware(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/auth/register', (req: express.Request, res: express.Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Email, password, and name are required' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const id = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)').run(
    id,
    email,
    passwordHash,
    name,
  );

  const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    user: { id, email, name },
    token,
  });
});

app.post('/api/auth/login', (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
    | { id: string; email: string; password_hash: string; name: string }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    token,
  });
});

app.post(
  '/api/tracks',
  authMiddleware,
  upload.single('file'),
  (req: AuthRequest, res: express.Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'Audio file is required' });
      return;
    }

    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Track name is required' });
      return;
    }

    const id = uuidv4();
    const filePath = req.file.filename;
    const duration = getAudioDuration(path.join(uploadsDir, filePath));

    db.prepare(
      'INSERT INTO tracks (id, user_id, name, duration, file_path) VALUES (?, ?, ?, ?, ?)',
    ).run(id, req.userId, name, duration, filePath);

    res.status(201).json({
      id,
      userId: req.userId,
      name,
      duration,
      filePath,
    });
  },
);

app.get('/api/tracks', authMiddleware, (req: AuthRequest, res: express.Response) => {
  const tracks = db.prepare('SELECT * FROM tracks WHERE user_id = ?').all(req.userId);
  res.json(tracks);
});

app.get('/api/tracks/:id', authMiddleware, (req: AuthRequest, res: express.Response) => {
  const track = db
    .prepare('SELECT * FROM tracks WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId) as
    | { id: string; user_id: string; name: string; duration: number; file_path: string }
    | undefined;

  if (!track) {
    res.status(404).json({ error: 'Track not found' });
    return;
  }

  res.json(track);
});

app.post(
  '/api/tracks/:trackId/snapshots',
  authMiddleware,
  (req: AuthRequest, res: express.Response) => {
    const { trackId } = req.params;
    const { time, params } = req.body;

    if (time === undefined || !params) {
      res.status(400).json({ error: 'Time and params are required' });
      return;
    }

    const track = db
      .prepare('SELECT id FROM tracks WHERE id = ? AND user_id = ?')
      .get(trackId, req.userId);
    if (!track) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }

    const id = uuidv4();
    const paramsStr = typeof params === 'string' ? params : JSON.stringify(params);

    db.prepare('INSERT INTO mix_snapshots (id, track_id, time, params) VALUES (?, ?, ?, ?)').run(
      id,
      trackId,
      time,
      paramsStr,
    );

    res.status(201).json({ id, trackId, time, params: paramsStr });
  },
);

app.get(
  '/api/tracks/:trackId/snapshots',
  authMiddleware,
  (req: AuthRequest, res: express.Response) => {
    const { trackId } = req.params;

    const track = db
      .prepare('SELECT id FROM tracks WHERE id = ? AND user_id = ?')
      .get(trackId, req.userId);
    if (!track) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }

    const snapshots = db
      .prepare('SELECT * FROM mix_snapshots WHERE track_id = ?')
      .all(trackId);
    res.json(snapshots);
  },
);

app.put('/api/snapshots/:id', authMiddleware, (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const { time, params } = req.body;

  const snapshot = db
    .prepare(
      `SELECT ms.* FROM mix_snapshots ms
       JOIN tracks t ON ms.track_id = t.id
       WHERE ms.id = ? AND t.user_id = ?`,
    )
    .get(id, req.userId) as { id: string; time: number; params: string } | undefined;

  if (!snapshot) {
    res.status(404).json({ error: 'Snapshot not found' });
    return;
  }

  const updatedTime = time !== undefined ? time : snapshot.time;
  const updatedParams = params !== undefined
    ? (typeof params === 'string' ? params : JSON.stringify(params))
    : snapshot.params;

  db.prepare('UPDATE mix_snapshots SET time = ?, params = ? WHERE id = ?').run(
    updatedTime,
    updatedParams,
    id,
  );

  res.json({ id, time: updatedTime, params: updatedParams });
});

app.delete('/api/snapshots/:id', authMiddleware, (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;

  const snapshot = db
    .prepare(
      `SELECT ms.* FROM mix_snapshots ms
       JOIN tracks t ON ms.track_id = t.id
       WHERE ms.id = ? AND t.user_id = ?`,
    )
    .get(id, req.userId);

  if (!snapshot) {
    res.status(404).json({ error: 'Snapshot not found' });
    return;
  }

  db.prepare('DELETE FROM mix_snapshots WHERE id = ?').run(id);
  res.json({ message: 'Snapshot deleted' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
