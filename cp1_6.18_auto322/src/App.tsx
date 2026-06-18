import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { useStore, type Artist, type Song, GENRE_LABELS } from '@/store'
import { getInitials } from '@/utils/storage'
import { ArtistCard } from '@/components/ArtistCard'
import { SongCard } from '@/components/SongCard'
import { MessageList } from '@/components/MessageList'
import { FanBoard } from '@/components/FanBoard'
import { Player } from '@/components/Player'
import { PortfolioForm } from '@/components/PortfolioForm'

const navStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '60px',
  backgroundColor: '#121212',
  borderBottom: '1px solid #2A2A2A',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  zIndex: 100,
}

const navLogoStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: '#FF6B6B',
  cursor: 'pointer',
}

const navItemsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '32px',
}

const navItemStyle = (active: boolean): React.CSSProperties => ({
  color: active ? '#FF6B6B' : '#EAEAEA',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'color 0.2s ease',
})

const mainStyle: React.CSSProperties = {
  paddingTop: '60px',
  minHeight: '100vh',
}

const discoverPageStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '32px 24px',
}

const pageTitleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  color: '#EAEAEA',
  marginBottom: '24px',
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '24px',
}

const artistPageStyle: React.CSSProperties = {
  maxWidth: '1000px',
  margin: '0 auto',
  padding: '32px 24px',
}

const artistHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '24px',
  marginBottom: '32px',
  padding: '24px',
  backgroundColor: '#1E1E1E',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
}

const artistAvatarStyle = (color: string): React.CSSProperties => ({
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  backgroundColor: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: '40px',
  fontWeight: 600,
  flexShrink: 0,
})

const artistInfoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const artistNameStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  color: '#EAEAEA',
  marginBottom: '8px',
}

const artistBioStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#999',
  marginBottom: '16px',
  lineHeight: 1.6,
}

const genresContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
}

const genreTagStyle: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: '999px',
  backgroundColor: '#3D3D3D',
  color: '#E0E0E0',
  fontSize: '12px',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 600,
  color: '#EAEAEA',
  marginBottom: '20px',
}

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '64px 24px',
  color: '#666',
}

const backButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  color: '#FF6B6B',
  fontSize: '14px',
  cursor: 'pointer',
  marginBottom: '24px',
  background: 'none',
  border: 'none',
  padding: 0,
}

const responsiveStyle = `
  @media (max-width: 1024px) {
    .grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }
  @media (max-width: 768px) {
    .grid {
      grid-template-columns: 1fr !important;
    }
    .artist-header {
      flex-direction: column;
      text-align: center;
    }
    .nav-items {
      gap: 16px !important;
    }
  }
`

function Navigation() {
  const navigate = useNavigate()
  const [activeRoute, setActiveRoute] = useState('/')

  useEffect(() => {
    setActiveRoute(window.location.hash.replace('#', '') || '/')
  }, [])

  const handleNavigate = (path: string) => {
    navigate(path)
    setActiveRoute(path)
  }

  return (
    <nav style={navStyle}>
      <div style={navLogoStyle} onClick={() => handleNavigate('/')}>
        🎵 音乐人
      </div>
      <div style={navItemsStyle} className="nav-items">
        <span
          style={navItemStyle(activeRoute === '/' || activeRoute.startsWith('/artist'))}
          onClick={() => handleNavigate('/')}
        >
          发现艺人
        </span>
        <span
          style={navItemStyle(activeRoute === '/portfolio')}
          onClick={() => handleNavigate('/portfolio')}
        >
          我的作品集
        </span>
      </div>
    </nav>
  )
}

