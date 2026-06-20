import { useCallback } from 'react'
import { useFlowerStore } from '../store/flowerStore'
import type { Flower } from '../services/api'

const SEASON_STYLES: Record<string, { bg: string; color: string }> = {
  春: { bg: '#a8e6cf40', color: '#27ae60' },
  夏: { bg: '#ffd3b640', color: '#f39c12' },
  秋: { bg: '#ffaaa540', color: '#e67e22' },
  冬: { bg: '#dcedc140', color: '#3498db' },
}

function FlowerLibrary() {
  const { allFlowers, activeCategory, loading, error, addFlowerToVase } = useFlowerStore()

  const filteredFlowers = activeCategory
    ? allFlowers.filter((f) => f.category === activeCategory)
    : allFlowers

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, flower: Flower) => {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('application/json', JSON.stringify(flower))
      e.dataTransfer.setData('text/plain', flower.id)
      const target = e.currentTarget
      target.style.opacity = '0.7'
      target.style.transform = 'scale(0.98)'
    },
    []
  )

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    target.style.opacity = '1'
    target.style.transform = 'scale(1)'
  }, [])

  const handleClick = useCallback(
    (flower: Flower) => {
      addFlowerToVase(flower)
    },
    [addFlowerToVase]
  )

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px',
      }}
    >
      {loading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '32px', animation: 'pulse 1.5s ease-in-out infinite' }}>
            🌸
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>正在加载花材...</span>
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            padding: '30px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>😢</div>
          <div style={{ fontSize: '13px', color: '#e74c3c', marginBottom: '8px' }}>{error}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            请确保后端服务已启动
            <br />
            <code
              style={{
                display: 'inline-block',
                marginTop: '8px',
                padding: '4px 10px',
                background: 'var(--bg-glass-strong)',
                borderRadius: '6px',
                fontSize: '10px',
              }}
            >
              cd backend ; uvicorn main:app --reload
            </code>
          </div>
        </div>
      )}

      {!loading && !error && filteredFlowers.length === 0 && (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}
        >
          暂无该分类花材
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
        }}
      >
        {!loading &&
          !error &&
          filteredFlowers.map((flower) => (
            <div
              key={flower.id}
              draggable
              onDragStart={(e) => handleDragStart(e, flower)}
              onDragEnd={handleDragEnd}
              onClick={() => handleClick(flower)}
              style={{
                background: '#fff',
                borderRadius: '14px',
                overflow: 'hidden',
                cursor: 'grab',
                border: '1px solid var(--border-soft)',
                transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                userSelect: 'none',
                position: 'relative',
                touchAction: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow =
                  '0 8px 24px rgba(74, 55, 40, 0.14), 0 2px 6px rgba(74, 55, 40, 0.06)'
                e.currentTarget.style.borderColor = 'var(--border-medium)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'var(--border-soft)'
              }}
              onMouseDown={(e) => (e.currentTarget.style.cursor = 'grabbing')}
              onMouseUp={(e) => (e.currentTarget.style.cursor = 'grab')}
            >
              <div
                style={{
                  height: '90px',
                  background: `linear-gradient(135deg, ${flower.color_hex}22 0%, ${flower.color_hex}08 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '44px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    gap: '3px',
                  }}
                >
                  {flower.seasons.map((s) => {
                    const style = SEASON_STYLES[s]
                    return (
                      <span
                        key={s}
                        style={{
                          padding: '1.5px 6px',
                          borderRadius: '8px',
                          fontSize: '9px',
                          fontWeight: 600,
                          background: style.bg,
                          color: style.color,
                          border: `0.5px solid ${style.color}30`,
                        }}
                      >
                        {s}
                      </span>
                    )
                  })}
                </div>
                <span
                  style={{
                    filter: `drop-shadow(0 4px 8px ${flower.color_hex}30)`,
                    animation: `float 3s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                >
                  {flower.image}
                </span>
              </div>
              <div
                style={{
                  padding: '8px 10px 10px 10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                    }}
                  >
                    {flower.name}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: flower.color_hex,
                      border: '1px solid rgba(0,0,0,0.06)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {flower.color} · {flower.height}cm
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

export default FlowerLibrary
