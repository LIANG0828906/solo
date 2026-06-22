import { useState, useEffect } from 'react'
import { artworksAPI } from '../services/api'
import type { Artwork } from '../types'

interface ArtworkPanelProps {
  onDragStart: (artwork: Artwork, e: React.DragEvent) => void
  onDragEnd: () => void
}

function ArtworkPanel({ onDragStart, onDragEnd }: ArtworkPanelProps) {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const data = await artworksAPI.getAll()
        setArtworks(data)
      } catch (err) {
        console.error('Failed to fetch artworks:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchArtworks()
  }, [])

  const handleDragStart = (artwork: Artwork, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', artwork.id)
    onDragStart(artwork, e)
  }

  return (
    <div style={styles.panel} className="glass-panel">
      <div style={styles.header}>
        <h2 style={styles.title}>艺术品库</h2>
        <span style={styles.count}>{artworks.length} 件作品</span>
      </div>

      <div style={styles.list}>
        {loading ? (
          <div style={styles.loading}>加载中...</div>
        ) : (
          artworks.map((artwork) => (
            <div
              key={artwork.id}
              draggable
              onDragStart={(e) => handleDragStart(artwork, e)}
              onDragEnd={onDragEnd}
              style={styles.item}
            >
              <div style={styles.imageWrapper}>
                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  style={styles.image}
                  draggable={false}
                />
              </div>
              <div style={styles.info}>
                <div style={styles.artTitle}>{artwork.title}</div>
                <div style={styles.artAuthor}>{artwork.author}</div>
                <div style={styles.artMeta}>
                  <span>{artwork.year}</span>
                  <span>·</span>
                  <span>
                    {artwork.width} × {artwork.height} cm
                  </span>
                </div>
              </div>
              <div style={styles.dragHint}>⋮⋮</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: '280px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '0 16px 16px 0',
    overflow: 'hidden'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333'
  },
  count: {
    fontSize: '12px',
    color: '#999'
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
    fontSize: '14px'
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px',
    borderRadius: '10px',
    cursor: 'grab',
    transition: 'all 0.2s ease',
    marginBottom: '8px',
    background: 'rgba(255,255,255,0.5)',
    border: '1px solid transparent',
    position: 'relative'
  },
  imageWrapper: {
    width: '60px',
    height: '60px',
    borderRadius: '6px',
    overflow: 'hidden',
    flexShrink: 0,
    background: '#f0f0f0'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  info: {
    flex: 1,
    minWidth: 0
  },
  artTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '3px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  artAuthor: {
    fontSize: '12px',
    color: '#777',
    marginBottom: '3px'
  },
  artMeta: {
    fontSize: '11px',
    color: '#aaa',
    display: 'flex',
    gap: '4px'
  },
  dragHint: {
    color: '#ccc',
    fontSize: '14px',
    letterSpacing: '-2px',
    flexShrink: 0
  }
}

export default ArtworkPanel
