import React, { useState, useEffect } from 'react'
import { Card, PRESET_COLORS } from '../types'

interface Props {
  card: Card
  onClose: () => void
  onUpdate: (patch: Partial<Card>) => void
}

const CardEditor: React.FC<Props> = ({ card, onClose, onUpdate }) => {
  const [localColor, setLocalColor] = useState(card.color)
  const [localOpacity, setLocalOpacity] = useState(card.opacity)
  const [localWidth, setLocalWidth] = useState(card.width)
  const [localHeight, setLocalHeight] = useState(card.height)

  useEffect(() => {
    setLocalColor(card.color)
    setLocalOpacity(card.opacity)
    setLocalWidth(card.width)
    setLocalHeight(card.height)
  }, [card.id, card.color, card.opacity, card.width, card.height])

  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdate({
        color: localColor,
        opacity: localOpacity,
        width: localWidth,
        height: localHeight,
      })
    }, 30)
    return () => clearTimeout(timer)
  }, [localColor, localOpacity, localWidth, localHeight, onUpdate])

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="card-editor-overlay" onMouseDown={handleOverlayMouseDown}>
      <div className="card-editor">
        <div className="editor-header">
          <div className="editor-title">
            <i className="fa fa-sliders" style={{ color: '#60a5fa' }} />
            卡片属性
          </div>
          <button className="editor-close" onClick={onClose} title="关闭">
            <i className="fa fa-times" />
          </button>
        </div>

        <div className="editor-section">
          <label className="editor-label">
            <i className="fa fa-paint-brush" style={{ marginRight: 6 }} />
            颜色
          </label>
          <div className="editor-color-grid">
            {PRESET_COLORS.map((c) => (
              <div
                key={c}
                className={`editor-color-item ${c === localColor ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setLocalColor(c)}
                title={c}
              />
            ))}
          </div>
        </div>

        <div className="editor-section">
          <label className="editor-label">
            <i className="fa fa-adjust" style={{ marginRight: 6 }} />
            透明度
          </label>
          <div className="editor-slider-row">
            <input
              type="range"
              className="editor-slider"
              min={0.1}
              max={1.0}
              step={0.05}
              value={localOpacity}
              onChange={(e) => setLocalOpacity(parseFloat(e.target.value))}
            />
            <span className="editor-value">{localOpacity.toFixed(2)}</span>
          </div>
        </div>

        <div className="editor-section">
          <label className="editor-label">
            <i className="fa fa-arrows-h" style={{ marginRight: 6 }} />
            尺寸 (宽 × 高)
          </label>
          <div className="editor-size-grid">
            <div>
              <div
                className="editor-label"
                style={{ marginBottom: 6, fontSize: 11, opacity: 0.7 }}
              >
                宽度
              </div>
              <div className="editor-slider-row">
                <input
                  type="range"
                  className="editor-slider"
                  min={40}
                  max={240}
                  step={4}
                  value={localWidth}
                  onChange={(e) => setLocalWidth(parseInt(e.target.value, 10))}
                />
                <span className="editor-value">{localWidth}</span>
              </div>
            </div>
            <div>
              <div
                className="editor-label"
                style={{ marginBottom: 6, fontSize: 11, opacity: 0.7 }}
              >
                高度
              </div>
              <div className="editor-slider-row">
                <input
                  type="range"
                  className="editor-slider"
                  min={40}
                  max={240}
                  step={4}
                  value={localHeight}
                  onChange={(e) => setLocalHeight(parseInt(e.target.value, 10))}
                />
                <span className="editor-value">{localHeight}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardEditor
