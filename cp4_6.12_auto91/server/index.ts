import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type { Track, Blog, Comment } from './types';
import tracksRouter from './routes/tracks';
import blogsRouter from './routes/blogs';
import commentsRouter from './routes/comments';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

export const tracksMap = new Map<string, Track>();
export const blogsMap = new Map<string, Blog>();
export const commentsMap = new Map<string, Comment>();

const generateWaveform = (): number[] => {
  return Array.from({ length: 40 }, () => Math.random());
};

const mockTracks: Track[] = [
  {
    id: uuidv4(),
    title: 'Midnight Dreams',
    artist: 'Luna Echo',
    coverUrl: 'https://picsum.photos/seed/track1/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    waveformData: generateWaveform(),
    likes: 42,
    createdAt: new Date('2026-01-15'),
  },
  {
    id: uuidv4(),
    title: 'Ocean Waves',
    artist: 'Calm Seas',
    coverUrl: 'https://picsum.photos/seed/track2/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    waveformData: generateWaveform(),
    likes: 128,
    createdAt: new Date('2026-02-20'),
  },
  {
    id: uuidv4(),
    title: 'Electric Sunrise',
    artist: 'Neon Pulse',
    coverUrl: 'https://picsum.photos/seed/track3/300/300',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    waveformData: generateWaveform(),
    likes: 89,
    createdAt: new Date('2026-03-10'),
  },
];

const mockBlogs: Blog[] = [
  {
    id: uuidv4(),
    title: 'The Future of Electronic Music',
    content: 'Electronic music has evolved significantly over the past decade. From underground clubs to mainstream festivals, the genre continues to push boundaries and innovate with new technologies.',
    coverUrl: 'https://picsum.photos/seed/blog1/800/400',
    author: 'Alex Johnson',
    createdAt: new Date('2026-01-20'),
  },
  {
    id: uuidv4(),
    title: 'Producing Music at Home: A Beginner\'s Guide',
    content: 'Getting started with music production has never been easier. With affordable software and hardware options, anyone can create professional-sounding tracks from the comfort of their own home.',
    coverUrl: 'https://picsum.photos/seed/blog2/800/400',
    author: 'Sarah Miller',
    createdAt: new Date('2026-02-15'),
  },
];

const trackIds = mockTracks.map(t => t.id);
const blogIds = mockBlogs.map(b => b.id);

const mockComments: Comment[] = [
  {
    id: uuidv4(),
    targetId: trackIds[0],
    targetType: 'track',
    content: 'Absolutely love this track! The melody is hauntingly beautiful.',
    author: 'MusicFan123',
    approved: true,
    createdAt: new Date('2026-01-16'),
  },
  {
    id: uuidv4(),
    targetId: trackIds[0],
    targetType: 'track',
    content: 'Great production quality. Can\'t wait for more releases!',
    author: 'ProducerX',
    approved: true,
    createdAt: new Date('2026-01-18'),
  },
  {
    id: uuidv4(),
    targetId: blogIds[0],
    targetType: 'blog',
    content: 'Very insightful article. I agree with your points about AI in music production.',
    author: 'TechReader',
    approved: false,
    createdAt: new Date('2026-01-21'),
  },
];

mockTracks.forEach(track => tracksMap.set(track.id, track));
mockBlogs.forEach(blog => blogsMap.set(blog.id, blog));
mockComments.forEach(comment => commentsMap.set(comment.id, comment));

app.use('/api/tracks', tracksRouter);
app.use('/api/blogs', blogsRouter);
app.use('/api/comments', commentsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
