import { useNavigate } from 'react-router-dom'
import { Item } from '../api'
import LazyImage from './LazyImage'

interface ItemCardProps {
  item: Item
}

export default function ItemCard({ item }: ItemCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/item/${item.id}`)
  }

  const storyText = item.story.length > 50 ? item.story.slice(0, 50) + '...' : item.story

  return (
    <div
      className="card"
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-image-wrapper">
        {item.photos.length > 0 ? (
          <LazyImage
            src={item.photos[0]}
            alt={item.name}
            className="card-image"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--cream-dark)',
              fontSize: '48px'
            }}
          >
            📦
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '20px',
            background: 'rgba(250, 247, 240, 0.85)',
            backdropFilter: 'blur(8px)',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--warm-brown)'
          }}
        >
          ❤️ {item.likes}
        </div>
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 500,
            background: 'rgba(139, 111, 71, 0.85)',
            color: 'white',
            backdropFilter: 'blur(8px)'
          }}
        >
          {item.condition}
        </div>
      </div>
      <div style={{ padding: '16px 20px 20px' }}>
        <div
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          📍 {item.city}
        </div>
        <div
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {storyText}
        </div>
      </div>
    </div>
  )
}
