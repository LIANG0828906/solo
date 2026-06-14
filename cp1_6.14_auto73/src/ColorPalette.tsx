import { useState } from 'react'
import type { ColorItem } from './types'

interface ColorPaletteProps {
  colors: ColorItem[]
  onReorder: (colors: ColorItem[]) => void
  onRemove: (hex: string) => void
}

function ColorPalette({ colors, onReorder, onRemove }: ColorPaletteProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newColors = [...colors]
    const [draggedItem] = newColors.splice(draggedIndex, 1)
    newColors.splice(index, 0, draggedItem)
    onReorder(newColors)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const generateCSSVars = () => {
    if (colors.length === 0) return ''
    const lines = colors.map((color, i) => `  --color-${i + 1}: ${color.hex};`)
    return `:root {\n${lines.join('\n')}\n}`
  }

  const generateSvg = () => {
    if (colors.length === 0) return ''
    const rectWidth = 100 / colors.length
    const rects = colors.map((color, i) =>
      `<rect x="${i * rectWidth}%" y="0" width="${rectWidth}%" height="100%" fill="${color.hex}" />`
    ).join('')
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 80">${rects}</svg>`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const cssContent = generateCSSVars()
  const svgContent = generateSvg()

  return (
    <div className="palette-section">
      <div className="palette-header">
        <span className="palette-title">色卡</span>
        <span className="palette-count">{colors.length} 个颜色</span>
      </div>

      {colors.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-state-icon">🎨</div>
          <p className="empty-state-text">点击图片中的颜色添加到色卡</p>
        </div>
      ) : (
        <>
          <div className="palette-grid">
            {colors.map((color, index) => (
              <div
                key={color.hex + index}
                className={`palette-item ${draggedIndex === index ? 'dragging' : ''}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                <div
                  className="palette-color"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="palette-item-info">
                  <div className="palette-item-hex">{color.hex.toUpperCase()}</div>
                </div>
                <button
                  className="palette-item-remove"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(color.hex)
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            className="export-btn"
            onClick={() => setShowExport(!showExport)}
            disabled={colors.length === 0}
          >
            {showExport ? '收起导出' : '导出色卡'}
          </button>

          {showExport && (
            <div className="export-preview">
              <h4>SVG 预览</h4>
              <div
                className="svg-palette"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />

              <h4>CSS 变量</h4>
              <pre className="export-code">{cssContent}</pre>

              <button
                className="copy-btn"
                onClick={() => copyToClipboard(cssContent)}
              >
                {copied ? '已复制 ✓' : '复制 CSS 变量'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ColorPalette
