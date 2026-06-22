import { useState, useEffect, useRef } from 'react'
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import type { CanvasElement, TextElement, StickerElement, DrawingElement } from '../store/editorStore'
import './PropertyPanel.css'

const FONT_FAMILIES = [
  { name: '微软雅黑', value: 'Microsoft YaHei' },
  { name: '黑体', value: 'SimHei' },
  { name: '宋体', value: 'SimSun' },
  { name: '楷体', value: 'KaiTi' },
  { name: '仿宋', value: 'FangSong' },
  { name: '思源黑体', value: '"Source Han Sans CN", "Noto Sans SC", sans-serif' },
  { name: '思源宋体', value: '"Source Han Serif CN", "Noto Serif SC", serif' },
  { name: '苹方', value: 'PingFang SC' },
  { name: 'Arial', value: 'Arial' },
  { name: 'Georgia', value: 'Georgia' },
  { name: 'Times New Roman', value: 'Times New Roman' },
  { name: 'Courier New', value: 'Courier New' },
  { name: 'Verdana', value: 'Verdana' },
  { name: 'Impact', value: 'Impact' },
  { name: 'Comic Sans MS', value: 'Comic Sans MS' },
]

const PRESET_COLORS = [
  '#6c5ce7',
  '#a29bfe',
  '#2d3436',
  '#636e72',
  '#ffffff',
  '#000000',
  '#e17055',
  '#d63031',
  '#e84393',
  '#fd79a8',
  '#fdcb6e',
  '#f39c12',
  '#00b894',
  '#00cec9',
  '#0984e3',
  '#74b9ff',
  '#6c5ce7',
  '#a29bfe',
]

function PropertyPanel() {
  const selectedId = useEditorStore((s) => s.selectedId)
  const elements = useEditorStore((s) => s.elements)
  const updateElement = useEditorStore((s) => s.updateElement)
  const deleteElement = useEditorStore((s) => s.deleteElement)
  const pushHistory = useEditorStore((s) => s.pushHistory)

  const selectedElement = elements.find((e) => e.id === selectedId) || null

  const handleUpdate = (id: string, updates: Partial<CanvasElement>) => {
    updateElement(id, updates)
  }

  const handleUpdateComplete = () => {
    pushHistory()
  }

  if (!selectedElement) {
    return (
      <div className="property-panel">
        <div className="property-empty">
          <p>选择画布上的元素</p>
          <p className="hint">查看和编辑属性</p>
        </div>
      </div>
    )
  }

  return (
    <div className="property-panel">
      <div className="property-header">
        <h3>属性设置</h3>
        <button
          className="delete-btn"
          onClick={() => deleteElement(selectedElement.id)}
          title="删除"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="property-body">
        {selectedElement.type === 'text' && (
          <TextProperties
            element={selectedElement as TextElement}
            onUpdate={(updates) => handleUpdate(selectedElement.id, updates)}
            onUpdateComplete={handleUpdateComplete}
          />
        )}
        {selectedElement.type === 'sticker' && (
          <StickerProperties
            element={selectedElement as StickerElement}
            onUpdate={(updates) => handleUpdate(selectedElement.id, updates)}
            onUpdateComplete={handleUpdateComplete}
          />
        )}
        {selectedElement.type === 'drawing' && (
          <DrawingProperties
            element={selectedElement as DrawingElement}
            onUpdate={(updates) => handleUpdate(selectedElement.id, updates)}
            onUpdateComplete={handleUpdateComplete}
          />
        )}

        <div className="property-section">
          <label className="property-label">不透明度</label>
          <SliderControl
            value={Math.round(selectedElement.opacity * 100)}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => handleUpdate(selectedElement.id, { opacity: v / 100 })}
            onChangeComplete={handleUpdateComplete}
          />
        </div>

        <div className="property-section">
          <label className="property-label">旋转角度</label>
          <RotationKnob
            value={selectedElement.rotation}
            onChange={(v) => handleUpdate(selectedElement.id, { rotation: v })}
            onChangeComplete={handleUpdateComplete}
          />
        </div>
      </div>
    </div>
  )
}

interface ControlProps {
  element: CanvasElement
  onUpdate: (updates: Partial<CanvasElement>) => void
  onUpdateComplete: () => void
}

