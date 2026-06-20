import React, { useState, useEffect, useMemo } from 'react'
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, isValidHex, normalizeHex, type ColorFormat } from '../utils/colorUtils'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  onClose?: () => void
  onDelete?: () => void
  canDelete?: boolean
}

const SWATCHES = [
  '#FF0000', '#FF4500', '#FF8C00', '#FFD700', '#ADFF2F', '#00FF7F',
  '#00FA9A', '#00FFFF', '#1E90FF', '#4169E1', '#8A2BE2', '#FF1493',
  '#FF69B4', '#FFB6C1', '#DDA0DD', '#9370DB', '#87CEEB', '#98FB98',
  '#F0E68C', '#FA8072', '#FFFFFF', '#E0E0E0', '#A0A0A0', '#606060',
  '#404040', '#202020', '#000000', '#8B4513', '#CD853F', '#DEB887',
  '#F5DEB3', '#2F4F4F', '#556B2F', '#6B8E23', '#228B22', '#006400',
  '#008080', '#008B8B', '#4682B4', '#191970', '#00008B', '#4B0082',
  '#8B008B', '#8B0000', '#A52A2A', '#B22222', '#CD5C5C', '#F08080',
]

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, onClose, onDelete, canDelete = true }) => {
  const [tab, setTab] = useState<'swatches' | 'input'>('swatches')
  const [format, setFormat] = useState<ColorFormat>('hex')
  const [hexInput, setHexInput] = useState(color)
  const rgb = useMemo(() => hexToRgb(color), [color])
  const hsl = useMemo(() => rgbToHsl(rgb), [rgb])

  useEffect(() => { setHexInput(color) }, [color])

  const handleHexChange = (val: string) => {
    setHexInput(val)
    if (isValidHex(val)) {
      onChange(normalizeHex(val))
    }
  }

  const handleRgbChange = (key: 'r' | 'g' | 'b', v: number) => {
    const newRgb = { ...rgb, [key]: Math.max(0, Math.min(255, v)) }
    onChange(rgbToHex(newRgb))
  }

  const handleHslChange = (key: 'h' | 's' | 'l', v: number) => {
    const clamped = key === 'h'
      ? ((v % 360) + 360) % 360
      : Math.max(0, Math.min(100, v))
    const newHsl = { ...hsl, [key]: clamped }
    onChange(rgbToHex(hslToRgb(newHsl)))
  }

  return (
    <div className="picker-panel" onClick={e => e.stopPropagation()}>
      <div className="picker-tabs">
        <button
          className={`picker-tab ${tab === 'swatches' ? 'active' : ''}`}
          onClick={() => setTab('swatches')}
        >色板</button>
        <button
          className={`picker-tab ${tab === 'input' ? 'active' : ''}`}
          onClick={() => setTab('input')}
        >取色器</button>
      </div>

      {tab === 'swatches' && (
        <div className="swatch-grid">
          {SWATCHES.map(s => (
            <div
              key={s}
              className={`swatch ${s.toUpperCase() === color.toUpperCase() ? 'selected' : ''}`}
              style={{ background: s }}
              onClick={() => onChange(s.toUpperCase())}
              title={s}
            />
          ))}
        </div>
      )}

      {tab === 'input' && (
        <>
          <div className="format-tabs">
            {(['hex', 'rgb', 'hsl'] as const).map(f => (
              <button
                key={f}
                className={`format-tab ${format === f ? 'active' : ''}`}
                onClick={() => setFormat(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          {format === 'hex' && (
            <div className="input-section">
              <input
                type="text"
                className="color-input"
                value={hexInput}
                onChange={e => handleHexChange(e.target.value)}
                placeholder="#RRGGBB"
                spellCheck={false}
              />
            </div>
          )}

          {format === 'rgb' && (
            <div className="rgb-inputs">
              {(['r', 'g', 'b'] as const).map(k => (
                <div key={k} className="num-input-group">
                  <label>{k.toUpperCase()}</label>
                  <input
                    type="number"
                    className="num-input"
                    min="0"
                    max="255"
                    value={Math.round(rgb[k])}
                    onChange={e => handleRgbChange(k, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          )}

          {format === 'hsl' && (
            <div className="hsl-inputs">
              <div className="num-input-group">
                <label>H°</label>
                <input
                  type="number"
                  className="num-input"
                  min="0"
                  max="359"
                  value={Math.round(hsl.h)}
                  onChange={e => handleHslChange('h', Number(e.target.value))}
                />
              </div>
              <div className="num-input-group">
                <label>S%</label>
                <input
                  type="number"
                  className="num-input"
                  min="0"
                  max="100"
                  value={Math.round(hsl.s)}
                  onChange={e => handleHslChange('s', Number(e.target.value))}
                />
              </div>
              <div className="num-input-group">
                <label>L%</label>
                <input
                  type="number"
                  className="num-input"
                  min="0"
                  max="100"
                  value={Math.round(hsl.l)}
                  onChange={e => handleHslChange('l', Number(e.target.value))}
                />
              </div>
            </div>
          )}
        </>
      )}

      <div className="picker-footer">
        <div className="preview-color-box" style={{ background: color }} />
        {canDelete && onDelete && (
          <button className="delete-stop-btn" onClick={onDelete}>删除色标</button>
        )}
      </div>
    </div>
  )
}

export default ColorPicker
