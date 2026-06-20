import React, { useMemo } from 'react'
import { useBoardStore } from '../store'

const StatsPanel: React.FC = () => {
  const open = useBoardStore((s) => s.statsPanelOpen)
  const togglePanel = useBoardStore((s) => s.toggleStatsPanel)
  const columns = useBoardStore((s) => s.columns)
  const cards = useBoardStore((s) => s.cards)

  const stats = useMemo(() => {
    const sortedCols = [...columns].sort((a, b) => a.order - b.order)
    const colStats = sortedCols.map((col) => ({
      ...col,
      count: cards.filter((c) => c.columnId === col.id).length,
    }))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let totalDelay = 0
    let delayedCount = 0
    cards.forEach((card) => {
      if (!card.dueDate) return
      const due = new Date(card.dueDate)
      due.setHours(0, 0, 0, 0)
      const diff = Math.floor((today.getTime() - due.getTime()) / (24 * 60 * 60 * 1000))
      if (diff > 0) {
        totalDelay += diff
        delayedCount++
      }
    })
    const avgDelay = delayedCount > 0 ? (totalDelay / delayedCount).toFixed(1) : '0'

    return { colStats, avgDelay, totalCards: cards.length, delayedCount }
  }, [columns, cards])

  return (
    <>
      <button
        className={`wc-stats-toggle ${open ? 'wc-stats-toggle-active' : ''}`}
        onClick={togglePanel}
        title={open ? '关闭统计面板' : '打开统计面板'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18" />
          <path d="M7 16l4-4 4 4 5-5" />
        </svg>
      </button>

      <div
        className={`wc-stats-panel ${open ? 'wc-stats-panel-open' : ''}`}
      >
        <div className="wc-stats-header">
          <h3 className="wc-stats-title">📊 数据统计</h3>
          <button className="wc-stats-close" onClick={togglePanel}>
            ✕
          </button>
        </div>

        <div className="wc-stats-body">
          <div className="wc-stats-summary-grid">
            <div className="wc-stats-summary-item">
              <div className="wc-stats-summary-number">{stats.totalCards}</div>
              <div className="wc-stats-summary-label">总卡片数</div>
            </div>
            <div className="wc-stats-summary-item">
              <div className="wc-stats-summary-number" style={{ color: '#EF4444' }}>
                {stats.delayedCount}
              </div>
              <div className="wc-stats-summary-label">逾期卡片</div>
            </div>
            <div className="wc-stats-summary-item wc-stats-summary-full">
              <div className="wc-stats-summary-number" style={{ color: '#F97316' }}>
                {stats.avgDelay}
              </div>
              <div className="wc-stats-summary-label">平均延误天数</div>
            </div>
          </div>

          <div className="wc-stats-section">
            <h4 className="wc-stats-section-title">各阶段任务分布</h4>
            <div className="wc-stats-col-list">
              {stats.colStats.map((col, idx) => {
                const max = Math.max(1, ...stats.colStats.map((c) => c.count))
                const width = (col.count / max) * 100
                const colors = ['#3B82F6', '#F97316', '#22C55E', '#8B5CF6', '#EC4899', '#06B6D4']
                return (
                  <div key={col.id} className="wc-stats-col-item">
                    <div className="wc-stats-col-header">
                      <span className="wc-stats-col-name">{col.title}</span>
                      <span className="wc-stats-col-count">{col.count}</span>
                    </div>
                    <div className="wc-stats-col-bar-bg">
                      <div
                        className="wc-stats-col-bar"
                        style={{
                          width: `${width}%`,
                          backgroundColor: colors[idx % colors.length],
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="wc-stats-tip">
            💡 数据已自动保存到浏览器本地（IndexedDB）
          </div>
        </div>
      </div>

      {open && <div className="wc-stats-mask" onClick={togglePanel} />}
    </>
  )
}

export default StatsPanel
