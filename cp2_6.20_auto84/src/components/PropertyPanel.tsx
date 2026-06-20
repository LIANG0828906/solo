import { useState, useEffect } from 'react'
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-react'
import { useEditorStore } from '../store/editorStore'
import type { CanvasElement, TextElement, StickerElement, DrawingElement } from '../store/editorStore'
import './PropertyPanel.css'

const FONT_FAMILIES = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Impact',
  'Comic Sans MS',
  'Microsoft YaHei',
  'PingFang SC',
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
            <option key={f} value={f}>{f}</option>
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
  return (
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
      <label className="color-input-label">
        <div
          className="color-preview"
          style={{ background: isTransparent ? 'repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50% / 10px 10px' : value }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => {
            onChange(e.target.value, false)
          }}
          onBlur={onChangeComplete}
          className="color-input"
        />
      </label>
      <span className="color-hex">{value}</span>
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
