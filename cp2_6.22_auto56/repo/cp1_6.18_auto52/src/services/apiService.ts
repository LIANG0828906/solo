export interface Song {
  id: string;
  name: string;
  artist: string;
  duration: number;
  cover: string;
  genre: string;
}

export interface Playlist {
  id: string;
  name: string;
  cover: string;
  songs: Song[];
  createdAt: number;
  shareCount: number;
}

const SONG_DB: Song[] = [
  { id: 's1', name: 'Midnight City', artist: 'M83', duration: 243, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=synthwave%20city%20night%20neon%20digital%20art&image_size=square', genre: 'Electronic' },
  { id: 's2', name: 'Blinding Lights', artist: 'The Weeknd', duration: 200, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=neon%20lights%20retro%2080s%20synth&image_size=square', genre: 'Pop' },
  { id: 's3', name: 'Bohemian Rhapsody', artist: 'Queen', duration: 354, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=opera%20rock%20stage%20dramatic&image_size=square', genre: 'Rock' },
  { id: 's4', name: 'Take Five', artist: 'Dave Brubeck', duration: 324, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=jazz%20saxophone%20smoky%20club&image_size=square', genre: 'Jazz' },
  { id: 's5', name: 'Lose Yourself', artist: 'Eminem', duration: 326, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=urban%20street%20microphone%20hip%20hop&image_size=square', genre: 'Hip-Hop' },
  { id: 's6', name: 'No Scrubs', artist: 'TLC', duration: 220, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=90s%20rnb%20soul%20golden&image_size=square', genre: 'R&B' },
  { id: 's7', name: 'Clair de Lune', artist: 'Debussy', duration: 312, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=moonlight%20piano%20classical%20elegant&image_size=square', genre: 'Classical' },
  { id: 's8', name: 'Strobe', artist: 'Deadmau5', duration: 637, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=electronic%20strobe%20lights%20dance&image_size=square', genre: 'Electronic' },
  { id: 's9', name: 'Shape of You', artist: 'Ed Sheeran', duration: 234, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pop%20guitar%20vibrant%20colorful&image_size=square', genre: 'Pop' },
  { id: 's10', name: 'Hotel California', artist: 'Eagles', duration: 391, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=desert%20hotel%20sunset%20rock&image_size=square', genre: 'Rock' },
  { id: 's11', name: 'So What', artist: 'Miles Davis', duration: 562, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=trumpet%20jazz%20blue%20night&image_size=square', genre: 'Jazz' },
  { id: 's12', name: 'HUMBLE.', artist: 'Kendrick Lamar', duration: 177, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=bold%20graffiti%20urban%20hip%20hop&image_size=square', genre: 'Hip-Hop' },
  { id: 's13', name: 'Kiss of Life', artist: 'Sade', duration: 282, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=silk%20smooth%20rnb%20warm&image_size=square', genre: 'R&B' },
  { id: 's14', name: 'Four Seasons: Spring', artist: 'Vivaldi', duration: 196, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=spring%20violin%20orchestra%20nature&image_size=square', genre: 'Classical' },
  { id: 's15', name: 'Around the World', artist: 'Daft Punk', duration: 458, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=daft%20punk%20helmet%20electronic%20disco&image_size=square', genre: 'Electronic' },
  { id: 's16', name: 'Levitating', artist: 'Dua Lipa', duration: 203, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=disco%20ball%20pop%20glitter&image_size=square', genre: 'Pop' },
  { id: 's17', name: 'Stairway to Heaven', artist: 'Led Zeppelin', duration: 482, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stairway%20misty%20mountain%20rock&image_size=square', genre: 'Rock' },
  { id: 's18', name: 'A Love Supreme', artist: 'John Coltrane', duration: 495, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=saxophone%20spiritual%20jazz%20deep&image_size=square', genre: 'Jazz' },
  { id: 's19', name: 'Alright', artist: 'Kendrick Lamar', duration: 218, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=protest%20street%20hip%20hop%20powerful&image_size=square', genre: 'Hip-Hop' },
  { id: 's20', name: 'Say My Name', artist: 'Destiny\'s Child', duration: 253, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=girl%20group%202000s%20rnb%20glamour&image_size=square', genre: 'R&B' },
  { id: 's21', name: 'Moonlight Sonata', artist: 'Beethoven', duration: 426, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=moonlight%20piano%20dark%20classical&image_size=square', genre: 'Classical' },
  { id: 's22', name: 'Scary Monsters', artist: 'Skrillex', duration: 243, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=monster%20bass%20drop%20electronic&image_size=square', genre: 'Electronic' },
  { id: 's23', name: 'Watermelon Sugar', artist: 'Harry Styles', duration: 174, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=watermelon%20summer%20pop%20retro&image_size=square', genre: 'Pop' },
  { id: 's24', name: 'Smells Like Teen Spirit', artist: 'Nirvana', duration: 301, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=grunge%20teen%20rebellion%20rock&image_size=square', genre: 'Rock' },
  { id: 's25', name: 'My Favorite Things', artist: 'John Coltrane', duration: 812, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=jazz%20favorite%20things%20colorful&image_size=square', genre: 'Jazz' },
  { id: 's26', name: 'DNA.', artist: 'Kendrick Lamar', duration: 186, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=DNA%20double%20helix%20hip%20hop&image_size=square', genre: 'Hip-Hop' },
  { id: 's27', name: 'Untitled (How Does It Feel)', artist: 'D\'Angelo', duration: 462, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=soulful%20rnb%20silhouette%20warm&image_size=square', genre: 'R&B' },
  { id: 's28', name: 'Swan Lake', artist: 'Tchaikovsky', duration: 387, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=swan%20lake%20ballet%20classical&image_size=square', genre: 'Classical' },
  { id: 's29', name: 'Midnight Pretending', artist: 'Tame Impala', duration: 274, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=psychedelic%20midnight%20indie&image_size=square', genre: 'Electronic' },
  { id: 's30', name: 'As It Was', artist: 'Harry Styles', duration: 167, cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=vintage%20pop%20nostalgia%20pastel&image_size=square', genre: 'Pop' },
];

const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: 'p1',
    name: '深夜电子',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=neon%20city%20night%20electronic%20music&image_size=square',
    songs: [SONG_DB[0], SONG_DB[7], SONG_DB[14], SONG_DB[21], SONG_DB[28]],
    createdAt: Date.now() - 86400000,
    shareCount: 3,
  },
  {
    id: 'p2',
    name: '经典摇滚',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rock%20guitar%20fire%20classic&image_size=square',
    songs: [SONG_DB[2], SONG_DB[9], SONG_DB[16], SONG_DB[23]],
    createdAt: Date.now() - 172800000,
    shareCount: 7,
  },
  {
    id: 'p3',
    name: '爵士时光',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=jazz%20saxophone%20smoky%20bar&image_size=square',
    songs: [SONG_DB[3], SONG_DB[10], SONG_DB[17], SONG_DB[24]],
    createdAt: Date.now() - 259200000,
    shareCount: 1,
  },
];

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

let playlists: Playlist[] = [...DEFAULT_PLAYLISTS];

export async function searchSongs(keyword: string): Promise<Song[]> {
  await delay(300);
  const lk = keyword.toLowerCase();
  return SONG_DB.filter(
    (s) =>
      s.name.toLowerCase().includes(lk) ||
      s.artist.toLowerCase().includes(lk) ||
      s.genre.toLowerCase().includes(lk)
  );
}

export async function getPlaylist(id: string): Promise<Playlist | null> {
  await delay(150);
  return playlists.find((p) => p.id === id) ?? null;
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  await delay(100);
  return [...playlists];
}

export async function createPlaylist(name: string, cover: string): Promise<Playlist> {
  await delay(200);
  const pl: Playlist = {
    id: 'p' + Date.now(),
    name,
    cover,
    songs: [],
    createdAt: Date.now(),
    shareCount: 0,
  };
  playlists = [pl, ...playlists];
  return pl;
}

export async function updatePlaylist(id: string, data: Partial<Pick<Playlist, 'name' | 'cover'>>): Promise<Playlist | null> {
  await delay(150);
  const idx = playlists.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  playlists[idx] = { ...playlists[idx], ...data };
  return playlists[idx];
}

export async function deletePlaylist(id: string): Promise<boolean> {
  await delay(150);
  const len = playlists.length;
  playlists = playlists.filter((p) => p.id !== id);
  return playlists.length < len;
}

export async function addSongToPlaylist(playlistId: string, songId: string): Promise<Playlist | null> {
  await delay(150);
  const pl = playlists.find((p) => p.id === playlistId);
  if (!pl) return null;
  const song = SONG_DB.find((s) => s.id === songId);
  if (!song) return null;
  if (pl.songs.some((s) => s.id === songId)) return pl;
  pl.songs = [...pl.songs, song];
  return pl;
}

export async function removeSongFromPlaylist(playlistId: string, songId: string): Promise<Playlist | null> {
  await delay(150);
  const pl = playlists.find((p) => p.id === playlistId);
  if (!pl) return null;
  pl.songs = pl.songs.filter((s) => s.id !== songId);
  return pl;
}

export async function generateShareLink(playlistId: string): Promise<string> {
  await delay(200);
  const url = `${window.location.origin}/share/${playlistId}`;
  return url;
}

export async function recordShare(playlistId: string): Promise<void> {
  await delay(100);
  const pl = playlists.find((p) => p.id === playlistId);
  if (pl) pl.shareCount += 1;
}

export async function getRecommendations(history: Song[]): Promise<Song[]> {
  await delay(400);
  if (history.length === 0) return SONG_DB.slice(0, 3);
  const genreCount: Record<string, number> = {};
  history.forEach((s) => {
    genreCount[s.genre] = (genreCount[s.genre] || 0) + 1;
  });
  const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0][0];
  const candidates = SONG_DB.filter(
    (s) => s.genre === topGenre && !history.some((h) => h.id === s.id)
  );
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export function getSongById(id: string): Song | undefined {
  return SONG_DB.find((s) => s.id === id);
}

export function getAllSongs(): Song[] {
  return [...SONG_DB];
}
