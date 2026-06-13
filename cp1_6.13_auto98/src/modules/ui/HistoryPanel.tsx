import React, { useEffect, useMemo, useState, useCallback } from 'react'
import type { GameRecord, Difficulty, QuestionResult } from '../game/GameEngine'
import { DIFFICULTY_CONFIG, TOTAL_QUESTIONS } from '../game/GameEngine'
import { getAllRecords, deleteRecord } from '../storage/db'

interface HistoryPanelProps {
  isOpen: boolean
  onClose: () => void
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function difficultyBadgeColor(d: Difficulty): string {
  switch (d) {
    case 'easy':   return '#27AE60'
    case 'medium': return '#F39C12'
    case 'hard':   return '#E74C3C'
  }
}

function buildThumbnail(record: GameRecord): string[] {
  return record.results.slice(0, 6).map((r) => r.targetColor.hex)
}

const HistoryListItem: React.FC<{
  record: GameRecord
  isExpanded: boolean
  onToggle: () => void
  onDelete: () => void
}> = ({ record, isExpanded, onToggle, onDelete }) => {
  const thumbs = useMemo(() => buildThumbnail(record), [record])
  const correctCount = record.results.filter((r) => r.isCorrect).length
  const accuracy = Math.round((correctCount / TOTAL_QUESTIONS) * 100)

  return (
    <div className="history-item">
      <button className="history-item-header" onClick={onToggle} type="button">
        <div className="history-item-top">
          <span className="history-date">{formatDate(record.timestamp)}</span>
          <span
            className="history-difficulty-badge"
            style={{ background: difficultyBadgeColor(record.difficulty) }}
          >
            {DIFFICULTY_CONFIG[record.difficulty].label}
          </span>
        </div>
        <div className="history-item-score-row">
          <span className="history-score">{record.totalScore}</span>
          <div className="history-thumbs">
            {thumbs.map((hex, i) => (
              <span key={i} className="thumb" style={{ background: hex }} />
            ))}
          </div>
          <span className="history-accuracy" title="正确率">{accuracy}%</span>
        </div>
        <div className="history-item-meta">
          <span>平均反应 {record.avgReactionTimeMs}ms</span>
          <span className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>▾</span>
        </div>
      </button>
      {isExpanded && (
        <div className="history-item-detail animate-expand">
          <div className="detail-header">
            <span>答题详情</span>
            <button className="delete-btn" type="button" onClick={onDelete}>删除</button>
          </div>
          <div className="detail-list">
            {record.results.map((r: QuestionResult, idx: number) => (
              <QuestionRow key={idx} index={idx} result={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const QuestionRow: React.FC<{ index: number; result: QuestionResult }> = ({ index, result }) => (
  <div className={`q-row ${result.isCorrect ? 'q-correct' : 'q-wrong'}`}>
    <span className="q-index">#{index + 1}</span>
    <span className="q-swatch" style={{ background: result.targetColor.hex }} title={`目标 ${result.targetColor.hex}`} />
    <span className="q-arrow">→</span>
    <span className="q-swatch" style={{ background: result.selectedColor.hex }} title={`选择 ${result.selectedColor.hex}`} />
    <span className="q-result-icon">{result.isCorrect ? '✓' : '✗'}</span>
    <span className="q-time">{result.reactionTimeMs}ms</span>
  </div>
)

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose }) => {
  const [records, setRecords] = useState<GameRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Difficulty | 'all'>('all')

  const loadRecords = useCallback(async () => {
    setLoading(true)
    try {
      const all = await getAllRecords()
      setRecords(all)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadRecords()
    }
  }, [isOpen, loadRecords])

  const filtered = useMemo(() => {
    return filter === 'all' ? records : records.filter((r) => r.difficulty === filter)
  }, [records, filter])

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm('确定删除这条记录吗？')) return
      await deleteRecord(id)
      setExpandedId(null)
      loadRecords()
    },
    [loadRecords],
  )

  if (!isOpen) return null

  return (
    <>
      <div className="history-overlay" onClick={onClose} />
      <aside className="history-panel animate-panel-slide">
        <div className="history-panel-header">
          <h2>历史记录</h2>
          <button className="close-btn" type="button" onClick={onClose} aria-label="关闭">✕</button>
        </div>

        <div className="filter-row">
          {(['all', 'easy', 'medium', 'hard'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '全部' : DIFFICULTY_CONFIG[f as Difficulty].label}
            </button>
          ))}
        </div>

        <div className="history-list">
          {loading && <div className="empty-state">加载中...</div>}
          {!loading && filtered.length === 0 && (
            <div className="empty-state">
              <p>暂无训练记录</p>
              <p className="empty-tip">完成一轮训练后将自动保存到此</p>
            </div>
          )}
          {!loading && filtered.map((r) => (
            <HistoryListItem
              key={r.id}
              record={r}
              isExpanded={expandedId === r.id}
              onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
              onDelete={() => handleDelete(r.id)}
            />
          ))}
        </div>

        <style>{`
          .history-overlay {
            position: fixed;
            inset: 0;
            background: rgba(44, 62, 80, 0.35);
            z-index: 90;
            backdrop-filter: blur(2px);
          }
          .history-panel {
            position: fixed;
            top: 0;
            left: 0;
            width: 320px;
            max-width: 92vw;
            height: 100vh;
            background: var(--color-card);
            box-shadow: 8px 0 30px rgba(44, 62, 80, 0.12);
            z-index: 100;
            display: flex;
            flex-direction: column;
          }
          .history-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 20px 16px;
            border-bottom: 1px solid #ECF0F1;
          }
          .history-panel-header h2 {
            font-size: 18px;
            color: var(--color-primary);
            font-weight: 600;
          }
          .close-btn {
            border: none;
            background: transparent;
            font-size: 16px;
            color: var(--color-text-light);
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 6px;
            transition: background 150ms;
          }
          .close-btn:hover {
            background: #ECF0F1;
            color: var(--color-primary);
          }
          .filter-row {
            display: flex;
            gap: 8px;
            padding: 14px 20px;
            flex-wrap: wrap;
          }
          .filter-chip {
            padding: 6px 14px;
            border-radius: 20px;
            border: 1px solid #D5DBDB;
            background: #FFFFFF;
            color: var(--color-text-light);
            font-size: 13px;
            cursor: pointer;
            transition: all 150ms;
          }
          .filter-chip:hover {
            border-color: var(--color-accent);
            color: var(--color-accent);
          }
          .filter-chip.active {
            background: var(--color-accent);
            color: #FFFFFF;
            border-color: var(--color-accent);
          }
          .history-list {
            flex: 1;
            overflow-y: auto;
            padding: 4px 12px 24px;
          }
          .history-item {
            background: #FFFFFF;
            border: 1px solid #ECF0F1;
            border-radius: var(--radius-md);
            margin-bottom: 12px;
            overflow: hidden;
            transition: box-shadow 150ms, border-color 150ms;
          }
          .history-item:hover {
            border-color: #BDC3C7;
            box-shadow: var(--shadow-soft);
          }
          .history-item-header {
            width: 100%;
            padding: 14px;
            text-align: left;
            background: transparent;
            border: none;
            cursor: pointer;
          }
          .history-item-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .history-date {
            font-size: 13px;
            color: var(--color-text-light);
            font-family: var(--font-mono);
          }
          .history-difficulty-badge {
            color: #FFFFFF;
            font-size: 11px;
            padding: 3px 10px;
            border-radius: 12px;
            font-weight: 500;
          }
          .history-item-score-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
          }
          .history-score {
            font-size: 26px;
            font-weight: 700;
            color: var(--color-primary);
            font-family: var(--font-mono);
            min-width: 56px;
          }
          .history-thumbs {
            flex: 1;
            display: flex;
            gap: 3px;
          }
          .thumb {
            width: 18px;
            height: 18px;
            border-radius: 4px;
            box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
          }
          .history-accuracy {
            font-size: 13px;
            color: var(--color-accent);
            font-weight: 600;
            font-family: var(--font-mono);
          }
          .history-item-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            color: var(--color-text-light);
          }
          .expand-arrow {
            transition: transform 200ms;
            font-size: 12px;
          }
          .expand-arrow.expanded {
            transform: rotate(180deg);
          }
          .history-item-detail {
            padding: 0 14px 14px;
            border-top: 1px dashed #ECF0F1;
            overflow: hidden;
          }
          .detail-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            font-size: 13px;
            font-weight: 600;
            color: var(--color-primary);
          }
          .delete-btn {
            padding: 4px 10px;
            border: 1px solid #F5B7B1;
            background: #FDEDEC;
            color: #C0392B;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all 150ms;
          }
          .delete-btn:hover {
            background: #F5B7B1;
            color: #FFFFFF;
          }
          .detail-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .q-row {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 8px;
            border-radius: 8px;
            font-size: 12px;
          }
          .q-correct { background: #EAFAF1; }
          .q-wrong   { background: #FDEDEC; }
          .q-index {
            width: 24px;
            color: var(--color-text-light);
            font-family: var(--font-mono);
          }
          .q-swatch {
            width: 26px;
            height: 26px;
            border-radius: 6px;
            box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08);
          }
          .q-arrow {
            color: #BDC3C7;
            width: 14px;
            text-align: center;
          }
          .q-result-icon {
            width: 18px;
            text-align: center;
            font-weight: 700;
          }
          .q-correct .q-result-icon { color: var(--color-accent); }
          .q-wrong   .q-result-icon { color: var(--color-error); }
          .q-time {
            margin-left: auto;
            color: var(--color-text-light);
            font-family: var(--font-mono);
          }
          .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--color-text-light);
            font-size: 14px;
          }
          .empty-tip {
            margin-top: 6px;
            font-size: 12px;
            opacity: 0.7;
          }
          @media (max-width: 1023px) {
            .history-panel { width: 100%; max-width: 360px; }
          }
        `}</style>
      </aside>
    </>
  )
}

export default HistoryPanel
