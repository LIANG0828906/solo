import { useState, useEffect, useCallback } from 'react'
import { useStore, THEME_ACCENT } from './App'
import type { ColorTheme } from './App'

export function Gallery() {
  const { savedPatterns, loadPattern, deletePattern, setGalleryOpen, params } = useStore()
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => setGalleryOpen(false), 300)
  }, [setGalleryOpen])

  const handleLoad = useCallback((id: string) => {
    loadPattern(id)
    handleClose()
  }, [loadPattern, handleClose])

  const accent = THEME_ACCENT[params.colorTheme as ColorTheme]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000000AA',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        opacity: visible && !closing ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#1A1A2E',
          borderRadius: 16,
          padding: 32,
          maxWidth: 720,
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          transform: closing ? 'translateY(60px)' : visible ? 'translateY(0)' : 'translateY(60px)',
          opacity: closing ? 0 : visible ? 1 : 0,
          transition: 'all 0.3s ease-in',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <h2 style={{
            fontSize: 22,
            fontWeight: 700,
            background: `linear-gradient(90deg, #FFD93D, ${accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            图案画廊
          </h2>
          <button
            onClick={handleClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid #333',
              background: 'transparent',
              color: '#aaa',
              fontSize: 18,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'inherit',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#333'
              e.currentTarget.style.color = '#FFD93D'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#aaa'
            }}
          >
            ✕
          </button>
        </div>

        {savedPatterns.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#666',
            padding: '60px 0',
            fontSize: 14,
          }}>
            还没有保存的图案，快去创作吧 ✦
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}>
            {savedPatterns.map((pattern, idx) => (
              <div
                key={pattern.id}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.4s ease-out ${idx * 0.1}s`,
                }}
              >
                <div
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: 8,
                    border: '2px solid #FFD93D',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    margin: '0 auto',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,217,61,0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  onClick={() => handleLoad(pattern.id)}
                >
                  <img
                    src={pattern.thumbnail}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '4px 6px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    fontSize: 10,
                    color: '#ccc',
                  }}>
                    {new Date(pattern.createdAt).toLocaleTimeString('zh-CN')}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: 6,
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePattern(pattern.id)
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#666',
                      fontSize: 11,
                      cursor: 'pointer',
                      padding: '2px 8px',
                      borderRadius: 4,
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ff4444'
                      e.currentTarget.style.background = '#ff444418'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#666'
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
