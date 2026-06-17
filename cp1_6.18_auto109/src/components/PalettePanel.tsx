import { useState } from 'react'
import { useColorStore, PaletteColor } from '../stores/colorStore'
import './PalettePanel.css'

export function PalettePanel() {
  const { palette, currentColor, addToPalette, removeFromPalette, reorderPalette } =
    useColorStore()
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleAddColor = () => {
    addToPalette(currentColor)
  }

  const handleExport = () => {
    setShowModal(true)
    setCopied(false)
  }

  const handleCopy = async () => {
    const colorStr = palette.map((c) => c.hex.toUpperCase()).join(', ')
    try {
      await navigator.clipboard.writeText(colorStr)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === toIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    reorderPalette(dragIndex, toIndex)
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="palette-panel">
      <div className="palette-header">
        <h3 className="palette-title">调色板</h3>
        <button className="export-btn" onClick={handleExport}>
          导出
        </button>
      </div>

      <div className="palette-grid">
        {palette.map((color, index) => (
          <div
            key={color.id}
            className="color-card"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            style={{
              opacity: dragIndex === index ? 0.5 : 1,
              transform: dragOverIndex === index ? 'scale(1.03)' : 'scale(1)',
            }}
          >
            <button
              className="delete-btn"
              onClick={() => removeFromPalette(color.id)}
              aria-label="删除颜色"
            >
              ×
            </button>
            <div
              className="card-color-block"
              style={{ backgroundColor: color.hex }}
            />
            <div className="card-color-hex">{color.hex.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <button className="add-color-btn" onClick={handleAddColor}>
        + 添加当前颜色
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setShowModal(false)}
              aria-label="关闭"
            >
              ×
            </button>
            <h3 className="modal-title">导出调色板</h3>
            <div className="modal-color-list">
              {palette.map((color) => (
                <div key={color.id} className="modal-color-item">
                  <div
                    className="modal-color-swatch"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="modal-color-text">
                    {color.hex.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
            <button
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? '✓ 已复制' : '复制颜色列表'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PalettePanel
