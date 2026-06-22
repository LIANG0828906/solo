import React, { useState, useEffect, useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import Canvas, { HoverCell } from './Canvas'
import Palette, { PALETTE_COLORS } from './Palette'
import ShareBar, { decodeGridData } from './ShareBar'

const GRID_SIZE = 16
const MAX_HISTORY = 5

interface HistoryItem {
  x: number
  y: number
  previousColor: string
  newColor: string
}

const createEmptyGrid = (): string[][] => {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => '#FFFFFF')
  )
}

const App: React.FC = () => {
  const [gridData, setGridData] = useState<string[][]>(createEmptyGrid)
  const [selectedColor, setSelectedColor] = useState<string>(PALETTE_COLORS[0])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [hoverCell, setHoverCell] = useState<HoverCell | null>(null)
  const [showClearModal, setShowClearModal] = useState(false)
  const [animatingCell, setAnimatingCell] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const art = params.get('art')
    if (art) {
      const decoded = decodeGridData(art)
      if (decoded) {
        setGridData(decoded)
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        handleUndo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [history])

  const handleGridClick = useCallback((x: number, y: number, previousColor: string) => {
    if (previousColor === selectedColor) return

    setGridData((prev) => {
      const newGrid = prev.map((row) => [...row])
      newGrid[y][x] = selectedColor
      return newGrid
    })

    setHistory((prev) => {
      const newHistory = [...prev, { x, y, previousColor, newColor: selectedColor }]
      if (newHistory.length > MAX_HISTORY) {
        return newHistory.slice(newHistory.length - MAX_HISTORY)
      }
      return newHistory
    })
  }, [selectedColor])

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev
      const newHistory = [...prev]
      const lastItem = newHistory.pop()!

      setGridData((prevGrid) => {
        const newGrid = prevGrid.map((row) => [...row])
        newGrid[lastItem.y][lastItem.x] = lastItem.previousColor
        return newGrid
      })

      setAnimatingCell({ x: lastItem.x, y: lastItem.y })
      setTimeout(() => setAnimatingCell(null), 200)

      return newHistory
    })
  }, [])

  const handleClear = useCallback(() => {
    setShowClearModal(true)
  }, [])

  const confirmClear = useCallback(() => {
    setGridData(createEmptyGrid())
    setHistory([])
    setShowClearModal(false)
  }, [])

  const undoDots = Array.from({ length: MAX_HISTORY }, (_, i) => i < history.length)

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalScaleIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @media (max-width: 767px) {
          .share-text {
            display: none !important;
          }
          .palette-container {
            flex-direction: row !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            max-width: 320px;
          }
          .palette-wrapper {
            width: 100%;
            justify-content: center;
            display: flex;
          }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          backgroundColor: '#1a1a2e',
          padding: '20px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: '#FFFFFF',
              margin: '0 0 12px 0',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
            }}
          >
            实时像素涂鸦
          </h1>
          <div
            style={{
              width: '100%',
              maxWidth: '600px',
              height: '2px',
              background: 'linear-gradient(90deg, #FF0000, #FF8C00, #FFD700, #00FF00, #00FFFF, #0000FF, #800080, #FF0000)',
              marginBottom: '30px',
              borderRadius: '1px',
            }}
          />

          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: '24px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              width: '100%',
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '0',
                  transform: 'translateY(-100%)',
                  display: 'flex',
                  gap: '6px',
                  marginBottom: '8px',
                  zIndex: 10,
                }}
              >
                {undoDots.map((available, i) => (
                  <div
                    key={i}
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: available ? '#4CAF50' : '#555',
                      transition: 'background-color 0.2s ease-out',
                      boxShadow: available ? '0 0 6px rgba(76,175,80,0.5)' : 'none',
                    }}
                  />
                ))}
              </div>

              <Canvas
                gridData={gridData}
                selectedColor={selectedColor}
                onGridClick={handleGridClick}
                onHover={setHoverCell}
                animatingCell={animatingCell}
              />

              <button
                onClick={handleClear}
                style={{
                  marginTop: '20px',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#F44336',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(244,67,54,0.4)',
                  transition: 'all 0.2s ease-out',
                  transform: 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(244,67,54,0.6)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(244,67,54,0.4)'
                }}
              >
                <Trash2 size={22} />
              </button>
            </div>

            <div
              className="palette-wrapper"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <Palette selectedColor={selectedColor} onColorSelect={setSelectedColor} />
            </div>
          </div>
        </div>

        {hoverCell && (
          <div
            style={{
              position: 'fixed',
              left: hoverCell.mouseX + 16,
              top: hoverCell.mouseY + 16,
              width: '60px',
              height: '60px',
              pointerEvents: 'none',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(30,30,50,0.95)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              padding: '4px',
              gap: '2px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: hoverCell.color,
                borderRadius: '4px',
                border: hoverCell.color === '#FFFFFF' ? '1px solid #ddd' : 'none',
              }}
            />
            <div
              style={{
                fontSize: '10px',
                color: '#aaa',
                fontFamily: 'monospace',
              }}
            >
              ({hoverCell.x}, {hoverCell.y})
            </div>
          </div>
        )}

        {showClearModal && (
          <>
            <div
              onClick={() => setShowClearModal(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.6)',
                zIndex: 999,
                animation: 'modalFadeIn 0.2s ease-out',
              }}
            />
            <div
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '28px',
                width: '320px',
                maxWidth: '90vw',
                zIndex: 1000,
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                animation: 'modalScaleIn 0.2s ease-out',
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#1a1a2e',
                }}
              >
                清空画板
              </h3>
              <p
                style={{
                  margin: '0 0 24px 0',
                  fontSize: '14px',
                  color: '#666',
                  lineHeight: 1.5,
                }}
              >
                确定要清空画板吗？此操作不可撤销。
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={() => setShowClearModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#eee',
                    color: '#333',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-out',
                    transform: 'scale(1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.backgroundColor = '#ddd'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.backgroundColor = '#eee'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={confirmClear}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#F44336',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-out',
                    transform: 'scale(1)',
                    boxShadow: '0 2px 8px rgba(244,67,54,0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(244,67,54,0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(244,67,54,0.3)'
                  }}
                >
                  确定
                </button>
              </div>
            </div>
          </>
        )}

        <ShareBar gridData={gridData} />
      </div>
    </>
  )
}

export default App