function TextProperties({ element, onUpdate, onUpdateComplete }: ControlProps & { element: TextElement }) {
  return (
    <>
      <div className="property-section">
        <label className="property-label">字体</label>
        <select
          className="property-select"
          value={element.fontFamily}
          onChange={(e) => {
            onUpdate({ fontFamily: e.target.value })
            onUpdateComplete()
          }}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="property-section">
        <label className="property-label">字号</label>
        <SliderWithInput
          value={element.fontSize}
          min={12}
          max={120}
          unit="px"
          onChange={(v) => onUpdate({ fontSize: v } as Partial<TextElement>)}
          onChangeComplete={onUpdateComplete}
        />
      </div>

      <div className="property-section">
        <label className="property-label">行高</label>
        <SliderControl
          value={element.lineHeight * 10}
          min={10}
          max={30}
          unit=""
          displayValue={(v) => (v / 10).toFixed(1)}
          onChange={(v) => onUpdate({ lineHeight: v / 10 } as Partial<TextElement>)}
          onChangeComplete={onUpdateComplete}
        />
      </div>

      <div className="property-section">
        <label className="property-label">对齐方式</label>
        <div className="align-buttons">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              className={`align-btn ${element.textAlign === align ? 'active' : ''}`}
              onClick={() => {
                onUpdate({ textAlign: align } as Partial<TextElement>)
                onUpdateComplete()
              }}
            >
              {align === 'left' && <AlignLeft size={18} />}
              {align === 'center' && <AlignCenter size={18} />}
              {align === 'right' && <AlignRight size={18} />}
            </button>
          ))}
        </div>
      </div>

      <div className="property-section">
        <label className="property-label">文字颜色</label>
        <ColorPicker
          value={element.color}
          onChange={(v) => onUpdate({ color: v } as Partial<TextElement>)}
          onChangeComplete={onUpdateComplete}
        />
      </div>

      <div className="property-section">
        <label className="property-label">描边粗细</label>
        <SliderControl
          value={element.strokeWidth}
          min={0}
          max={10}
          unit="px"
          onChange={(v) => onUpdate({ strokeWidth: v } as Partial<TextElement>)}
          onChangeComplete={onUpdateComplete}
        />
      </div>
    </>
  )
}

function StickerProperties({ element, onUpdate, onUpdateComplete }: ControlProps & { element: StickerElement }) {
  return (
    <>
      <div className="property-section">
        <label className="property-label">缩放</label>
        <SliderControl
          value={Math.round(element.scale * 100)}
          min={50}
          max={300}
          unit="%"
          onChange={(v) => onUpdate({ scale: v / 100 } as Partial<StickerElement>)}
          onChangeComplete={onUpdateComplete}
        />
      </div>
      <div className="property-section">
        <label className="property-label">旋转角度</label>
        <RotationKnob
          value={element.rotation}
          onChange={(v) => onUpdate({ rotation: v } as Partial<StickerElement>)}
          onChangeComplete={onUpdateComplete}
        />
      </div>
    </>
  )
}

function DrawingProperties({ element, onUpdate, onUpdateComplete }: ControlProps & { element: DrawingElement }) {
  return (
    <>
      <div className="property-section">
        <label className="property-label">填充颜色</label>
        <ColorPicker
          value={element.fill === 'transparent' ? '#ffffff' : element.fill}
          allowTransparent
          isTransparent={element.fill === 'transparent'}
          onChange={(v, transparent) => onUpdate({ fill: transparent ? 'transparent' : v } as Partial<DrawingElement>)}
          onChangeComplete={onUpdateComplete}
        />
      </div>

      <div className="property-section">
        <label className="property-label">描边颜色</label>
        <ColorPicker
          value={element.stroke}
          onChange={(v) => onUpdate({ stroke: v } as Partial<DrawingElement>)}
          onChangeComplete={onUpdateComplete}
        />
      </div>

      <div className="property-section">
        <label className="property-label">线宽</label>
        <SliderControl
          value={element.strokeWidth}
          min={1}
          max={20}
          unit="px"
          onChange={(v) => onUpdate({ strokeWidth: v } as Partial<DrawingElement>)}
          onChangeComplete={onUpdateComplete}
        />
      </div>
    </>
  )
}

interface SliderControlProps {
  value: number
  min: number
  max: number
  unit: string
  onChange: (value: number) => void
  onChangeComplete?: () => void
  displayValue?: (value: number) => string
}

