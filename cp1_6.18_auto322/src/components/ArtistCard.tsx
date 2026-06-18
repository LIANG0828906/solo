import { GENRE_LABELS, type Artist } from '@/store'
import { getInitials } from '@/utils/storage'

interface ArtistCardProps {
  artist: Artist
  onClick: () => void
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#1E1E1E',
  borderRadius: '8px',
  padding: '24px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
}

const cardHoverStyle: React.CSSProperties = {
  transform: 'translateY(-2px)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
}

const avatarStyle = (color: string): React.CSSProperties => ({
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: '24px',
  fontWeight: 600,
  marginBottom: '16px',
})

const nameStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#EAEAEA',
  marginBottom: '8px',
}

const bioStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#999',
  marginBottom: '16px',
  lineHeight: 1.5,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
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

export function ArtistCard({ artist, onClick }: ArtistCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <div
      style={{ ...cardStyle, ...(isHovered ? cardHoverStyle : {}) }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={avatarStyle(artist.avatarColor)}>
        {getInitials(artist.name)}
      </div>
      <h3 style={nameStyle}>{artist.name}</h3>
      <p style={bioStyle}>{artist.bio}</p>
      <div style={genresContainerStyle}>
        {artist.genres.map((genre) => (
          <span key={genre} style={genreTagStyle}>
            {GENRE_LABELS[genre]}
          </span>
        ))}
      </div>
    </div>
  )
}
