import React, { useState, useEffect, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DiaryEntry, calculateMoodScore } from '../data/moodData'

interface WeekTrendProps {
  entries: DiaryEntry[]
}

function formatDateMMDD(dateStr: string): string {
  const date = new Date(dateStr)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${m}-${d}`
}

function getLastNDates(n: number): string[] {
  const dates: string[] = []
  const today = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${day}`)
  }
  return dates
}

const WeekTrend: React.FC<WeekTrendProps> = ({ entries }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const chartData = useMemo(() => {
    const last7Dates = getLastNDates(7)
    const entryMap = new Map(entries.map((e) => [e.date, e]))
    return last7Dates.map((date) => {
      const entry = entryMap.get(date)
      return {
        date: formatDateMMDD(date),
        score: entry ? calculateMoodScore(entry) : 0,
      }
    })
  }, [entries])

  const totalScore = chartData.reduce((sum, d) => sum + d.score, 0)
  const nonZeroDays = chartData.filter((d) => d.score > 0).length
  const avgScore = nonZeroDays > 0 ? (totalScore / nonZeroDays).toFixed(1) : '0.0'

  const gradientId = 'moodGradient'

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={styles.floatButton}
      >
        <span style={styles.floatButtonText}>周趋势</span>
      </button>

      <div
        style={{
          ...styles.overlay,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
        onClick={() => setIsOpen(false)}
      />

      <div
        style={{
          ...styles.drawer,
          ...(isMobile
            ? {
                width: '100%',
                height: '50vh',
                bottom: 0,
                left: 0,
                right: 0,
                top: 'auto',
                borderRadius: '20px 20px 0 0',
                transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
                borderLeft: 'none',
                borderTop: '1px solid #e0c9b0',
              }
            : {
                right: 0,
                top: 0,
                bottom: 0,
                width: '320px',
                transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                borderLeft: '1px solid #e0c9b0',
              }),
          transition: 'transform 0.35s ease-out',
        }}
      >
        <div style={styles.drawerHeader}>
          <h2 style={styles.drawerTitle}>本周情绪趋势</h2>
          <button onClick={() => setIsOpen(false)} style={styles.closeButton}>
            ✕
          </button>
        </div>

        <div style={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c97b5d" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#c97b5d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0c9b0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#7a6653', fontFamily: 'Georgia, serif' }}
                axisLine={{ stroke: '#d4a574' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 30]}
                tick={{ fontSize: 12, fill: '#7a6653', fontFamily: 'Georgia, serif' }}
                axisLine={{ stroke: '#d4a574' }}
                tickLine={false}
                tickCount={4}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid #e0c9b0',
                  borderRadius: '8px',
                  fontFamily: 'Georgia, serif',
                  color: '#4a3326',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
                formatter={(value: number) => [`${value} 分`, '情绪值']}
                labelStyle={{ color: '#4a3326', fontWeight: 'bold' }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#c97b5d"
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={{
                  fill: '#c97b5d',
                  stroke: '#fff',
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  fill: '#c97b5d',
                  stroke: '#fff',
                  strokeWidth: 3,
                  r: 6,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.statsContainer}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{totalScore}</span>
            <span style={styles.statLabel}>本周总分</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statItem}>
            <span style={styles.statValue}>{avgScore}</span>
            <span style={styles.statLabel}>平均分</span>
          </div>
        </div>
      </div>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  floatButton: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: '#c97b5d',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
    boxShadow: '0 4px 16px rgba(201, 123, 93, 0.4)',
    zIndex: 100,
    transition: 'all 0.25s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatButtonText: {
    fontSize: '12px',
    lineHeight: 1,
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(74, 51, 38, 0.2)',
    zIndex: 200,
  },
  drawer: {
    position: 'fixed',
    background: 'rgba(255,248,240,0.9)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    zIndex: 300,
    padding: '24px',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
    overflowY: 'auto',
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  drawerTitle: {
    fontSize: '20px',
    color: '#4a3326',
    fontWeight: 'bold',
  },
  closeButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(201, 123, 93, 0.1)',
    color: '#c97b5d',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.25s ease',
  },
  chartContainer: {
    width: '100%',
    marginBottom: '24px',
  },
  statsContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '40px',
    padding: '20px',
    background: 'rgba(255,255,255,0.6)',
    borderRadius: '12px',
    border: '1px solid #e0c9b0',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#c97b5d',
  },
  statLabel: {
    fontSize: '13px',
    color: '#7a6653',
  },
  statDivider: {
    width: '1px',
    height: '40px',
    background: '#e0c9b0',
  },
}

export default WeekTrend
