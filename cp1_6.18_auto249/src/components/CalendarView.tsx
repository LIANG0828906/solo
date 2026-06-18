import { useState, useMemo, useCallback } from 'react'
import { useColorStore, formatDate } from '../store/colorStore'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MONTH_NAMES = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
]

const hexToRgb = (hex: string): [number, number, number] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null
}

const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('').toUpperCase()
}

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h * 360, s * 100, l * 100]
}

const hslToRgb2 = (h: number, s: number, l: number): [number, number, number] => {
  h /= 360; s /= 100; l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 1/6) { r = c; g = x }
  else if (h < 2/6) { r = x; g = c }
  else if (h < 3/6) { g = c; b = x }
  else if (h < 4/6) { g = x; b = c }
  else if (h < 5/6) { r = x; b = c }
  else { r = c; b = x }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

const adjustColorByTextLength = (hex: string, textLength: number): string => {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const [r, g, b] = rgb
  const [h, s, l] = rgbToHsl(r, g, b)

  const textFactor = Math.min(textLength / 200, 1)
  const lightnessBoost = textFactor * 15

  const newL = Math.min(l + lightnessBoost, 85)
  const newS = Math.max(s - textFactor * 5, 20)

  const [nr, ng, nb] = hslToRgb2(h, newS, newL)
  return rgbToHex(nr, ng, nb)
}

interface HeatmapMonthData {
  month: number
  year: number
  label: string
  avgColor: string | null
  count: number
}

export default function CalendarView() {
  const { records, getRecordByDate, setSelectedDate, openModal } = useColorStore()

  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const [, setAnimKey] = useState(0)

  const todayStr = useMemo(() => formatDate(new Date()), [])

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const firstDayWeekday = firstDay.getDay()

    const days: (number | null)[] = []
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }, [currentYear, currentMonth])

  const handlePrevMonth = useCallback(() => {
    setSlideDirection('right')
    setAnimKey(k => k + 1)
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() - 1)
      return d
    })
    setTimeout(() => setSlideDirection(null), 300)
  }, [])

  const handleNextMonth = useCallback(() => {
    setSlideDirection('left')
    setAnimKey(k => k + 1)
    setCurrentDate(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + 1)
      return d
    })
    setTimeout(() => setSlideDirection(null), 300)
  }, [])

  const handleDayClick = useCallback((day: number) => {
    const dateStr = formatDate(new Date(currentYear, currentMonth, day))
    setSelectedDate(dateStr)
    openModal()
  }, [currentYear, currentMonth, setSelectedDate, openModal])

  const getDayCellStyle = useCallback((day: number): React.CSSProperties => {
    const dateStr = formatDate(new Date(currentYear, currentMonth, day))
    const record = getRecordByDate(dateStr)
    if (!record) return {}
    const adjustedColor = adjustColorByTextLength(record.color, record.text.length)
    return { backgroundColor: adjustedColor }
  }, [currentYear, currentMonth, getRecordByDate])

  const heatmapData = useMemo((): HeatmapMonthData[] => {
    const months: HeatmapMonthData[] = []
    const now = new Date()
    const startYear = now.getFullYear()

    for (let i = 0; i < 12; i++) {
      const monthRecords = records.filter(r => {
        const [ry, rm] = r.date.split('-').map(Number)
        return ry === startYear && rm === i + 1
      })

      let avgColor: string | null = null
      if (monthRecords.length > 0) {
        let totalR = 0, totalG = 0, totalB = 0
        let validCount = 0
        for (const rec of monthRecords) {
          const rgb = hexToRgb(rec.color)
          if (rgb) {
            totalR += rgb[0]
            totalG += rgb[1]
            totalB += rgb[2]
            validCount++
          }
        }
        if (validCount > 0) {
          avgColor = rgbToHex(
            Math.round(totalR / validCount),
            Math.round(totalG / validCount),
            Math.round(totalB / validCount)
          )
        }
      }

      months.push({
        month: i,
        year: startYear,
        label: MONTH_NAMES[i],
        avgColor,
        count: monthRecords.length,
      })
    }
    return months
  }, [records])

  return (
    <>
      <div className="heatmap-section">
        <h2 className="heatmap-title">
          <span>📊</span>
          <span>{currentYear}年 情绪色彩热力图</span>
        </h2>
        <div className="heatmap-container">
          {heatmapData.map((m, idx) => (
            <div
              key={`${m.year}-${m.month}`}
              className={`heatmap-month ${!m.avgColor ? 'heatmap-empty' : ''}`}
              style={{
                backgroundColor: m.avgColor || undefined,
                order: idx,
              }}
              onClick={() => {
                if (m.count > 0) {
                  setCurrentDate(new Date(m.year, m.month, 1))
                  setSlideDirection(null)
                  setAnimKey(k => k + 1)
                }
              }}
            >
              <div className="heatmap-tooltip">
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{m.label}</div>
                <div style={{ opacity: 0.9 }}>
                  {m.count > 0
                    ? `${m.avgColor} · ${m.count}条记录`
                    : '暂无记录'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="calendar-section">
        <div className="calendar-header">
          <button
            className="nav-btn"
            onClick={handlePrevMonth}
            aria-label="上个月"
          >
            ‹
          </button>
          <h1 className="calendar-title">
            {currentYear}年 {MONTH_NAMES[currentMonth]}
          </h1>
          <button
            className="nav-btn"
            onClick={handleNextMonth}
            aria-label="下个月"
          >
            ›
          </button>
        </div>

        <div className="weekday-header">
          {WEEKDAYS.map(day => (
            <div key={day} className="weekday-cell">{day}</div>
          ))}
        </div>

        <div className="calendar-grid-wrapper">
          <div
            className={`calendar-grid ${
              slideDirection === 'left' ? 'slide-left' :
              slideDirection === 'right' ? 'slide-right' : ''
            }`}
            key={`${currentYear}-${currentMonth}-anim`}
          >
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="day-cell empty" />
              }

              const dateStr = formatDate(new Date(currentYear, currentMonth, day))
              const record = getRecordByDate(dateStr)
              const isToday = dateStr === todayStr
              const hasRecord = !!record

              return (
                <div
                  key={dateStr}
                  className={`day-cell ${hasRecord ? 'has-record' : ''} ${isToday ? 'is-today' : ''}`}
                  style={getDayCellStyle(day)}
                  onClick={() => handleDayClick(day)}
                  title={`${dateStr}${record ? ` · ${record.color}` : ''}`}
                >
                  <span className="day-number">{day}</span>
                  {hasRecord && <span className="day-indicator" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
