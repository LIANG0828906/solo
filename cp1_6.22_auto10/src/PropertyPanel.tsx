import type { Shape } from './types'

interface PropertyPanelProps {
  shape: Shape | null
  onUpdate: (updates: Partial<Shape>) => void
  presetColors: string[]
}

export default function PropertyPanel({ shape, onUpdate, presetColors }: PropertyPanelProps) {
  if (!shape) {
    return (
      <div className="property-panel glass">
        <h3>属性面板</h3>
        <div className="empty-panel">
          选中一个图形以编辑属性
        </div>
      </div>
    )
  }

  return (
    <div className="property-panel glass">
      <h3>图形属性</h3>

      <div className="panel-section">
        <label className="panel-label">填充颜色</label>
        <div className="color-picker">
          {presetColors.map(c => (
            <div
              key={c}
              className={`color-swatch ${shape.fill === c ? 'active' : ''}`}
              style={{ background: c, border: c === '#ffffff' ? '2px solid rgba(255,255,255,0.5)' : undefined }}
              onClick={() => onUpdate({ fill: c })}
            />
          ))}
        </div>
        <input
          type="text"
          className="color-input"
          value={shape.fill}
          onChange={e => onUpdate({ fill: e.target.value })}
          placeholder="#ffffff"
        />
      </div>

      <div className="panel-section">
        <label className="panel-label">边框颜色</label>
        <div className="color-picker">
          {presetColors.map(c => (
            <div
              key={c}
              className={`color-swatch ${shape.stroke === c ? 'active' : ''}`}
              style={{ background: c, border: c === '#ffffff' ? '2px solid rgba(255,255,255,0.5)' : undefined }}
              onClick={() => onUpdate({ stroke: c })}
            />
          ))}
        </div>
        <input
          type="text"
          className="color-input"
          value={shape.stroke}
          onChange={e => onUpdate({ stroke: e.target.value })}
          placeholder="#333333"
        />
      </div>

      <div className="panel-section">
        <label className="panel-label">
          边框粗细: {shape.strokeWidth}px
        </label>
        <input
          type="range"
          className="slider"
          min={1}
          max={10}
          step={1}
          value={shape.strokeWidth}
          onChange={e => onUpdate({ strokeWidth: Number(e.target.value) })}
        />
        <div className="slider-value">{shape.strokeWidth}px</div>
      </div>
    </div>
  )
}
