import { Undo2, Redo2, Eraser, Download, Trash2 } from 'lucide-react'

const COLOR_PALETTE = [
  '#000000', '#ffffff', '#7f7f7f', '#c3c3c3',
  '#880015', '#ed1c24', '#ff7f27', '#fff200',
  '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
  '#b97a57', '#ffaec9', '#c8bfe7', '#d4d4d4',
]

interface ToolbarProps {
  currentColor: string
  onColorChange: (color: string) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
  isErasing: boolean
  onErasingChange: (erasing: boolean) => void
  cellSize: number
  onCellSizeChange: (size: number) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onExport: () => void
  onClear: () => void
}

export default function Toolbar({
  currentColor,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  isErasing,
  onErasingChange,
  cellSize,
  onCellSizeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  onClear,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <div className="toolbar-label">颜色选择</div>
        <div className="color-palette">
          {COLOR_PALETTE.map(color => (
            <button
              key={color}
              className={`color-swatch ${currentColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
              title={color}
            />
          ))}
        </div>
        <div className="current-color-display">
          <div className="current-color-preview" style={{ backgroundColor: currentColor }} />
          <span className="current-color-hex">{currentColor.toUpperCase()}</span>
        </div>
      </div>

      <div className="toolbar-section">
        <div className="toolbar-label">笔刷大小</div>
        <div className="brush-size-selector">
          {[1, 2, 3].map(size => (
            <button
              key={size}
              className={`brush-btn ${brushSize === size ? 'selected' : ''}`}
              onClick={() => onBrushSizeChange(size)}
              title={`${size}x${size}`}
            >
              <div
                className="brush-dot"
                style={{ width: size * 6, height: size * 6 }}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <div className="toolbar-label">单元尺寸</div>
        <div className="cell-size-control">
          <input
            type="range"
            min={8}
            max={24}
            step={1}
            value={cellSize}
            onChange={e => onCellSizeChange(Number(e.target.value))}
            className="cell-size-slider"
          />
          <span className="cell-size-value">{cellSize}px</span>
        </div>
      </div>

      <div className="divider" />

      <div className="toolbar-section">
        <button
          className={`toolbar-btn ${isErasing ? 'eraser-active' : ''}`}
          onClick={() => onErasingChange(!isErasing)}
        >
          <Eraser size={16} />
          <span>{isErasing ? '擦除中' : '橡皮擦'}</span>
        </button>
      </div>

      <div className="toolbar-section">
        <div className="btn-row">
          <button
            className="toolbar-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="撤销"
          >
            <Undo2 size={16} />
            <span>撤销</span>
          </button>
          <button
            className="toolbar-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title="重做"
          >
            <Redo2 size={16} />
            <span>重做</span>
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <button className="toolbar-btn" onClick={onExport}>
          <Download size={16} />
          <span>导出 PNG</span>
        </button>
      </div>

      <div className="toolbar-section">
        <button className="toolbar-btn clear-canvas-btn" onClick={onClear}>
          <Trash2 size={16} />
          <span>清空画布</span>
        </button>
      </div>
    </div>
  )
}
