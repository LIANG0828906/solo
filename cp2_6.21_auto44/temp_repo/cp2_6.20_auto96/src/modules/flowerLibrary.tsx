import { useCallback, useState, useRef, useEffect } from 'react'
import { useFlowerStore } from '../store/flowerStore'
import type { Flower } from '../services/api'

const SEASON_STYLES: Record<string, { bg: string; color: string }> = {
  春: { bg: '#a8e6cf40', color: '#27ae60' },
  夏: { bg: '#ffd3b640', color: '#f39c12' },
  秋: { bg: '#ffaaa540', color: '#e67e22' },
  冬: { bg: '#dcedc140', color: '#3498db' },
}

interface PreviewState {
  flower: Flower
  rect: DOMRect
  visible: boolean
}

function FlowerLibrary() {
  const { allFlowers, activeCategory, loading, error, addFlowerToVase } = useFlowerStore()
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const previewTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const handleCardMouseEnter = useCallback(
    (flower: Flower, e: React.MouseEvent<HTMLDivElement>) => {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current)
        hideTimeout.current = null
      }
      const rect = e.currentTarget.getBoundingClientRect()
      if (preview && preview.flower.id === flower.id) {
        setPreview({ ...preview, visible: true })
        return
      }
      previewTimeout.current = setTimeout(() => {
        setPreview({ flower, rect, visible: true })
      }, 120)
    },
    [preview]
  )

  const handleCardMouseLeave = useCallback(() => {
    if (previewTimeout.current) {
      clearTimeout(previewTimeout.current)
      previewTimeout.current = null
    }
    setPreview((prev) => (prev ? { ...prev, visible: false } : prev))
    hideTimeout.current = setTimeout(() => {
      setPreview(null)
    }, 220)
  }, [])

  const handlePreviewEnter = useCallback(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current)
      hideTimeout.current = null
    }
    setPreview((prev) => (prev ? { ...prev, visible: true } : prev))
  }, [])

  const handlePreviewLeave = useCallback(() => {
    setPreview((prev) => (prev ? { ...prev, visible: false } : prev))
    hideTimeout.current = setTimeout(() => {
      setPreview(null)
    }, 220)
  }, [])

  const getPreviewPosition = (rect: DOMRect) => {
    const previewWidth = 200
    const previewHeight = 260
    const gap = 12
    const scrollOffsetX = containerRef.current?.scrollLeft || 0

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let left = rect.right + gap + scrollOffsetX
    let top = rect.top

    if (left + previewWidth + 8 > viewportWidth) {
      left = rect.left - gap - previewWidth
    }
    if (left < 8) {
      left = Math.max(8, viewportWidth - previewWidth - 8)
    }
    if (top + previewHeight + 8 > viewportHeight) {
      top = Math.max(8, viewportHeight - previewHeight - 8)
    }
    if (top < 8) {
      top = 8
    }

    return { left, top }
  }

  useEffect(() => {
    if (!preview) return
    const onScroll = () => {
      setPreview(null)
    }
    containerRef.current?.addEventListener('scroll', onScroll, { passive: true })
    return () => containerRef.current?.removeEventListener('scroll', onScroll)
  }, [preview])

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px',
        position: 'relative',
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
              onMouseEnter={(e) => handleCardMouseEnter(flower, e)}
              onMouseLeave={handleCardMouseLeave}
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
              className="flower-card"
              onMouseDown={(e) => (e.currentTarget.style.cursor = 'grabbing')}
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

      {preview && (
        <div
          onMouseEnter={handlePreviewEnter}
          onMouseLeave={handlePreviewLeave}
          style={{
            position: 'fixed',
            ...getPreviewPosition(preview.rect),
            width: '200px',
            background: 'var(--bg-glass-strong)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            borderRadius: '16px',
            border: '1px solid var(--border-medium)',
            boxShadow: '0 12px 36px rgba(74, 55, 40, 0.18), 0 4px 12px rgba(74, 55, 40, 0.08)',
            zIndex: 1000,
            overflow: 'hidden',
            pointerEvents: 'auto',
            opacity: preview.visible ? 1 : 0,
            transform: preview.visible ? 'translateX(0) scale(1)' : 'translateX(8px) scale(0.96)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
        >
          <div
            style={{
              height: '160px',
              background: `radial-gradient(ellipse at 50% 40%, ${preview.flower.color_hex}28 0%, ${preview.flower.color_hex}08 70%, transparent 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35) 0%, transparent 60%)`,
                pointerEvents: 'none',
              }}
            />
            <span
              style={{
                fontSize: '88px',
                filter: `drop-shadow(0 6px 16px ${preview.flower.color_hex}40)`,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {preview.flower.image}
            </span>
          </div>
          <div
            style={{
              padding: '14px 14px 16px',
            }}
          >
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              {preview.flower.name}
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                marginBottom: '6px',
              }}
            >
              {preview.flower.seasons.map((s) => {
                const style = SEASON_STYLES[s]
                return (
                  <span
                    key={s}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '10px',
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: preview.flower.color_hex,
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: `0 0 6px ${preview.flower.color_hex}40`,
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}
              >
                {preview.flower.color}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 2px' }}>·</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {preview.flower.height}cm
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FlowerLibrary
