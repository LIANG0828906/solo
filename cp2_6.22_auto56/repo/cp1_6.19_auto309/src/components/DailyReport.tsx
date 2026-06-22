import { useMemo, useCallback, useState } from 'react'
import { useTimerStore } from '../store/timerStore'
import { format, subDays, parseISO, isAfter, isBefore, addDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import '../styles.css'

interface DayData {
  date: string
  dateKey: string
  focusMinutes: number
  sessions: number
  interrupts: number
}

interface TooltipState {
  visible: boolean
  x: number
  y: number
  text: string
}

const formatDuration = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  if (hours > 0 && mins > 0) return `${hours}小时${mins}分钟`
  if (hours > 0) return `${hours}小时`
  return `${mins}分钟`
}

const formatShortDate = (dateKey: string): string => {
  const d = parseISO(dateKey)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export const DailyReport = () => {
  const dailyFocusMinutes = useTimerStore((state) => state.dailyFocusMinutes)
  const dailySessions = useTimerStore((state) => state.dailySessions)
  const dailyInterrupts = useTimerStore((state) => state.dailyInterrupts)

  const today = useMemo(() => new Date(), [])
  const todayKey = useMemo(() => format(today, 'yyyy-MM-dd'), [today])
  const minDate = useMemo(() => subDays(today, 6), [today])
  const minDateStr = useMemo(() => format(minDate, 'yyyy-MM-dd'), [minDate])

  const [selectedDate, setSelectedDate] = useState<string>(todayKey)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    text: '',
  })

  const last7Days = useMemo<DayData[]>(() => {
    const days: DayData[] = []
    for (let i = 6; i >= 0; i--) {
      const d = subDays(today, i)
      const key = format(d, 'yyyy-MM-dd')
      days.push({
        date: format(d, 'yyyy年MM月dd日'),
        dateKey: key,
        focusMinutes: dailyFocusMinutes[key] || 0,
        sessions: dailySessions[key] || 0,
        interrupts: dailyInterrupts[key] || 0,
      })
    }
    return days
  }, [today, dailyFocusMinutes, dailySessions, dailyInterrupts])

  const selectedDayData = useMemo(() => {
    return (
      last7Days.find((d) => d.dateKey === selectedDate) || {
        date: format(parseISO(selectedDate), 'yyyy年MM月dd日'),
        dateKey: selectedDate,
        focusMinutes: 0,
        sessions: 0,
        interrupts: 0,
      }
    )
  }, [last7Days, selectedDate])

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (!val) return
      const selected = parseISO(val)
      if (
        (isAfter(selected, minDate) || selected.getTime() === minDate.getTime()) &&
        (isBefore(selected, addDays(today, 1)) ||
          selected.getTime() === today.getTime())
      ) {
        setSelectedDate(val)
      }
    },
    [minDate, today]
  )

  const maxMinutes = useMemo(() => {
    const max = Math.max(...last7Days.map((d) => d.focusMinutes), 60)
    return Math.ceil(max / 30) * 30
  }, [last7Days])

  const handleBarHover = useCallback(
    (e: React.MouseEvent<SVGRectElement>, data: DayData) => {
      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()
      setTooltip({
        visible: true,
        x: e.clientX - rect.left + 10,
        y: e.clientY - rect.top - 30,
        text: `${formatShortDate(data.dateKey)}：${data.focusMinutes}分钟`,
      })
    },
    []
  )

  const handleBarLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }, [])

  const chartWidth = 600
  const chartHeight = 180
  const paddingTop = 10
  const paddingBottom = 30
  const paddingLeft = 10
  const paddingRight = 10
  const chartInnerWidth = chartWidth - paddingLeft - paddingRight
  const chartInnerHeight = chartHeight - paddingTop - paddingBottom
  const barCount = last7Days.length
  const barGap = 16
  const barWidth = (chartInnerWidth - barGap * (barCount - 1)) / barCount

  return (
    <div className="panel report-panel">
      <h2 className="panel-title">📊 每日报告</h2>

      <div className="date-picker">
        <label style={{ display: 'block', fontSize: 12, color: '#9090a8', marginBottom: 6 }}>
          选择日期（近7天）
        </label>
        <input
          type="date"
          value={selectedDate}
          min={minDateStr}
          max={todayKey}
          onChange={handleDateChange}
        />
      </div>

      <div className="report-stats">
        <div className="stat-card">
          <div className="stat-value" title={formatDuration(selectedDayData.focusMinutes)}>
            {formatDuration(selectedDayData.focusMinutes)}
          </div>
          <div className="stat-label">专注时长</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{selectedDayData.sessions} 次</div>
          <div className="stat-label">完成计时</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: selectedDayData.interrupts > 0 ? '#E74C3C' : '#FFFFFF' }}>
            {selectedDayData.interrupts} 次
          </div>
          <div className="stat-label">干扰次数</div>
        </div>
      </div>

      <div className="chart-container" style={{ position: 'relative' }}>
        <div className="chart-title">
          近7天专注时长趋势（{format(today, 'MM月dd日', { locale: zhCN })} 回溯）
        </div>
        <svg
          className="chart-svg"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2ECC71" />
              <stop offset="100%" stopColor="#27AE60" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + chartInnerHeight * (1 - ratio)
            const value = Math.round(maxMinutes * ratio)
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#E0E0E0"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x={paddingLeft}
                  y={y + 4}
                  fontSize="10"
                  fill="#999999"
                  dominantBaseline="middle"
                >
                  {value}
                </text>
              </g>
            )
          })}

          {last7Days.map((data, i) => {
            const x = paddingLeft + i * (barWidth + barGap)
            const barHeight =
              maxMinutes > 0 ? (data.focusMinutes / maxMinutes) * chartInnerHeight : 0
            const y = paddingTop + chartInnerHeight - barHeight

            return (
              <g key={data.dateKey}>
                <rect
                  className="chart-bar"
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  ry={4}
                  fill="url(#barGradient)"
                  onMouseMove={(e) => handleBarHover(e, data)}
                  onMouseLeave={handleBarLeave}
                />
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 8}
                  fontSize="11"
                  fill="#666666"
                  textAnchor="middle"
                >
                  {formatShortDate(data.dateKey).replace('月', '/').replace('日', '')}
                </text>
              </g>
            )
          })}
        </svg>

        {tooltip.visible && (
          <div
            className="chart-tooltip"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              display: tooltip.visible ? 'block' : 'none',
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#E0E0E0',
            marginBottom: 12,
          }}
        >
          详细记录
        </div>
        <table className="report-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>专注时长</th>
              <th>次数</th>
              <th>干扰</th>
            </tr>
          </thead>
          <tbody>
            {[...last7Days].reverse().map((data) => (
              <tr
                key={data.dateKey}
                style={{
                  backgroundColor: data.dateKey === selectedDate ? 'rgba(108, 99, 255, 0.15)' : undefined,
                }}
              >
                <td>{formatShortDate(data.dateKey)}</td>
                <td style={{ color: data.focusMinutes > 0 ? '#2ECC71' : '#E0E0E0' }}>
                  {formatDuration(data.focusMinutes)}
                </td>
                <td>{data.sessions}</td>
                <td style={{ color: data.interrupts > 0 ? '#E74C3C' : '#E0E0E0' }}>
                  {data.interrupts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
