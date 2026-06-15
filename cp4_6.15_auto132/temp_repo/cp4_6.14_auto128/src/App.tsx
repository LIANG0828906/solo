import { useRef, useState } from 'react'
import { useEditorStore, ToolType } from './store'
import { EditorCanvas, EditorCanvasRef } from './editor'

const TOOL_CONFIG: Record<ToolType, { name: string; icon: string }> = {
  platform: { name: '平台', icon: '▬' },
  spike: { name: '尖刺', icon: '▲' },
  coin: { name: '金币', icon: '●' },
  goal: { name: '终点', icon: '⚑' },
}

function App() {
  const canvasRef = useRef<EditorCanvasRef>(null)
  const [pressedButton, setPressedButton] = useState<string | null>(null)

  const { currentTool, setCurrentTool, isPlaying, setPlaying, mousePosition } = useEditorStore()

  const handleToolClick = (tool: ToolType) => {
    if (isPlaying) return
    setPressedButton(tool)
    setTimeout(() => setPressedButton(null), 150)
    setCurrentTool(tool)
  }

  const handlePlayClick = () => {
    setPressedButton('play')
    setTimeout(() => setPressedButton(null), 150)
    setPlaying(!isPlaying)
  }

  return (
    <div className="app-container">
      <aside className="toolbar">
        <div className="toolbar-inner">
          {(Object.keys(TOOL_CONFIG) as ToolType[]).map((tool) => {
            const config = TOOL_CONFIG[tool]
            const isSelected = currentTool === tool
            const isPressed = pressedButton === tool

            return (
              <button
                key={tool}
                onClick={() => handleToolClick(tool)}
                disabled={isPlaying}
                className={`tool-btn ${isSelected ? 'selected' : ''} ${isPressed ? 'pressed' : ''}`}
                title={config.name}
              >
                <span className="tool-icon">{config.icon}</span>
              </button>
            )
          })}

          <div className="toolbar-divider" />

          <button
            onClick={handlePlayClick}
            className={`play-btn ${pressedButton === 'play' ? 'pressed' : ''} ${isPlaying ? 'stop' : ''}`}
            title={isPlaying ? '停止测试' : '运行测试'}
          >
            <span className="tool-icon">{isPlaying ? '■' : '▶'}</span>
          </button>
        </div>
      </aside>

      <main className="canvas-container">
        <EditorCanvas ref={canvasRef} />
      </main>

      <footer className="status-bar">
        <span className="status-item">
          工具: <strong>{TOOL_CONFIG[currentTool].name}</strong>
        </span>
        <span className="status-item">
          鼠标: ({Math.round(mousePosition.x)}, {Math.round(mousePosition.y)})
        </span>
        <span className="status-item hint">
          左键放置/拖拽 · 右键删除 · 右下角调整大小 · Ctrl+Z撤销 · Ctrl+Shift+Z重做 · ESC退出测试
        </span>
      </footer>
    </div>
  )
}

export default App
