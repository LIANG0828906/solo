import type { Album } from './App'

interface AlbumTimelineProps {
  albums: Album[]
  isMobile: boolean
}

function AlbumTimeline({ albums, isMobile }: AlbumTimelineProps) {
  const sortedAlbums = [...albums].sort((a, b) => {
    return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  })

  const panelWidth = isMobile ? 180 : 260
  const positionStyle = isMobile
    ? { top: '20px', left: '20px' }
    : { left: '40px', bottom: '80px' }

  return (
    <div
      className="scrollbar-hide"
      style={{
        position: 'absolute',
        ...positionStyle,
        width: `${panelWidth}px`,
        maxHeight: isMobile ? '280px' : '360px',
        background: 'rgba(26, 27, 58, 0.7)',
        borderRadius: '16px',
        padding: '16px',
        zIndex: 5,
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          fontSize: isMobile ? '12px' : '13px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '12px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}
      >
        专辑发布日历
      </div>

      <div style={{ position: 'relative', paddingLeft: '16px' }}>
        <div
          style={{
            position: 'absolute',
            left: '3px',
            top: '8px',
            bottom: '8px',
            width: '2px',
            background: 'linear-gradient(180deg, rgba(255,107,53,0.4) 0%, rgba(255,255,255,0.1) 100%)',
          }}
        />

        {sortedAlbums.map((album, index) => (
          <div
            key={album.id}
            style={{
              position: 'relative',
              marginBottom: index === sortedAlbums.length - 1 ? '0' : '16px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '-16px',
                top: '8px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: album.isLatest ? '#FF6B35' : album.isUnreleased ? '#00D4AA' : 'rgba(255,255,255,0.3)',
                boxShadow: album.isLatest
                  ? '0 0 10px #FF6B35'
                  : album.isUnreleased
                    ? '0 0 8px #00D4AA'
                    : 'none',
              }}
            />

            <div
              className={album.isLatest ? 'golden-glow' : ''}
              style={{
                padding: isMobile ? '8px' : '10px',
                borderRadius: '10px',
                background: album.isLatest ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.03)',
              }}
            >
              <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: isMobile ? '36px' : '44px',
                    height: isMobile ? '36px' : '44px',
                    borderRadius: '6px',
                    background: album.isLatest
                      ? 'linear-gradient(135deg, #FF6B35 0%, #FFD700 100%)'
                      : album.isUnreleased
                        ? 'linear-gradient(135deg, #00D4AA 0%, #6366f1 100%)'
                        : 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? '10px' : '12px',
                    fontWeight: 700,
                    color: '#ffffff',
                    overflow: 'hidden',
                  }}
                >
                  {album.title.substring(0, 2).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: isMobile ? '12px' : '13px',
                      fontWeight: 600,
                      color: '#ffffff',
                      marginBottom: '3px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {album.title}
                  </div>
                  <div
                    style={{
                      fontSize: isMobile ? '10px' : '11px',
                      color: 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {album.releaseDate}
                  </div>
                  {album.isLatest && (
                    <div
                      style={{
                        fontSize: isMobile ? '9px' : '10px',
                        color: '#FFD700',
                        marginTop: '3px',
                        fontWeight: 500,
                      }}
                    >
                      ✦ 最新专辑
                    </div>
                  )}
                  {album.isUnreleased && (
                    <div
                      style={{
                        fontSize: isMobile ? '9px' : '10px',
                        color: '#00D4AA',
                        marginTop: '3px',
                        fontWeight: 500,
                      }}
                    >
                      ◌ 即将发行
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AlbumTimeline
