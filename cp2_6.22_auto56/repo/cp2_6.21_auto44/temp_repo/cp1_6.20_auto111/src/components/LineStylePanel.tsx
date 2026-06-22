import React, { useState } from 'react'
import { SketchPicker, ColorResult } from 'react-color'
import { useDispatch, useSelector } from 'react-redux'
import { updateLineStyle, setLineBackground, clearLineBackground } from '@/store/poemStore'
import type { RootState } from '@/store/poemStore'
import type { LineStyle } from '@/types'

interface LineStylePanelProps {
  lineId: string
  currentStyle: LineStyle
}

const fontFamilies = [
  { name: '思源宋体', value: "'Noto Serif SC', serif" },
  { name: '毛笔字体', value: "'Ma Shan Zheng', 'Noto Serif SC', serif" },
  { name: '文艺字体', value: "'ZCOOL XiaoWei', 'Noto Serif SC', serif" },
  { name: '系统衬线', value: 'Georgia, serif' },
]

const backgroundPresets = [
  { name: '无', value: '' },
  { name: '墨韵', value: 'linear-gradient(90deg, rgba(44, 44, 44, 0.1) 0%, rgba(44, 44, 44, 0.02) 100%)' },
  { name: '霞光', value: 'linear-gradient(90deg, rgba(255, 154, 158, 0.15) 0%, rgba(250, 208, 196, 0.08) 100%)' },
  { name: '森林', value: 'linear-gradient(90deg, rgba(45, 90, 75, 0.12) 0%, rgba(45, 90, 75, 0.04) 100%)' },
  { name: '星空', value: 'linear-gradient(90deg, rgba(74, 144, 217, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%)' },
  { name: '极光', value: 'linear-gradient(90deg, rgba(78, 205, 196, 0.15) 0%, rgba(65, 90, 119, 0.08) 100%)' },
]

const LineStylePanel: React.FC<LineStylePanelProps> = ({ lineId, currentStyle }) => {
  const dispatch = useDispatch()
  const [showColorPicker, setShowColorPicker] = useState(false)

  const handleStyleChange = (style: Partial<LineStyle>) => {
    dispatch(updateLineStyle({ lineId, style }))
  }

  const handleColorChange = (color: ColorResult) => {
    handleStyleChange({ color: color.hex })
  }

  const handleBackgroundChange = (bg: string) => {
    if (bg) {
      dispatch(setLineBackground({ lineId, background: bg }))
    } else {
      dispatch(clearLineBackground(lineId))
    }
  }

  return (
    <div className="style-panel" style={panelStyle}>
      <div style={sectionStyle}>
        <label style={labelStyle}>字体</label>
        <select
          value={currentStyle.fontFamily}
          onChange={(e) => handleStyleChange({ fontFamily: e.target.value })}
          style={selectStyle}
        >
          {fontFamilies.map((font) => (
            <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
              {font.name}
            </option>
          ))}
        </select>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>字号: {currentStyle.fontSize}px</label>
        <input
          type="range"
          min="12"
          max="48"
          value={currentStyle.fontSize}
          onChange={(e) => handleStyleChange({ fontSize: Number(e.target.value) })}
          style={rangeStyle}
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>颜色</label>
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowColorPicker(!showColorPicker)}
            style={{
              ...colorButtonStyle,
              backgroundColor: currentStyle.color,
            }}
          />
          {showColorPicker && (
            <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 8 }}>
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowColorPicker(false)} />
              <SketchPicker
                color={currentStyle.color}
                onChange={handleColorChange}
                disableAlpha
              />
            </div>
          )}
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>行高: {currentStyle.lineHeight}</label>
        <input
          type="range"
          min="1"
          max="3"
          step="0.1"
          value={currentStyle.lineHeight}
          onChange={(e) => handleStyleChange({ lineHeight: Number(e.target.value) })}
          style={rangeStyle}
        />
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>对齐</label>
        <div style={buttonGroupStyle}>
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              onClick={() => handleStyleChange({ textAlign: align })}
              style={{
                ...alignButtonStyle,
                backgroundColor: currentStyle.textAlign === align ? 'var(--accent)' : 'var(--bg-secondary)',
                color: currentStyle.textAlign === align ? 'white' : 'var(--text-primary)',
              }}
            >
              {align === 'left' ? '左' : align === 'center' ? '中' : '右'}
            </button>
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>背景装饰</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {backgroundPresets.map((bg) => (
            <button
              key={bg.name}
              onClick={() => handleBackgroundChange(bg.value)}
              style={{
                ...bgButtonStyle,
                background: bg.value || 'var(--bg-secondary)',
                border: currentStyle.background === bg.value ? '2px solid var(--accent)' : '1px solid var(--border)',
              }}
              title={bg.name}
            >
              {bg.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  padding: 16,
  backgroundColor: 'var(--bg-primary)',
  borderTop: '1px solid var(--border)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 120,
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-secondary)',
}

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontSize: 14,
  cursor: 'pointer',
}

const rangeStyle: React.CSSProperties = {
  width: 120,
  cursor: 'pointer',
  accentColor: 'var(--accent)',
}

const colorButtonStyle: React.CSSProperties = {
  width: 40,
  height: 32,
  borderRadius: 8,
  border: '2px solid var(--border)',
  cursor: 'pointer',
}

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
}

const alignButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid var(--border)',
  fontSize: 13,
  cursor: 'pointer',
}

const bgButtonStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  fontSize: 11,
  cursor: 'pointer',
}

export default LineStylePanel
