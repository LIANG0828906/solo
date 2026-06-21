import type { Tool } from './types'

interface ToolbarProps {
  tool: Tool
  onToolChange: (t: Tool) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onClear: () => void
}

const TOOLS: { id: Tool; icon: string; label: string }[] = [
  { id: 'select', icon: '↖', label: '选择' },
  { id: 'rect', icon: '▭', label: '矩形' },
  { id: 'circle', icon: '○', label: '圆形' },
  { id: 'triangle', icon: '△', label: '三角形' },
  { id: 'line', icon: '╱', label: '直线' },
  { id: 'path', icon: '✎', label: '自由画笔' },
]

export default function Toolbar({
  tool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClear,
}: ToolbarProps) {
  return (
    <div className="toolbar glass">
      {TOOLS.map(t => (
        <button
          key={t.id}
          className={`tool-btn ${tool === t.id ? 'active' : ''}`}
          onClick={() => onToolChange(t.id)}
          title={t.label}
        >
          {t.icon}
        </button>
      ))}

      <div className="divider" />

      <button
        className="tool-btn"
        onClick={onUndo}
        disabled={!canUndo}
        title="撤销 (Ctrl+Z)"
        style={{ opacity: canUndo ? 1 : 0.4, cursor: canUndo ? 'pointer' : 'not-allowed' }}
      >
        ↶
      </button>
      <button
        className="tool-btn"
        onClick={onRedo}
        disabled={!canRedo}
        title="重做 (Ctrl+Shift+Z)"
        style={{ opacity: canRedo ? 1 : 0.4, cursor: canRedo ? 'pointer' : 'not-allowed' }}
      >
        ↷
      </button>

      <div className="divider" />

      <button
        className="tool-btn"
        onClick={onClear}
        title="清除画布"
      >
        🗑
      </button>
    </div>
  )
}
