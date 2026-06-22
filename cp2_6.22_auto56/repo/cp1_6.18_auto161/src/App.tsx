import React from 'react'
import { SeatGrid } from './ui/seatGrid'
import { TicketCard } from './ui/ticketCard'
import { useTheaterStore } from './stores/theaterStore'
import './index.css'

const App: React.FC = () => {
  const mode = useTheaterStore((s) => s.mode)
  const setMode = useTheaterStore((s) => s.setMode)
  const viewport = useTheaterStore((s) => s.viewport)
  const resetLayout = useTheaterStore((s) => s.resetLayout)
  const initDefaultLayout = useTheaterStore((s) => s.initDefaultLayout)
  const seats = useTheaterStore((s) => s.seats)

  return (
    <div className="app-container">
      <div className="top-bar">
        <div className="top-title">虚拟放映厅</div>
        <div className="mode-switcher">
          <button
            className={`mode-btn ${mode === 'viewer' ? 'active' : ''}`}
            onClick={() => setMode('viewer')}
          >
            观众模式
          </button>
          <button
            className={`mode-btn ${mode === 'editor' ? 'active' : ''}`}
            onClick={() => setMode('editor')}
          >
            编辑模式
          </button>
        </div>
      </div>

      {mode === 'editor' && (
        <>
          <div className="editor-toolbar">
            <button
              className="tool-btn"
              title="重置布局"
              onClick={() => {
                if (confirm('确定要清空所有座位吗？')) {
                  resetLayout()
                }
              }}
            >
              🗑️
            </button>
            <button
              className="tool-btn"
              title="恢复默认"
              onClick={initDefaultLayout}
            >
              ↺
            </button>
          </div>
          <div className="tool-hint">
            <div><strong>编辑操作：</strong></div>
            <div>拖拽框选 → 批量添加座位</div>
            <div>Ctrl+点击 → 多选座位</div>
            <div>右键座位 → 删除/复制行</div>
            <div>Alt+拖拽 / 中键 → 平移画布</div>
            <div>滚轮 → 缩放画布</div>
          </div>
        </>
      )}

      <div className="zoom-indicator">
        缩放: {Math.round(viewport.scale * 100)}% · 座位: {seats.length}
      </div>

      <div className="main-content">
        <div className="aisle-left" />
        <SeatGrid />
        <div className="aisle-right" />
      </div>

      <div className="footer-bar">
        © 2024 虚拟放映厅 · Virtual Cinema
      </div>

      <TicketCard />
    </div>
  )
}

export default App
