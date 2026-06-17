import { useState } from 'react'
import { useBreakpointStore } from '../stores/breakpointStore'

interface ControlPanelProps {
  isOpen: boolean
  onToggle: () => void
}

export function ControlPanel({ isOpen, onToggle }: ControlPanelProps) {
  const {
    breakpoints,
    addBreakpoint,
    removeBreakpoint,
    updateBreakpoint,
    resetBreakpoints,
    reorderBreakpoints,
  } = useBreakpointStore()

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    reorderBreakpoints(draggedIndex, index)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleAddBreakpoint = () => {
    const lastWidth = breakpoints[breakpoints.length - 1]?.width || 375
    addBreakpoint({
      label: `断点 ${breakpoints.length + 1}`,
      width: Math.min(lastWidth + 200, 2000),
      color: '#888888',
    })
  }

  return (
    <>
      <button
        className={`control-panel-toggle ${isOpen ? 'open' : ''}`}
        onClick={onToggle}
        aria-label={isOpen ? '收起控制面板' : '展开控制面板'}
      >
        {isOpen ? '◀' : '▶'}
      </button>

      <div className={`control-panel ${isOpen ? 'open' : ''}`}>
        <div className="control-panel-header">
          <h3>断点管理</h3>
          <button className="reset-btn" onClick={resetBreakpoints}>
            重置
          </button>
        </div>

        <div className="breakpoint-list">
          {breakpoints.map((bp, index) => (
            <div
              key={bp.id}
              className={`breakpoint-item ${draggedIndex === index ? 'dragging' : ''}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="breakpoint-drag-handle">⋮⋮</div>

              <div
                className="breakpoint-color-dot"
                style={{ backgroundColor: bp.color }}
              />

              <input
                type="text"
                className="breakpoint-label-input"
                value={bp.label}
                onChange={(e) =>
                  updateBreakpoint(bp.id, { label: e.target.value })
                }
                placeholder="标签名"
              />

              <div className="breakpoint-slider-container">
                <input
                  type="range"
                  min={200}
                  max={2000}
                  step={10}
                  value={bp.width}
                  onChange={(e) =>
                    updateBreakpoint(bp.id, { width: Number(e.target.value) })
                  }
                  className="breakpoint-width-slider"
                  style={{
                    background: `linear-gradient(to right, ${bp.color} 0%, ${bp.color} ${((bp.width - 200) / 1800) * 100}%, #3D3D52 ${((bp.width - 200) / 1800) * 100}%, #3D3D52 100%)`,
                  }}
                />
                <span className="breakpoint-width-value">{bp.width}px</span>
              </div>

              <input
                type="color"
                className="breakpoint-color-picker"
                value={bp.color}
                onChange={(e) =>
                  updateBreakpoint(bp.id, { color: e.target.value })
                }
                title="选择颜色"
              />

              <button
                className="breakpoint-delete-btn"
                onClick={() => removeBreakpoint(bp.id)}
                disabled={breakpoints.length <= 1}
                title="删除断点"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button className="add-breakpoint-btn" onClick={handleAddBreakpoint}>
          <span className="add-icon">+</span>
          添加断点
        </button>
      </div>
    </>
  )
}
