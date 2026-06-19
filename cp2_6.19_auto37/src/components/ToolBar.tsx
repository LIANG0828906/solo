import React, { useState } from 'react'
import {
  useEditorStore,
  ToolType,
  STICKERS,
  BRUSH_SIZES,
  FONT_FAMILIES,
} from '../store/editorStore'
import '../styles/toolbar.css'

const tools: { type: ToolType; icon: string; name: string }[] = [
  { type: 'select', icon: '▢', name: '选区' },
  { type: 'text', icon: 'T', name: '文字' },
  { type: 'brush', icon: '✎', name: '画笔' },
  { type: 'sticker', icon: '😀', name: '贴纸' },
]

const ToolBar: React.FC = () => {
  const {
    currentTool,
    setCurrentTool,
    brushSize,
    setBrushSize,
    brushColor,
    setBrushColor,
    textColor,
    setTextColor,
    textFontSize,
    setTextFontSize,
    textFontFamily,
    setTextFontFamily,
    addStickerLayer,
  } = useEditorStore()

  const [showPanel, setShowPanel] = useState(true)

  const handleToolClick = (tool: ToolType) => {
    setCurrentTool(tool)
    setShowPanel(true)
  }

  const handleStickerClick = (emoji: string) => {
    const canvasRect = document.querySelector('.canvas-container')?.getBoundingClientRect()
    if (canvasRect) {
      addStickerLayer(emoji, canvasRect.width / 2, canvasRect.height / 2)
    }
  }

  const renderToolPanel = () => {
    switch (currentTool) {
      case 'text':
        return (
          <div className="tool-panel slide-in">
            <div className="panel-section">
              <label className="panel-label">字体</label>
              <select
                className="panel-select"
                value={textFontFamily}
                onChange={(e) => setTextFontFamily(e.target.value)}
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="panel-section">
              <label className="panel-label">字号</label>
              <input
                type="range"
                min="12"
                max="72"
                value={textFontSize}
                onChange={(e) => setTextFontSize(Number(e.target.value))}
                className="panel-slider"
              />
              <span className="panel-value">{textFontSize}px</span>
            </div>
            <div className="panel-section">
              <label className="panel-label">颜色</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="panel-color"
              />
            </div>
          </div>
        )
      case 'brush':
        return (
          <div className="tool-panel slide-in">
            <div className="panel-section">
              <label className="panel-label">画笔粗细</label>
              <div className="brush-sizes">
                {BRUSH_SIZES.map((size) => (
                  <button
                    key={size}
                    className={`brush-size-btn ${brushSize === size ? 'active' : ''}`}
                    onClick={() => setBrushSize(size)}
                  >
                    <span
                      className="brush-dot"
                      style={{ width: size * 2, height: size * 2 }}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="panel-section">
              <label className="panel-label">颜色</label>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="panel-color"
              />
            </div>
          </div>
        )
      case 'sticker':
        return (
          <div className="tool-panel slide-in">
            <div className="panel-section">
              <label className="panel-label">选择贴纸</label>
              <div className="sticker-grid">
                {STICKERS.map((sticker) => (
                  <button
                    key={sticker.emoji}
                    className="sticker-btn"
                    onClick={() => handleStickerClick(sticker.emoji)}
                    title={sticker.name}
                  >
                    {sticker.emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="toolbar-container glass-panel">
      <div className="toolbar-buttons">
        {tools.map((tool) => (
          <button
            key={tool.type}
            className={`tool-btn ${currentTool === tool.type ? 'active' : ''}`}
            onClick={() => handleToolClick(tool.type)}
            title={tool.name}
          >
            <span className="tool-icon">{tool.icon}</span>
            <span className="tool-name">{tool.name}</span>
          </button>
        ))}
      </div>
      {showPanel && renderToolPanel()}
    </div>
  )
}

export default ToolBar
