import { useEffect, useState, useRef } from 'react'
import { useOKRStore, Milestone } from '../store/okrStore'
import dayjs from 'dayjs'

const MONTHS = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)

export default function MilestoneGantt() {
  const { milestones, fetchMilestones, updateMilestone } = useOKRStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editProgress, setEditProgress] = useState<number>(0)
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMilestones()
  }, [fetchMilestones])

  const handleBarClick = (e: React.MouseEvent, milestone: Milestone) => {
    e.stopPropagation()
    setEditingId(milestone.id)
    setEditProgress(milestone.progress)
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (containerRect) {
      setPopupPos({
        top: rect.bottom - containerRect.top + containerRef.current!.scrollTop + 8,
        left: rect.left - containerRect.left,
      })
    }
  }

  const handleProgressSave = async () => {
    if (editingId) {
      const clamped = Math.max(0, Math.min(100, editProgress))
      await updateMilestone(editingId, clamped)
      setEditingId(null)
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#1e293b' }}>里程碑甘特图</h2>
      <div className="gantt-container" ref={containerRef} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <div className="gantt-header">
          <div style={{ width: 180, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#64748b', flexShrink: 0 }}>里程碑</div>
          {MONTHS.map((m) => (
            <div key={m} className="gantt-header-cell">{m}</div>
          ))}
        </div>
        {milestones.map((ms) => {
          const leftPercent = ((ms.startMonth - 1) / 12) * 100
          const widthPercent = ((ms.endMonth - ms.startMonth + 1) / 12) * 100
          return (
            <div key={ms.id} className="gantt-row">
              <div className="gantt-row-label">
                <span className="gantt-label-tag">{ms.name}</span>
              </div>
              <div className="gantt-row-timeline">
                <div
                  className="gantt-bar"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    background: `linear-gradient(90deg, #a78bfa, #6366f1)`,
                    opacity: 0.25,
                  }}
                />
                <div
                  className="gantt-bar"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent * (ms.progress / 100)}%`,
                    background: `linear-gradient(90deg, #a78bfa, #6366f1)`,
                  }}
                  onClick={(e) => handleBarClick(e, ms)}
                />
                <span className="gantt-bar-percent" style={{ left: `${leftPercent + widthPercent + 1}%` }}>
                  {Math.round(ms.progress)}%
                </span>
              </div>
            </div>
          )
        })}
        {editingId && (
          <div
            className="gantt-popup"
            style={{ top: popupPos.top, left: popupPos.left }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>完成百分比</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="form-input"
                type="number"
                min={0}
                max={100}
                value={editProgress}
                onChange={(e) => setEditProgress(parseFloat(e.target.value) || 0)}
                style={{ width: 80 }}
              />
              <span style={{ fontSize: 13, color: '#64748b' }}>%</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="save-btn" style={{ flex: 1, marginTop: 0, padding: '8px 12px', fontSize: 13 }} onClick={handleProgressSave}>确认</button>
              <button
                style={{ flex: 1, padding: '8px 12px', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', cursor: 'pointer', color: '#64748b' }}
                onClick={() => setEditingId(null)}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
