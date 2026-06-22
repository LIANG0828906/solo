import { type Song, type Artist, useStore } from '@/store'
import { formatDuration } from '@/utils/audio'
import { getInitials } from '@/utils/storage'

interface SongCardProps {
  song: Song
  artist: Artist
  onPlay: () => void
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#1E1E1E',
  borderRadius: '8px',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
}

const cardHoverStyle: React.CSSProperties = {
  transform: 'translateY(-2px)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
}

const coverStyle = (color: string): React.CSSProperties => ({
  height: '160px',
  backgroundColor: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
})

const musicIconStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  opacity: 0.6,
}

const playButtonStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '12px',
  right: '12px',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 107, 107, 0.9)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.3s ease',
  border: 'none',
  cursor: 'pointer',
}

const playButtonVisibleStyle: React.CSSProperties = {
  opacity: 1,
}

const contentStyle: React.CSSProperties = {
  padding: '16px',
}

const titleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#EAEAEA',
  marginBottom: '4px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const artistNameStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#999',
  marginBottom: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

const miniAvatarStyle = (color: string): React.CSSProperties => ({
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: '10px',
  fontWeight: 600,
})

const footerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '12px',
  color: '#888',
}

const statsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
}

const likeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  color: '#888',
  fontSize: '12px',
  transition: 'transform 0.3s ease',
}

const likeButtonLikedStyle: React.CSSProperties = {
  color: '#FF4757',
}

const pulseAnimation: React.CSSProperties = {
  animation: 'pulse 0.3s ease',
}

const heartIcon = (filled: boolean) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const playIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)

const musicNoteSVG = (
  <svg style={musicIconStyle} viewBox="0 0 24 24" fill="none" stroke="#EAEAEA" strokeWidth="1.5">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
)

export function SongCard({ song, artist, onPlay }: SongCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const { hasLikedSong, addLike, currentVisitorName, getLikesForSong } = useStore()

  const liked = hasLikedSong(song.id, currentVisitorName)
  const likeCount = getLikesForSong(song.id).length

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!liked) {
      addLike({ songId: song.id, visitorName: currentVisitorName })
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPlay()
  }

  return (
    <div
      style={{ ...cardStyle, ...(isHovered ? cardHoverStyle : {}) }}
      onClick={handlePlay}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={coverStyle(song.coverColor)}>
        {musicNoteSVG}
        <button
          style={{ ...playButtonStyle, ...(isHovered ? playButtonVisibleStyle : {}) }}
          onClick={handlePlay}
        >
          {playIcon}
        </button>
      </div>
      <div style={contentStyle}>
        <h4 style={titleStyle}>{song.title}</h4>
        <div style={artistNameStyle}>
          <span style={miniAvatarStyle(artist.avatarColor)}>{getInitials(artist.name)}</span>
          <span>{artist.name}</span>
        </div>
        <div style={footerStyle}>
          <span>{formatDuration(song.duration)}</span>
          <div style={statsStyle}>
            <span>▶ {song.playCount}</span>
            <button
              style={{
                ...likeButtonStyle,
                ...(liked ? likeButtonLikedStyle : {}),
                ...(isAnimating ? pulseAnimation : {}),
              }}
              onClick={handleLike}
            >
              {heartIcon(liked)}
              <span>{likeCount}</span>
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
