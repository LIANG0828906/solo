import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOOD_MAP } from '../types'
import type { MoodRecord } from '../types'
import './MosaicCalendar.css'

interface MosaicCalendarProps {
  records: MoodRecord[]
  year: number
  month: number
  onMonthChange: (year: number, month: number) => void
}

function MosaicCalendar({ records, year, month, onMonthChange }: MosaicCalendarProps) {
  const navigate = useNavigate()
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate()
  }, [year, month])

  const firstDayOfMonth = useMemo(() => {
    return new Date(year, month, 1).getDay()
  }, [year, month])

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = []
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }, [daysInMonth, firstDayOfMonth])

  const getRecordForDay = (day: number): MoodRecord | undefined => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return records.find(r => r.date === dateStr)
  }

  const handlePrevMonth = () => {
    if (isAnimating) return
    setAnimationDirection('left')
    setIsAnimating(true)
    setTimeout(() => {
      if (month === 0) {
        onMonthChange(year - 1, 11)
      } else {
        onMonthChange(year, month - 1)
      }
      setAnimationDirection(null)
      setIsAnimating(false)
    }, 300)
  }

  const handleNextMonth = () => {
    if (isAnimating) return
    setAnimationDirection('right')
    setIsAnimating(true)
    setTimeout(() => {
      if (month === 11) {
        onMonthChange(year + 1, 0)
      } else {
        onMonthChange(year, month + 1)
      }
      setAnimationDirection(null)
      setIsAnimating(false)
    }, 300)
  }

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    navigate(`/detail/${dateStr}`)
  }

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const animationClass = animationDirection === 'left' 
    ? 'slide-out-left' 
    : animationDirection === 'right' 
      ? 'slide-out-right' 
      : ''

  const isToday = (day: number): boolean => {
    const today = new Date()
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  }

  return (
    <div className="mosaic-calendar">
      <div className="calendar-header">
        <button 
          className="calendar-nav-btn"
          onClick={handlePrevMonth}
          aria-label="上个月"
        >
          ‹
        </button>
        <h3 className="calendar-title">
          {year}年 {monthNames[month]}
        </h3>
        <button 
          className="calendar-nav-btn"
          onClick={handleNextMonth}
          aria-label="下个月"
        >
          ›
        </button>
      </div>

      <div className="calendar-weekdays">
        {weekDays.map((day, index) => (
          <div 
            key={day} 
            className={`weekday ${index === 0 || index === 6 ? 'weekend' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className={`calendar-grid ${animationClass}`} key={`${year}-${month}`}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="calendar-day empty" />
          }

          const record = getRecordForDay(day)
          const moodConfig = record ? MOOD_MAP[record.moodType] : null
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isHovered = hoveredDate === dateStr
          const today = isToday(day)

          return (
            <div
              key={day}
              className={`calendar-day ${record ? 'has-record' : ''} ${today ? 'today' : ''}`}
              style={{
                backgroundColor: moodConfig ? moodConfig.color : 'var(--bg-white)',
              }}
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => setHoveredDate(dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <span className={`day-number ${record ? 'with-mood' : ''}`}>
                {day}
              </span>
              
              {record && (
                <span className="day-emoji">{moodConfig?.emoji}</span>
              )}

              {isHovered && record && (
                <div className="day-tooltip">
                  <div className="tooltip-emoji">{moodConfig?.emoji}</div>
                  <div className="tooltip-text">{record.text || '（无文字记录）'}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MosaicCalendar
