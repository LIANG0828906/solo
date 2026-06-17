import React, { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDiaryApi } from '../hooks/useDiaryApi'
import { useDiaryStore } from '../store/diaryStore'

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六']

interface CalendarPanelProps {
  onDateSelect?: (date: string) => void
}

export const CalendarPanel: React.FC<CalendarPanelProps> = ({ onDateSelect }) => {
  const { currentDate, setCurrentDate, setCurrentDiary } = useDiaryStore()
  const { getDiary, listDiaryByMonth } = useDiaryApi()
  const [viewYear, setViewYear] = useState<number>(0)
  const [viewMonth, setViewMonth] = useState<number>(0)
  const [diaryDates, setDiaryDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    const today = new Date()
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth() + 1)
  }, [])

  useEffect(() => {
    if (viewYear && viewMonth) {
      loadMonthDiaries()
    }
  }, [viewYear, viewMonth])

  const loadMonthDiaries = async () => {
    const diaries = await listDiaryByMonth(viewYear, viewMonth)
    const dates = new Set(diaries.map(d => d.date))
    setDiaryDates(dates)
  }

  const calendarDays = useMemo(() => {
    if (!viewYear || !viewMonth) return []

    const firstDay = new Date(viewYear, viewMonth - 1, 1)
    const lastDay = new Date(viewYear, viewMonth, 0)
    const startDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days: (number | null)[] = []
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    while (days.length % 7 !== 0) {
      days.push(null)
    }
    return days
  }, [viewYear, viewMonth])

  const formatDateStr = (day: number): string => {
    return `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const handleDateClick = async (day: number) => {
    const dateStr = formatDateStr(day)
    setCurrentDate(dateStr)
    const diary = await getDiary(dateStr)
    setCurrentDiary(diary)
    if (onDateSelect) {
      onDateSelect(dateStr)
    }
  }

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1)
      setViewMonth(12)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1)
      setViewMonth(1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const isToday = (day: number): boolean => {
    const today = new Date()
    return (
      day === today.getDate() &&
      viewMonth === today.getMonth() + 1 &&
      viewYear === today.getFullYear()
    )
  }

  const isSelected = (day: number): boolean => {
    const dateStr = formatDateStr(day)
    return dateStr === currentDate
  }

  const hasDiary = (day: number): boolean => {
    const dateStr = formatDateStr(day)
    return diaryDates.has(dateStr)
  }

  return (
    <div className="calendar-panel">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={prevMonth}>
          <ChevronLeft size={18} />
        </button>
        <span className="calendar-title">
          {viewYear}年{viewMonth}月
        </span>
        <button className="calendar-nav-btn" onClick={nextMonth}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="calendar-weekdays">
        {WEEK_DAYS.map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {calendarDays.map((day, index) => (
          <div key={index} className="calendar-day-cell">
            {day !== null && (
              <button
                className={`calendar-day ${isSelected(day) ? 'selected' : ''} ${isToday(day) ? 'today' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                {day}
                {hasDiary(day) && <span className="diary-dot" />}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
