import { useState, useRef, useCallback, useEffect } from 'react'
import PixelGrid from './components/PixelGrid'
import Toolbar from './components/Toolbar'
import { useCanvasState } from './hooks/useCanvasState'

const GRID_SIZE = 32

// 4x4 像素图标点阵定义，1=白，0=透明
const PIXEL_ICON_PATTERN = [
  [1, 1, 1, 1],
  [1, 0, 0, 1],
  [1, 0, 0, 1],
  [1, 1, 1, 1],
]

export default function App() {
  const {
    pixels,
    cellSize,
    zoom,
    pixelCount,
    saveSnapshot,
    drawPixels,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    resetPixelCount,
    updateCellSize,
    updateZoom,
  } = useCanvasState(GRID_SIZE)

  const [currentColor, setCurrentColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(1)
  const [isErasing, setIsErasing] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [hoverPos, setHoverPos] = useState<{ row: number; col: number } | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (canvasContainerRef.current) {
      canvasContainerRef.current.scrollLeft = (canvasContainerRef.current.scrollWidth - canvasContainerRef.current.clientWidth) / 2
      canvasContainerRef.current.scrollTop = (canvasContainerRef.current.scrollHeight - canvasContainerRef.current.clientHeight) / 2
    }
  }, [zoom, cellSize])

  const handleExport = useCallback(() => {
    const exportCanvas = document.createElement('canvas')
    const totalSize = GRID_SIZE * cellSize
    exportCanvas.width = totalSize
    exportCanvas.height = totalSize
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = col * cellSize
        const y = row * cellSize
        ctx.fillStyle = pixels[row][col]
        ctx.fillRect(x, y, cellSize, cellSize)
      }
    }

    const radius = cellSize * 2
    const roundedCanvas = document.createElement('canvas')
    roundedCanvas.width = totalSize
    roundedCanvas.height = totalSize
    const roundedCtx = roundedCanvas.getContext('2d')
    if (!roundedCtx) return

    roundedCtx.beginPath()
    roundedCtx.moveTo(radius, 0)
    roundedCtx.lineTo(totalSize - radius, 0)
    roundedCtx.quadraticCurveTo(totalSize, 0, totalSize, radius)
    roundedCtx.lineTo(totalSize, totalSize - radius)
    roundedCtx.quadraticCurveTo(totalSize, totalSize, totalSize - radius, totalSize)
    roundedCtx.lineTo(radius, totalSize)
    roundedCtx.quadraticCurveTo(0, totalSize, 0, totalSize - radius)
    roundedCtx.lineTo(0, radius)
    roundedCtx.quadraticCurveTo(0, 0, radius, 0)
    roundedCtx.closePath()
    roundedCtx.clip()

    roundedCtx.drawImage(exportCanvas, 0, 0)

    roundedCanvas.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pixel-mosaic-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 'image/png')
  }, [pixels, cellSize])

  const handleClearConfirm = useCallback(() => {
    resetHistory()
    setShowClearModal(false)
  }, [resetHistory])

  const handleColorChange = useCallback((color: string) => {
    setCurrentColor(color)
    setIsErasing(false)
  }, [])

  const handleDraw = useCallback(
    (positions: { row: number; col: number }[], color: string, isErasing: boolean) => {
      drawPixels(positions, color, isErasing)
    },
    [drawPixels]
  )

  return (
    <div className="app">
      <header className="app-header">
        <div className="pixel-icon">
          {PIXEL_ICON_PATTERN.flat().map((value, idx) => (
            <div key={idx} className={`pixel-icon-dot ${value === 1 ? 'black' : 'white'}`} />
          ))}
        </div>
        <h1 className="app-title">PixelMosaic</h1>
      </header>

      <main className="app-main">
        <div className="canvas-area">
          <div className="canvas-container" ref={canvasContainerRef}>
            <PixelGrid
              pixels={pixels}
              cellSize={cellSize}
              zoom={zoom}
              brushSize={brushSize}
              currentColor={currentColor}
              isErasing={isErasing}
              onDraw={handleDraw}
              onSaveSnapshot={saveSnapshot}
              onZoomChange={updateZoom}
              onCellSizeChange={updateCellSize}
              onHover={setHoverPos}
            />
          </div>
          <div className="status-bar">
            <div className="stat-item">
              <span>坐标:</span>
              <span>{hoverPos ? `${hoverPos.col},${hoverPos.row}` : '--,--'}</span>
            </div>
            <div className="stat-item">
              <span>缩放:</span>
              <span>{(zoom * 100).toFixed(0)}%</span>
            </div>
            <div className="stat-item">
              <span>像素:</span>
              <span>{pixelCount}</span>
              <button className="reset-btn" onClick={resetPixelCount}>
                清零
              </button>
            </div>
          </div>
        </div>

        <Toolbar
          currentColor={currentColor}
          onColorChange={handleColorChange}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          isErasing={isErasing}
          onErasingChange={setIsErasing}
          cellSize={cellSize}
          onCellSizeChange={updateCellSize}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onExport={handleExport}
          onClear={() => setShowClearModal(true)}
        />
      </main>

      {showClearModal && (
        <div className="modal-overlay" onClick={() => setShowClearModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">清空画布</h2>
            <p className="modal-text">确定要清空画布吗？此操作将删除所有绘制内容并重置历史记录。</p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-cancel" onClick={() => setShowClearModal(false)}>
                取消
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={handleClearConfirm}>
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