function DiscoverPage() {
  const navigate = useNavigate()
  const { artists, resetStore } = useStore()

  useEffect(() => {
    if (artists.length === 0) {
      const mockData = generateMockData()
      useStore.setState(mockData)
    }
  }, [artists.length])

  const handleArtistClick = (artistId: string) => {
    navigate(`/artist/${artistId}`)
  }

  return (
    <div style={discoverPageStyle}>
      <h1 style={pageTitleStyle}>发现艺人</h1>
      {artists.length === 0 ? (
        <div style={emptyStateStyle}>
          <p>暂无艺人</p>
          <p style={{ marginTop: '8px', fontSize: '14px' }}>
            前往"我的作品集"创建你的第一个艺人档案吧！
          </p>
        </div>
      ) : (
        <div style={gridStyle} className="grid">
          {artists.map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              onClick={() => handleArtistClick(artist.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ArtistPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { artists, getSongsByArtist, openPlayer, currentSongId, isPlayerOpen, closePlayer } = useStore()

  const artist = artists.find((a) => a.id === id)
  const songs = artist ? getSongsByArtist(artist.id) : []
  const currentSong = currentSongId ? songs.find((s) => s.id === currentSongId) : null

  if (!artist) {
    return (
      <div style={artistPageStyle}>
        <button style={backButtonStyle} onClick={() => navigate('/')}>
          ← 返回
        </button>
        <div style={emptyStateStyle}>
          <p>艺人不存在</p>
        </div>
      </div>
    )
  }

  return (
    <div style={artistPageStyle}>
      <button style={backButtonStyle} onClick={() => navigate('/')}>
        ← 返回
      </button>

      <div style={artistHeaderStyle} className="artist-header">
        <div style={artistAvatarStyle(artist.avatarColor)}>
          {getInitials(artist.name)}
        </div>
        <div style={artistInfoStyle}>
          <h1 style={artistNameStyle}>{artist.name}</h1>
          <p style={artistBioStyle}>{artist.bio}</p>
          <div style={genresContainerStyle}>
            {artist.genres.map((genre) => (
              <span key={genre} style={genreTagStyle}>
                {GENRE_LABELS[genre]}
              </span>
            ))}
          </div>
        </div>
      </div>

      <h2 style={sectionTitleStyle}>作品</h2>
      {songs.length === 0 ? (
        <div style={{ ...emptyStateStyle, backgroundColor: '#1E1E1E', borderRadius: '8px' }}>
          <p>该艺人暂无作品</p>
        </div>
      ) : (
        <div style={gridStyle} className="grid">
          {songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              artist={artist}
              onPlay={() => openPlayer(song.id)}
            />
          ))}
        </div>
      )}

      <FanBoard artistId={artist.id} />
      <MessageList artistId={artist.id} />

      {isPlayerOpen && currentSong && (
        <Player song={currentSong} artist={artist} onClose={closePlayer} />
      )}
    </div>
  )
}

function generateMockData() {
  const artists: Artist[] = [
    {
      id: 'mock-1',
      name: '夜空漫步者',
      bio: '独立电子音乐人，擅长合成器与氛围音乐的融合创作。用声音描绘城市夜晚的孤独与浪漫。',
      genres: ['electronic', 'pop'],
      avatarColor: 'hsl(220, 60%, 50%)',
      createdAt: Date.now() - 86400000 * 30,
    },
    {
      id: 'mock-2',
      name: '林小雨',
      bio: '民谣歌手，一把吉他走天下。歌声里有山川湖海，也有市井烟火。',
      genres: ['folk', 'pop'],
      avatarColor: 'hsl(45, 60%, 50%)',
      createdAt: Date.now() - 86400000 * 20,
    },
    {
      id: 'mock-3',
      name: '废墟乐队',
      bio: '另类摇滚三人组，噪音墙与旋律的碰撞。在废墟中寻找希望的声音。',
      genres: ['rock', 'electronic'],
      avatarColor: 'hsl(0, 60%, 50%)',
      createdAt: Date.now() - 86400000 * 10,
    },
    {
      id: 'mock-4',
      name: 'Jazz Cat',
      bio: '爵士钢琴手，传统与现代的完美结合。午夜酒吧里的即兴诗人。',
      genres: ['jazz', 'classical'],
      avatarColor: 'hsl(280, 60%, 50%)',
      createdAt: Date.now() - 86400000 * 5,
    },
  ]

  const songs: Song[] = [
    {
      id: 'song-1',
      artistId: 'mock-1',
      title: '午夜电台',
      note: '写给城市夜归人的歌',
      duration: 234,
      playCount: 1234,
      coverColor: '#3a3a3a',
      audioData: createMockAudio(),
      createdAt: Date.now() - 86400000 * 25,
    },
    {
      id: 'song-2',
      artistId: 'mock-1',
      title: '霓虹梦境',
      note: '',
      duration: 198,
      playCount: 856,
      coverColor: '#454545',
      audioData: createMockAudio(),
      createdAt: Date.now() - 86400000 * 20,
    },
    {
      id: 'song-3',
      artistId: 'mock-2',
      title: '南方的火车',
      note: '写给离家的游子',
      duration: 267,
      playCount: 2341,
      coverColor: '#3d3d3d',
      audioData: createMockAudio(),
      createdAt: Date.now() - 86400000 * 15,
    },
    {
      id: 'song-4',
      artistId: 'mock-2',
      title: '春天的花',
      note: '2024年春天写的一首歌',
      duration: 189,
      playCount: 1567,
      coverColor: '#424242',
      audioData: createMockAudio(),
      createdAt: Date.now() - 86400000 * 10,
    },
    {
      id: 'song-5',
      artistId: 'mock-2',
      title: '城市的雨',
      note: '',
      duration: 215,
      playCount: 987,
      coverColor: '#383838',
      audioData: createMockAudio(),
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'song-6',
      artistId: 'mock-3',
      title: '废墟之上',
      note: '专辑同名主打',
      duration: 289,
      playCount: 3456,
      coverColor: '#333333',
      audioData: createMockAudio(),
      createdAt: Date.now() - 86400000 * 8,
    },
    {
      id: 'song-7',
      artistId: 'mock-3',
      title: '无声呐喊',
      note: '',
      duration: 245,
      playCount: 2134,
      coverColor: '#4a4a4a',
      audioData: createMockAudio(),
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 'song-8',
      artistId: 'mock-4',
      title: '午夜即兴',
      note: '现场录音',
      duration: 312,
      playCount: 789,
      coverColor: '#3f3f3f',
      audioData: createMockAudio(),
      createdAt: Date.now() - 86400000 * 2,
    },
  ]

  const messages = [
    {
      id: 'msg-1',
      artistId: 'mock-1',
      visitorName: '音乐爱好者小明',
      content: '太喜欢《午夜电台》了，每天睡前都要听一遍！',
      avatarColor: 'hsl(120, 70%, 85%)',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'msg-2',
      artistId: 'mock-1',
      visitorName: 'NightOwl',
      content: '氛围感拉满，期待更多作品！',
      avatarColor: 'hsl(200, 70%, 85%)',
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'msg-3',
      artistId: 'mock-2',
      visitorName: '漂泊的云',
      content: '听《南方的火车》听哭了，想起了家乡。',
      avatarColor: 'hsl(30, 70%, 85%)',
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 'msg-4',
      artistId: 'mock-2',
      visitorName: '民谣控',
      content: '终于发现了宝藏歌手！',
      avatarColor: 'hsl(160, 70%, 85%)',
      createdAt: Date.now() - 86400000 * 4,
    },
    {
      id: 'msg-5',
      artistId: 'mock-3',
      visitorName: 'RockSoul',
      content: '现场一定更炸！什么时候巡演？',
      avatarColor: 'hsl(350, 70%, 85%)',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'msg-6',
      artistId: 'mock-4',
      visitorName: '爵士迷',
      content: '钢琴弹得太有味道了，是我喜欢的风格！',
      avatarColor: 'hsl(280, 70%, 85%)',
      createdAt: Date.now() - 86400000 * 2,
    },
  ]

  const likes = [
    { id: 'like-1', songId: 'song-1', visitorName: '音乐爱好者小明', createdAt: Date.now() - 86400000 },
    { id: 'like-2', songId: 'song-1', visitorName: 'NightOwl', createdAt: Date.now() - 86400000 * 2 },
    { id: 'like-3', songId: 'song-1', visitorName: '电子乐迷', createdAt: Date.now() - 86400000 * 3 },
    { id: 'like-4', songId: 'song-2', visitorName: 'NightOwl', createdAt: Date.now() - 86400000 },
    { id: 'like-5', songId: 'song-3', visitorName: '漂泊的云', createdAt: Date.now() - 86400000 * 2 },
    { id: 'like-6', songId: 'song-3', visitorName: '民谣控', createdAt: Date.now() - 86400000 },
    { id: 'like-7', songId: 'song-3', visitorName: '音乐爱好者小明', createdAt: Date.now() - 86400000 * 3 },
    { id: 'like-8', songId: 'song-3', visitorName: '异乡人', createdAt: Date.now() - 86400000 * 4 },
    { id: 'like-9', songId: 'song-4', visitorName: '民谣控', createdAt: Date.now() - 86400000 },
    { id: 'like-10', songId: 'song-4', visitorName: '漂泊的云', createdAt: Date.now() - 86400000 * 2 },
    { id: 'like-11', songId: 'song-6', visitorName: 'RockSoul', createdAt: Date.now() - 86400000 },
    { id: 'like-12', songId: 'song-6', visitorName: '金属党', createdAt: Date.now() - 86400000 * 2 },
    { id: 'like-13', songId: 'song-6', visitorName: 'PunkGirl', createdAt: Date.now() - 86400000 * 3 },
    { id: 'like-14', songId: 'song-7', visitorName: 'RockSoul', createdAt: Date.now() - 86400000 },
    { id: 'like-15', songId: 'song-8', visitorName: '爵士迷', createdAt: Date.now() - 86400000 },
    { id: 'like-16', songId: 'song-8', visitorName: '蓝调爱好者', createdAt: Date.now() - 86400000 * 2 },
  ]

  return {
    artists,
    songs,
    messages,
    likes,
    currentArtistId: null,
    currentSongId: null,
    isPlayerOpen: false,
    currentVisitorName: '访客' + Math.floor(Math.random() * 10000),
  }
}

function createMockAudio(): string {
  return 'data:audio/mpeg;base64,' + btoa(
    Array.from({ length: 1024 }, () => String.fromCharCode(Math.floor(Math.random() * 256))).join('')
  )
}

export default function App() {
  return (
    <HashRouter>
      <Navigation />
      <main style={mainStyle}>
        <Routes>
          <Route path="/" element={<DiscoverPage />} />
          <Route path="/artist/:id" element={<ArtistPage />} />
          <Route path="/portfolio" element={<PortfolioForm />} />
        </Routes>
      </main>
      <style>{responsiveStyle}</style>
    </HashRouter>
  )
}
