import { Song, GradientScheme } from '../types'

const lyricsSamples = [
  "We don't talk anymore, we don't talk anymore",
  "I'm gonna pop some tags, only got twenty dollars in my pocket",
  "Hello, it's me, I was wondering if after all these years",
  "I'm on the edge of glory and I'm hanging on a moment of truth",
  "Shut up and dance with me, this is my favorite song",
  "I got the eye of the tiger, a fighter, dancing through the fire",
  "Cause baby you're a firework, come on show 'em what you're worth",
  "We found love in a hopeless place",
  "I'm a survivor, I'm gonna make it",
  "Can't stop the feeling, so just dance, dance, dance",
]

const genrePool = [
  'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Jazz', 
  'Indie', 'Alternative', 'Soul', 'Funk', 'Disco', 'House',
  'Lo-Fi', 'Chill', 'Ambient', 'Classical', 'Folk', 'Country'
]

const colors = [
  '#ff6b6b', '#6c5ce7', '#00b894', '#fd79a8', '#fdcb6e',
  '#e17055', '#00cec9', '#0984e3', '#a29bfe', '#fab1a0',
]

function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function generateMockSongs(): Song[] {
  const songs: Song[] = []
  
  const songNames = [
    { name: 'Midnight Dreams', artist: 'Luna Sky', album: 'Starlight' },
    { name: 'Electric Pulse', artist: 'Neon Wave', album: 'Voltage' },
    { name: 'Ocean Blue', artist: 'Coastal Sounds', album: 'Tides' },
    { name: 'Golden Hour', artist: 'Sunset Drive', album: 'Horizon' },
    { name: 'Urban Jungle', artist: 'City Beats', album: 'Metropolis' },
    { name: 'Whispers', artist: 'Silent Echo', album: 'Hush' },
    { name: 'Velocity', artist: 'Speed Run', album: 'Nitro' },
    { name: 'Serenade', artist: 'Moonlight Trio', album: 'Nocturne' },
    { name: 'Fire & Ice', artist: 'Elemental', album: 'Forces' },
    { name: 'Rainy Day', artist: 'Cloud Nine', album: 'Weather' },
  ]

  songNames.forEach((s, index) => {
    const genreCount = 2 + Math.floor(Math.random() * 3)
    songs.push({
      id: `song-${index + 1}`,
      name: s.name,
      artist: s.artist,
      album: s.album,
      playCount: Math.floor(50 + Math.random() * 200),
      duration: 180 + Math.floor(Math.random() * 120),
      genres: getRandomItems(genrePool, genreCount),
      lyrics: lyricsSamples[index % lyricsSamples.length],
      color: colors[index % colors.length],
    })
  })

  songs.sort((a, b) => b.playCount - a.playCount)
  
  return songs
}

export const gradientSchemes: GradientScheme[] = [
  { id: 'sunset', name: '落日橙紫', colors: ['#ff6b6b', '#6c5ce7'] },
  { id: 'deep-sea', name: '深海蓝绿', colors: ['#00b894', '#00cec9'] },
  { id: 'neon', name: '霓虹粉紫', colors: ['#fd79a8', '#6c5ce7'] },
  { id: 'retro', name: '复古胶片', colors: ['#fdcb6e', '#e17055'] },
  { id: 'aurora', name: '极光青绿', colors: ['#00b894', '#0984e3'] },
]
