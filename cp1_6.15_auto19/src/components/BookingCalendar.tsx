import { useState, useMemo, useEffect } from 'react'

interface BookingCalendarProps {
  bookedDates: string[]
  selectedDate: string | null
  onDateSelect: (date: string) => void
  loading?: boolean
  maxDaysAhead?: number
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MONTHS = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
]

export default function BookingCalendar({
  bookedDates,
  selectedDate,
  onDateSelect,
  loading = false,
  maxDaysAhead = 90
}: BookingCalendarProps) {
  const today = useMemo(() => {
    const t = new Date('2026-06-15')
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(today)
    d.setDate(1)
    return d
  })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const maxDate = useMemo(() => {
    const d = new Date(today)
    d.setDate(d.getDate() + maxDaysAhead)
    return d
  }, [today, maxDaysAhead])

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const days: Array<{
      date: Date | null
      dateStr: string
      isCurrentMonth: boolean
      isPast: boolean
      isToday: boolean
      isBooked: boolean
      isSelected: boolean
      isHovered: boolean
      isMaxDate: boolean
    }> = []

    for (let i = 0; i < startPadding; i++) {
      days.push({
        date: null,
        dateStr: '',
        isCurrentMonth: false,
        isPast: true,
        isToday: false,
        isBooked: false,
        isSelected: false,
        isHovered: false,
        isMaxDate: false
      })
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const timeDiff = date.getTime() - today.getTime()
      const isPast = timeDiff < 0
      const isToday = timeDiff === 0
      const isBooked = bookedDates.includes(dateStr)
      const isSelected = selectedDate === dateStr
      const isHovered = hoveredDate === dateStr
      const isMaxDate = date > maxDate

      days.push({
        date,
        dateStr,
        isCurrentMonth: true,
        isPast,
        isToday,
        isBooked,
        isSelected,
        isHovered,
        isMaxDate
      })
    }

    return days
  }, [viewDate, today, bookedDates, selectedDate, hoveredDate, maxDate])

  const goToPrevMonth = () => {
    if (isTransitioning) return
    const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
    const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    if (firstOfMonth <= firstOfLastMonth) return

    setIsTransitioning(true)
    const start = performance.now()
    setViewDate(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() - 1)
      return d
    })
    const elapsed = performance.now() - start
    console.log(`日历切换耗时: ${elapsed.toFixed(0)}ms`)
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const goToNextMonth = () => {
    if (isTransitioning) return
    const lastOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
    if (lastOfMonth >= maxDate) return

    setIsTransitioning(true)
    const start = performance.now()
    setViewDate(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + 1)
      return d
    })
    const elapsed = performance.now() - start
    console.log(`日历切换耗时: ${elapsed.toFixed(0)}ms`)
    setTimeout(() => setIsTransitioning(false), 300)
  }

  const getNextAvailableDates = (count = 3): string[] => {
    const suggestions: string[] = []
    const current = new Date(today)

    while (suggestions.length < count) {
      current.setDate(current.getDate() + 1)
      const dateStr = current.toISOString().split('T')[0]
      if (!bookedDates.includes(dateStr) && current <= maxDate) {
        suggestions.push(dateStr)
      }
      if (current > maxDate) break
    }

    return suggestions
  }

  const checkDateConflict = (date: string): { hasConflict: boolean; suggestedDates: string[] } => {
    const hasConflict = bookedDates.includes(date)
    const suggestedDates = hasConflict ? getNextAvailableDates(3) : []
    return { hasConflict, suggestedDates }
  }

  useEffect(() => {
    if (selectedDate) {
      const { hasConflict, suggestedDates } = checkDateConflict(selectedDate)
      if (hasConflict && suggestedDates.length > 0) {
        console.log('日期冲突，推荐日期:', suggestedDates)
      }
    }
  }, [selectedDate, bookedDates])

  const handleDateClick = (dateStr: string, isBooked: boolean) => {
    if (isBooked) {
      const { suggestedDates } = checkDateConflict(dateStr)
      console.log('该日期已被预约，推荐空闲日期:', suggestedDates)
      return
    }
    onDateSelect(dateStr)
  }

  if (loading) {
    return (
      <div className="calendar" style={{ opacity: 0.6, pointerEvents: 'none' }}>
        <div className="calendar-header">
          <div className="skeleton" style={{ width: '120px', height: '24px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ width: '100px', height: '36px', borderRadius: '10px' }} />
        </div>
        <div className="calendar-grid">
          {Array.from({ length: 35 }).map((_, idx) => (
            <div
              key={idx}
              className="skeleton"
              style={{
                aspectRatio: '1',
                borderRadius: '10px'
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="calendar" style={{
      opacity: isTransitioning ? 0.6 : 1,
      transition: 'opacity 0.3s ease'
    }}>
      <div className="calendar-header">
        <h3 className="calendar-title">
          {viewDate.getFullYear()}年 {MONTHS[viewDate.getMonth()]}
        </h3>
        <div className="calendar-nav">
          <button
            className="calendar-nav-btn"
            onClick={goToPrevMonth}
            aria-label="上个月"
            disabled={isTransitioning}
            style={{ opacity: viewDate <= new Date(today.getFullYear(), today.getMonth(), 1) ? 0.4 : 1 }}
          >
            ‹
          </button>
          <button
            className="calendar-nav-btn"
            onClick={() => {
              const d = new Date(today)
              d.setDate(1)
              setViewDate(d)
            }}
            style={{ fontSize: '12px', padding: '0 12px' }}
          >
            今天
          </button>
          <button
            className="calendar-nav-btn"
            onClick={goToNextMonth}
            aria-label="下个月"
            disabled={isTransitioning}
            style={{ opacity: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0) >= maxDate ? 0.4 : 1 }}
          >
            ›
          </button>
        </div>
      </div>

      <div className="calendar-grid" style={{
        transform: isTransitioning ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s ease'
      }}>
        {WEEKDAYS.map(day => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}
        {calendarDays.map((day, idx) => (
          <button
            key={idx}
            className={`calendar-day ${[
              day.isToday ? 'today' : '',
              day.isSelected ? 'selected' : '',
              day.isBooked ? 'booked' : '',
              day.isHovered ? 'hovered' : '',
              (!day.isPast && day.isCurrentMonth && !day.isBooked && !day.isMaxDate) ? 'available' : ''
            ].filter(Boolean).join(' ')}`}
            disabled={!day.isCurrentMonth || day.isPast || day.isBooked || day.isMaxDate}
            onClick={() => day.isCurrentMonth && !day.isPast && !day.isBooked && !day.isMaxDate && handleDateClick(day.dateStr, day.isBooked)}
            onMouseEnter={() => day.isCurrentMonth && setHoveredDate(day.dateStr)}
            onMouseLeave={() => setHoveredDate(null)}
            title={day.isBooked ? '该日期已被预约' : day.isMaxDate ? '超出可预约范围' : ''}
          >
            {day.date ? day.date.getDate() : ''}
          </button>
        ))}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-box available" />
          <span>可预约</span>
        </div>
        <div className="legend-item">
          <div className="legend-box booked" />
          <span>已约满</span>
        </div>
        <div className="legend-item">
          <div className="legend-box selected" />
          <span>已选择</span>
        </div>
      </div>
    </div>
  )
}
