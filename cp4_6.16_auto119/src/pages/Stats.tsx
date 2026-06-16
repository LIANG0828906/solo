import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMoodStore, getRecentRecords } from '../store'
import { MOOD_MAP } from '../types'
import type { MoodRecord } from '../types'
import './Stats.css'

function Stats() {
  const { records } = useMoodStore()
  const navigate = useNavigate()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const timelineRef = useRef<HTMLDivElement>(null)

  const recentRecords = useMemo(() => {
    return getRecentRecords(records, 30)
  }, [records])

  const dateRecords = useMemo(() => {
    const result: (MoodRecord | null)[] = []
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 29)

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const record = records.find(r => r.date === dateStr)
      result.push(record || null)
    }
    return result
  }, [records])

  const moodStats = useMemo(() => {
    const stats: Record<string, number> = {}
    recentRecords.forEach(record => {
      stats[record.moodType] = (stats[record.moodType] || 0) + 1
    })
    return Object.entries(stats).sort((a, b) => b[1] - a[1])
  }, [recentRecords])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect()
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
      setHoveredIndex(index)
    }
  }

  const handleNodeClick = (record: MoodRecord | null) => {
    if (record) {
      navigate(`/detail/${record.date}`)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <div className="stats-page">
      <section className="stats-section">
        <h2 className="section-title">情绪时间线</h2>
        <p className="section-subtitle">近30天的情绪变化轨迹</p>

        <div 
          className="timeline-container"
          ref={timelineRef}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <div className="timeline-bg" />
          
          <svg className="timeline-svg" viewBox="0 0 800 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {moodStats.map(([moodType], index) => {
                  const config = MOOD_MAP[moodType as keyof typeof MOOD_MAP]
                  return (
                    <stop 
                      key={moodType} 
                      offset={`${(index / Math.max(moodStats.length - 1, 1)) * 100}%`} 
                      stopColor={config?.color || '#ccc'} 
                    />
                  )
                })}
              </linearGradient>
            </defs>
            
            <path
              d="M 20 100 Q 200 60, 400 100 T 780 100"
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              className="timeline-path"
            />
          </svg>

          <div className="timeline-nodes">
            {dateRecords.map((record, index) => {
              const config = record ? MOOD_MAP[record.moodType] : null
              const size = record 
                ? Math.max(12, Math.min(28, 12 + record.text.length / 20))
                : 8
              
              const left = `${(index / Math.max(dateRecords.length - 1, 1)) * 100}%`
              const isHovered = hoveredIndex === index
              
              return (
                <div
                  key={index}
                  className={`timeline-node ${record ? 'has-record' : ''} ${isHovered ? 'hovered' : ''}`}
                  style={{
                    left,
                    '--node-color': config?.color || '#ddd',
                    '--node-size': `${size}px`,
                  } as React.CSSProperties}
                  onMouseMove={(e) => handleMouseMove(e, index)}
                  onClick={() => handleNodeClick(record)}
                >
                  {record && isHovered && (
                    <div 
                      className="node-glow"
                      style={{
                        '--glow-color': config?.color || '#ccc',
                      } as React.CSSProperties}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {hoveredIndex !== null && dateRecords[hoveredIndex] && (
            <div 
              className="timeline-tooltip"
              style={{
                left: mousePos.x,
                top: mousePos.y - 10,
              }}
            >
              <div className="tooltip-emoji">
                {MOOD_MAP[dateRecords[hoveredIndex]!.moodType]?.emoji}
              </div>
              <div className="tooltip-date">
                {formatDate(dateRecords[hoveredIndex]!.date)}
              </div>
              <div className="tooltip-text">
                {dateRecords[hoveredIndex]!.text || '（无文字）'}
              </div>
            </div>
          )}
        </div>

        <div className="timeline-labels">
          <span>{formatDate(dateRecords[0]?.date || new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}</span>
          <span>{formatDate(dateRecords[dateRecords.length - 1]?.date || new Date().toISOString().split('T')[0])}</span>
        </div>
      </section>

      <section className="stats-section">
        <h2 className="section-title">情绪分布</h2>
        <p className="section-subtitle">近30天各类情绪占比</p>

        <div className="mood-distribution">
          {moodStats.map(([moodType, count]) => {
            const config = MOOD_MAP[moodType as keyof typeof MOOD_MAP]
            const total = recentRecords.length
            const percentage = total > 0 ? (count / total) * 100 : 0
            
            return (
              <div key={moodType} className="distribution-item">
                <div className="distribution-header">
                  <span className="distribution-emoji">{config?.emoji}</span>
                  <span className="distribution-label">{config?.label}</span>
                  <span className="distribution-count">{count}天</span>
                </div>
                <div className="distribution-bar">
                  <div 
                    className="distribution-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: config?.color,
                    }}
                  />
                </div>
              </div>
            )
          })}
          
          {moodStats.length === 0 && (
            <div className="empty-state">
              <p>暂无记录</p>
              <p className="empty-sub">开始记录你的心情吧</p>
            </div>
          )}
        </div>
      </section>

      <section className="stats-section">
        <h2 className="section-title">统计摘要</h2>
        <p className="section-subtitle">近30天数据概览</p>

        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-value">{recentRecords.length}</div>
            <div className="stat-label">记录天数</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{moodStats.length}</div>
            <div className="stat-label">情绪类型</div>
          </div>
          <div className="stat-card highlight">
            <div className="stat-value">
              {moodStats.length > 0 
                ? MOOD_MAP[moodStats[0][0] as keyof typeof MOOD_MAP]?.emoji 
                : '—'}
            </div>
            <div className="stat-label">主导情绪</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {recentRecords.reduce((sum, r) => sum + r.text.length, 0)}
            </div>
            <div className="stat-label">总字数</div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Stats
