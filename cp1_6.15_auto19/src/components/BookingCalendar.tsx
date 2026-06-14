import { useState, useMemo } from 'react'

interface BookingCalendarProps {
  bookedDates: string[]
  selectedDate: string | null
  onDateSelect: (date: string) => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MONTHS = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
]

export default function BookingCalendar({
  bookedDates,
  selectedDate,
  onDateSelect
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
    }> = []

    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null, dateStr: '', isCurrentMonth: false, isPast: true, isToday: false, isBooked: false, isSelected: false })
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d)
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const timeDiff = date.getTime() - today.getTime()
      const isPast = timeDiff < 0
      const isToday = timeDiff === 0
      const isBooked = bookedDates.includes(dateStr)
      const isSelected = selectedDate === dateStr

      days.push({
        date,
        dateStr,
        isCurrentMonth: true,
        isPast,
        isToday,
        isBooked,
        isSelected
      })
    }

    return days
  }, [viewDate, today, bookedDates, selectedDate])

  const goToPrevMonth = () => {
    const start = performance.now()
    setViewDate(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() - 1)
      return d
    })
    const elapsed = performance.now() - start
    console.log(`日历切换耗时: ${elapsed.toFixed(0)}ms`)
  }

  const goToNextMonth = () => {
    const start = performance.now()
    setViewDate(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + 1)
      return d
    })
    const elapsed = performance.now() - start
    console.log(`日历切换耗时: ${elapsed.toFixed(0)}ms`)
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        <h3 className="calendar-title">
          {viewDate.getFullYear()}年 {MONTHS[viewDate.getMonth()]}
        </h3>
        <div className="calendar-nav">
          <button
            className="calendar-nav-btn"
            onClick={goToPrevMonth}
            aria-label="上个月"
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
          >
            ›
          </button>
        </div>
      </div>

      <div className="calendar-grid">
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
              !day.isPast && day.isCurrentMonth && !day.isBooked ? 'available' : ''
            ].filter(Boolean).join(' ')}`}
            disabled={!day.isCurrentMonth || day.isPast || day.isBooked}
            onClick={() => day.isCurrentMonth && !day.isPast && !day.isBooked && onDateSelect(day.dateStr)}
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
