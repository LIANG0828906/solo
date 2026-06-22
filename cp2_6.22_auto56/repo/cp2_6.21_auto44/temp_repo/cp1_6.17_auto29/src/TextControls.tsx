import React, { useState, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAppStore } from './store'
import { FONT_FAMILIES, DEFAULT_TEXT } from './types'
import type { TextSettings } from './types'

const COLOR_SWATCHES = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#FF0000', '#FF6B00', '#FFD000', '#00FF00', '#00D0FF', '#0066FF',
  '#FF00FF', '#FF6699', '#9966FF', '#66CCFF', '#66FF99', '#FFCC66',
  '#8B4513', '#A52A2A', '#DC143C', '#FF1493', '#9400D3', '#4B0082',
  '#00008B', '#008B8B', '#006400', '#808000', '#800000', '#808080',
  '#F0E68C', '#E6E6FA', '#FFE4E1', '#E0FFFF', '#F0FFF0', '#FFF8DC',
]

const TextControls: React.FC = () => {
  const { layers, selectedLayerId, updateLayer, addLayer } = useAppStore()
  const [showColorPicker, setShowColorPicker] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  const selectedLayer = layers.find((l) => l.id === selectedLayerId)
  const isTextLayer = selectedLayer?.type === 'text'
  const textSettings = selectedLayer?.text || DEFAULT_TEXT

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTextChange = (key: keyof TextSettings, value: any) => {
    if (!selectedLayerId || !isTextLayer) return
    updateLayer(selectedLayerId, {
      text: { ...textSettings, [key]: value },
    })
  }

  const handleAddText = () => {
    const { canvasSize } = useAppStore.getState()
    const textCount = layers.filter((l) => l.type === 'text').length + 1
    const newText = {
      ...DEFAULT_TEXT,
      text: `文字 ${textCount}`,
    }

    const textWidth = 200
    const textHeight = 50

    addLayer({
      id: uuidv4(),
      name: newText.text,
      type: 'text',
      x: (canvasSize.width - textWidth) / 2,
      y: (canvasSize.height - textHeight) / 2,
      width: textWidth,
      height: textHeight,
      filter: { brightness: 1, contrast: 1, hue: 0, saturation: 1, blur: 0, sepia: 0, grayscale: 0 },
      text: newText,
      rotation: 0,
      scale: 1,
      visible: true,
    })
  }

  const handleColorSelect = (color: string) => {
    handleTextChange('color', color)
  }

  const handleOpacityChange = (opacity: number) => {
    handleTextChange('opacity', opacity)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="add-text-section">
        <button className="add-text-btn" onClick={handleAddText}>
          + 添加文字图层
        </button>
      </div>

      {isTextLayer && (
        <div className="text-controls" style={{ flex: 1, overflowY: 'auto' }}>
          <h3 className="panel-title">文字设置</h3>

          <div className="control-group">
            <label className="control-label">文字内容</label>
            <textarea
              className="text-input"
              value={textSettings.text}
              rows={3}
              onChange={(e) => handleTextChange('text', e.target.value)}
              placeholder="输入文字..."
              style={{ resize: 'vertical', fontFamily: textSettings.fontFamily }}
            />
          </div>

          <div className="control-group">
            <label className="control-label">字体</label>
            <select
              className="font-select"
              value={textSettings.fontFamily}
              onChange={(e) => handleTextChange('fontFamily', e.target.value)}
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font.name} value={font.value}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">字号: {textSettings.fontSize}px</label>
            <input
              type="range"
              className="filter-slider"
              min={12}
              max={120}
              step={1}
              value={textSettings.fontSize}
              onChange={(e) => handleTextChange('fontSize', parseInt(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label className="control-label">字重</label>
            <div className="text-weight-buttons">
              {[400, 500, 700, 900].map((weight) => (
                <button
                  key={weight}
                  className={`weight-btn ${textSettings.fontWeight === weight ? 'active' : ''}`}
                  onClick={() => handleTextChange('fontWeight', weight)}
                >
                  {weight}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">颜色</label>
            <div className="color-picker-container" ref={colorPickerRef}>
              <div
                className="color-picker-trigger"
                onClick={() => setShowColorPicker(!showColorPicker)}
              >
                <div
                  className="color-preview"
                  style={{ backgroundColor: textSettings.color }}
                />
                <span style={{ fontSize: 13, color: '#616161' }}>
                  {textSettings.color}
                </span>
              </div>
              {showColorPicker && (
                <div className="color-picker-popup">
                  <div className="color-grid">
                    {COLOR_SWATCHES.map((color) => (
                      <div
                        key={color}
                        className={`color-swatch ${textSettings.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorSelect(color)}
                      />
                    ))}
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div className="filter-slider-label">
                      <span>透明度</span>
                      <span>{Math.round(textSettings.opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      className="filter-slider opacity-slider"
                      min={0}
                      max={1}
                      step={0.01}
                      value={textSettings.opacity}
                      onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">对齐方式</label>
            <div className="align-buttons">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  className={`align-btn ${textSettings.textAlign === align ? 'active' : ''}`}
                  onClick={() => handleTextChange('textAlign', align)}
                >
                  {align === 'left' ? '左对齐' : align === 'center' ? '居中' : '右对齐'}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">旋转角度: {textSettings.rotation}°</label>
            <input
              type="range"
              className="filter-slider"
              min={-90}
              max={90}
              step={1}
              value={textSettings.rotation}
              onChange={(e) => handleTextChange('rotation', parseInt(e.target.value))}
            />
          </div>
        </div>
      )}

      {!isTextLayer && (
        <div className="empty-state" style={{ flex: 1 }}>
          <div className="empty-icon">✍️</div>
          <div>选择文字图层进行编辑</div>
          <div style={{ fontSize: '12px', color: '#bbb', marginTop: 4 }}>
            或点击上方按钮添加新文字
          </div>
        </div>
      )}
    </div>
  )
}

export default TextControls
