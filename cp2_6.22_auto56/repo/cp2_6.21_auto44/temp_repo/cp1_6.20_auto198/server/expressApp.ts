import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response } from 'express';

const app = express();
app.use(cors());
app.use(express.json());

interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  coverUrl: string;
}

interface UserPlaylist {
  userId: string;
  songs: Song[];
}

interface Participant {
  id: string;
  name: string;
  playlist: Song[];
  color: string;
}

interface Room {
  id: string;
  name: string;
  participants: Participant[];
  progress: number;
  generatedPlaylist: { song: Song; matchScore: number }[] | null;
}

const genres = ['流行', '摇滚', '电子', '古典', '嘻哈', 'R&B', '爵士', '民谣'];
const genreColors: Record<string, string> = {
  '流行': '#f48fb1',
  '摇滚': '#90a4ae',
  '电子': '#ce93d8',
  '古典': '#a5d6a7',
  '嘻哈': '#ffcc80',
  'R&B': '#81c784',
  '爵士': '#64b5f6',
  '民谣': '#dce775',
};

const randomColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe'];

const coverUrls = [
  'https://picsum.photos/seed/music1/300/300',
  'https://picsum.photos/seed/music2/300/300',
  'https://picsum.photos/seed/music3/300/300',
  'https://picsum.photos/seed/music4/300/300',
  'https://picsum.photos/seed/music5/300/300',
  'https://picsum.photos/seed/music6/300/300',
  'https://picsum.photos/seed/music7/300/300',
  'https://picsum.photos/seed/music8/300/300',
  'https://picsum.photos/seed/music9/300/300',
  'https://picsum.photos/seed/music10/300/300',
];

const songTitles = [
  { title: '夜空中最亮的星', artist: '逃跑计划', genre: '摇滚' },
  { title: '晴天', artist: '周杰伦', genre: '流行' },
  { title: '稻香', artist: '周杰伦', genre: '流行' },
  { title: 'Faded', artist: 'Alan Walker', genre: '电子' },
  { title: 'Alone', artist: 'Alan Walker', genre: '电子' },
  { title: 'Shape of You', artist: 'Ed Sheeran', genre: '流行' },
  { title: 'Perfect', artist: 'Ed Sheeran', genre: '流行' },
  { title: 'Bohemian Rhapsody', artist: 'Queen', genre: '摇滚' },
  { title: 'We Will Rock You', artist: 'Queen', genre: '摇滚' },
  { title: 'Moonlight Sonata', artist: 'Beethoven', genre: '古典' },
  { title: 'Clair de Lune', artist: 'Debussy', genre: '古典' },
  { title: 'Lose Yourself', artist: 'Eminem', genre: '嘻哈' },
  { title: 'Stan', artist: 'Eminem', genre: '嘻哈' },
  { title: 'Blinding Lights', artist: 'The Weeknd', genre: 'R&B' },
  { title: 'Starboy', artist: 'The Weeknd', genre: 'R&B' },
  { title: 'Take Five', artist: 'Dave Brubeck', genre: '爵士' },
  { title: 'So What', artist: 'Miles Davis', genre: '爵士' },
  { title: '成都', artist: '赵雷', genre: '民谣' },
  { title: '南方姑娘', artist: '赵雷', genre: '民谣' },
  { title: '春风十里', artist: '鹿先森乐队', genre: '民谣' },
  { title: 'Someone Like You', artist: 'Adele', genre: '流行' },
  { title: 'Hello', artist: 'Adele', genre: '流行' },
  { title: 'Smells Like Teen Spirit', artist: 'Nirvana', genre: '摇滚' },
  { title: 'Come As You Are', artist: 'Nirvana', genre: '摇滚' },
  { title: 'Titanium', artist: 'David Guetta', genre: '电子' },
  { title: 'Wake Me Up', artist: 'Avicii', genre: '电子' },
  { title: 'Levels', artist: 'Avicii', genre: '电子' },
  { title: 'Symphony No. 9', artist: 'Beethoven', genre: '古典' },
  { title: 'Canon in D', artist: 'Pachelbel', genre: '古典' },
  { title: 'Not Afraid', artist: 'Eminem', genre: '嘻哈' },
  { title: 'In Da Club', artist: '50 Cent', genre: '嘻哈' },
  { title: 'The Hills', artist: 'The Weeknd', genre: 'R&B' },
  { title: 'Earned It', artist: 'The Weeknd', genre: 'R&B' },
  { title: 'Fly Me to the Moon', artist: 'Frank Sinatra', genre: '爵士' },
  { title: 'My Way', artist: 'Frank Sinatra', genre: '爵士' },
  { title: '安和桥', artist: '宋冬野', genre: '民谣' },
  { title: '董小姐', artist: '宋冬野', genre: '民谣' },
  { title: 'Uptown Funk', artist: 'Bruno Mars', genre: '流行' },
  { title: '24K Magic', artist: 'Bruno Mars', genre: '流行' },
  { title: 'Hotel California', artist: 'Eagles', genre: '摇滚' },
  { title: 'Take It Easy', artist: 'Eagles', genre: '摇滚' },
  { title: 'Dynamite', artist: 'BTS', genre: '流行' },
  { title: 'Butter', artist: 'BTS', genre: '流行' },
  { title: 'Sandstorm', artist: 'Darude', genre: '电子' },
  { title: 'In the End', artist: 'Linkin Park', genre: '摇滚' },
  { title: 'Numb', artist: 'Linkin Park', genre: '摇滚' },
  { title: 'Thank U, Next', artist: 'Ariana Grande', genre: '流行' },
  { title: '7 Rings', artist: 'Ariana Grande', genre: '流行' },
  { title: 'Swimming Pools', artist: 'Kendrick Lamar', genre: '嘻哈' },
  { title: 'HUMBLE.', artist: 'Kendrick Lamar', genre: '嘻哈' },
];

const songs: Song[] = songTitles.map((s, i) => ({
  id: uuidv4(),
  title: s.title,
  artist: s.artist,
  genre: s.genre,
  duration: 180 + Math.floor(Math.random() * 120),
  coverUrl: coverUrls[i % coverUrls.length],
}));

const userPlaylists: UserPlaylist[] = [];
const rooms: Room[] = [];

app.get('/api/songs', (req: Request, res: Response) => {
  res.json(songs);
});

app.post('/api/search', (req: Request, res: Response) => {
  const { query } = req.body as { query: string };
  if (!query || query.trim() === '') {
    return res.json([]);
  }
  const q = query.toLowerCase().trim();
  const results = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      song.genre.toLowerCase().includes(q)
  );
  res.json(results.slice(0, 10));
});

app.post('/api/playlist', (req: Request, res: Response) => {
  const { userId, songs: playlistSongs } = req.body as { userId: string; songs: Song[] };
  let playlist = userPlaylists.find((p) => p.userId === userId);
  if (!playlist) {
    playlist = { userId, songs: [] };
    userPlaylists.push(playlist);
  }
  playlist.songs = playlistSongs;
  res.json({ success: true, playlist: playlist.songs });
});

app.post('/api/room', (req: Request, res: Response) => {
  const { name, participants: participantNames } = req.body as {
    name: string;
    participants: string[];
  };

  const participants: Participant[] = participantNames.map((pName, idx) => {
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    const seedPlaylist = shuffled.slice(0, 10);
    return {
      id: uuidv4(),
      name: pName,
      playlist: seedPlaylist,
      color: randomColors[idx % randomColors.length],
    };
  });

  const room: Room = {
    id: uuidv4(),
    name,
    participants,
    progress: 0,
    generatedPlaylist: null,
  };

  rooms.push(room);
  res.json(room);
});

app.post('/api/room/generate', (req: Request, res: Response) => {
  const { roomId } = req.body as { roomId: string };
  const room = rooms.find((r) => r.id === roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const allSongs = new Map<string, Song>();
  room.participants.forEach((p) => {
    p.playlist.forEach((song) => {
      allSongs.set(song.id, song);
    });
  });

  const genreFreq = new Map<string, number>();
  const artistFreq = new Map<string, number>();
  const durations: number[] = [];
  let totalSongs = 0;

  room.participants.forEach((p) => {
    p.playlist.forEach((song) => {
      genreFreq.set(song.genre, (genreFreq.get(song.genre) || 0) + 1);
      artistFreq.set(song.artist, (artistFreq.get(song.artist) || 0) + 1);
      durations.push(song.duration);
      totalSongs++;
    });
  });

  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

  const scoredSongs: { song: Song; matchScore: number }[] = [];

  allSongs.forEach((song) => {
    const genreCount = genreFreq.get(song.genre) || 0;
    const genreSimilarity = totalSongs > 0 ? genreCount / totalSongs : 0;

    const artistCount = artistFreq.get(song.artist) || 0;
    const artistOverlap = totalSongs > 0 ? artistCount / totalSongs : 0;

    const durationDiff = Math.abs(song.duration - avgDuration);
    const maxDiff = 300;
    const durationMatch = Math.max(0, 1 - durationDiff / maxDiff);

    const finalScore = genreSimilarity * 0.6 + artistOverlap * 0.2 + durationMatch * 0.2;
    const matchPercentage = Math.round(finalScore * 100);

    scoredSongs.push({ song, matchScore: matchPercentage });
  });

  scoredSongs.sort((a, b) => b.matchScore - a.matchScore);
  const top15 = scoredSongs.slice(0, 15);

  room.progress = 100;
  room.generatedPlaylist = top15;

  res.json({ room, playlist: top15 });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