function SliderControl({ value, min, max, unit, onChange, onChangeComplete, displayValue }: SliderControlProps) {
  const percent = ((value - min) / (max - min)) * 100

  return (
    <div className="slider-control">
      <div className="slider-track">
        <div
          className="slider-fill"
          style={{ width: `${percent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseUp={onChangeComplete}
          onTouchEnd={onChangeComplete}
          className="slider-input"
        />
      </div>
      <span className="slider-value">{displayValue ? displayValue(value) : value}{unit}</span>
    </div>
  )
}

interface SliderWithInputProps {
  value: number
  min: number
  max: number
  unit: string
  onChange: (value: number) => void
  onChangeComplete?: () => void
}

function SliderWithInput({ value, min, max, unit, onChange, onChangeComplete }: SliderWithInputProps) {
  const [inputValue, setInputValue] = useState(value.toString())

  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const percent = ((value - min) / (max - min)) * 100

  const handleInputBlur = () => {
    let num = parseInt(inputValue, 10)
    if (isNaN(num)) num = min
    num = Math.max(min, Math.min(max, num))
    setInputValue(num.toString())
    onChange(num)
    onChangeComplete?.()
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur()
    }
  }

  return (
    <div className="slider-with-input">
      <div className="slider-control">
        <div className="slider-track">
          <div
            className="slider-fill"
            style={{ width: `${percent}%` }}
          />
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => {
              const v = Number(e.target.value)
              onChange(v)
              setInputValue(v.toString())
            }}
            onMouseUp={onChangeComplete}
            onTouchEnd={onChangeComplete}
            className="slider-input"
          />
        </div>
      </div>
      <div className="number-input-wrapper">
        <input
          type="number"
          className="number-input"
          value={inputValue}
          min={min}
          max={max}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
        />
        <span className="number-unit">{unit}</span>
      </div>
    </div>
  )
}

interface ColorPickerProps {
  value: string
  onChange: (value: string, transparent?: boolean) => void
  onChangeComplete?: () => void
  allowTransparent?: boolean
  isTransparent?: boolean
}

function ColorPicker({ value, onChange, onChangeComplete, allowTransparent, isTransparent }: ColorPickerProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [hexInput, setHexInput] = useState(value)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHexInput(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsPanelOpen(false)
      }
    }
    if (isPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isPanelOpen])

  const handleHexBlur = () => {
    let hex = hexInput.trim()
    if (!hex.startsWith('#')) hex = '#' + hex
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hex.toLowerCase(), false)
      onChangeComplete?.()
    } else {
      setHexInput(value)
    }
  }

  const handlePresetClick = (color: string) => {
    onChange(color, false)
    onChangeComplete?.()
  }

  return (
    <div className="color-picker-container" ref={panelRef}>
      <div className="color-picker">
        {allowTransparent && (
          <button
            className={`transparent-btn ${isTransparent ? 'active' : ''}`}
            onClick={() => {
              onChange(value, true)
              onChangeComplete?.()
            }}
          >
            无
          </button>
        )}
        <button
          className="custom-color-btn"
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          title="选择颜色"
        >
          <div
            className="color-preview-large"
            style={{ background: isTransparent ? 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 10px 10px' : value }}
          />
        </button>
        <span className="color-hex">{isTransparent ? '透明' : value}</span>
      </div>
      {isPanelOpen && (
        <div className="color-panel">
          <div className="color-panel-section">
            <span className="color-panel-label">预设颜色</span>
            <div className="preset-colors">
              {PRESET_COLORS.map((color, idx) => (
                <button
                  key={idx}
                  className={`preset-color ${value.toLowerCase() === color.toLowerCase() && !isTransparent ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handlePresetClick(color)}
                  title={color}
                />
              ))}
            </div>
          </div>
          <div className="color-panel-section">
            <span className="color-panel-label">自定义颜色</span>
            <div className="hex-input-row">
              <span className="hash-symbol">#</span>
              <input
                type="text"
                className="hex-input"
                value={hexInput.replace('#', '')}
                maxLength={6}
                onChange={(e) => setHexInput('#' + e.target.value.replace(/[^0-9A-Fa-f]/g, ''))}
                onBlur={handleHexBlur}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                placeholder="FFFFFF"
              />
            </div>
            <div className="native-color-row">
              <span className="color-panel-label-small">调色板</span>
              <label className="native-color-label">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => {
                    onChange(e.target.value, false)
                    setHexInput(e.target.value)
                  }}
                  onMouseUp={onChangeComplete}
                  className="native-color-input"
                />
                <span className="native-color-text">点击选择</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface RotationKnobProps {
  value: number
  onChange: (value: number) => void
  onChangeComplete?: () => void
}

function RotationKnob({ value, onChange, onChangeComplete }: RotationKnobProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  const handleMouseDown = () => {
    setIsDragging(true)
    setShowTooltip(true)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = (document.querySelector('.rotation-knob') as HTMLElement)?.getBoundingClientRect()
      if (!rect) return
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90
      const normalized = ((angle % 360) + 360) % 360
      onChange(Math.round(normalized))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setShowTooltip(false)
      onChangeComplete?.()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, onChange, onChangeComplete])

  return (
    <div className="rotation-container">
      <div
        className="rotation-knob"
        onMouseDown={handleMouseDown}
        onMouseEnter={() => !isDragging && setShowTooltip(true)}
        onMouseLeave={() => !isDragging && setShowTooltip(false)}
      >
        <svg viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="28" fill="none" stroke="#e0e0e0" strokeWidth="3" />
          <circle
            cx="30"
            cy="30"
            r="28"
            fill="none"
            stroke="var(--brand-color)"
            strokeWidth="3"
            strokeDasharray={`${(value / 360) * 175.9} 175.9`}
            strokeLinecap="round"
            transform="rotate(-90 30 30)"
            style={{ transition: 'stroke-dasharray 100ms ease-out' }}
          />
          <line
            x1="30"
            y1="30"
            x2="30"
            y2="12"
            stroke="var(--brand-color)"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transform: `rotate(${value}deg)`, transformOrigin: '30px 30px', transition: 'transform 100ms ease-out' }}
          />
          <circle cx="30" cy="30" r="4" fill="var(--brand-color)" />
        </svg>
        {showTooltip && (
          <div className="rotation-tooltip">{value}°</div>
        )}
      </div>
      <div className="rotation-value">{value}°</div>
    </div>
  )
}

export default PropertyPanel
