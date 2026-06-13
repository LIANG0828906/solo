import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import type { DiaryEntry, Clothing, Mood } from '../shared/types'
import { MOOD_LABELS, MOOD_COLORS, CATEGORY_LABELS } from '../shared/types'
import './Diary.css'

const WEEKDAYS: string[] = ['一', '二', '三', '四', '五', '六', '日']

const MOOD_EMOJI: Record<Mood, string> = {
  happy: '😊',
  calm: '😌',
  sad: '😢',
  excited: '🤩',
  tired: '😴'
}

type FilterMood = Mood | 'all'

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  diary?: DiaryEntry
}

function Diary() {
  const [diaries, setDiaries] = useState<DiaryEntry[]>([])
  const [clothing, setClothing] = useState<Clothing[]>([])
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [displayDate, setDisplayDate] = useState<Date>(new Date())
  const [filter, setFilter] = useState<FilterMood>('all')
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState<boolean>(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [diaryRes, clothingRes] = await Promise.all([
        axios.get<DiaryEntry[]>('/api/diary'),
        axios.get<Clothing[]>('/api/clothing')
      ])
      setDiaries(diaryRes.data)
      setClothing(clothingRes.data)
    } catch (err) {
      console.error('获取数据失败', err)
      setDiaries([
        {
          id: '1',
          date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-10`,
          clothingIds: [],
          mood: 'happy',
          note: '今天阳光明媚，穿了新买的裙子'
        },
        {
          id: '2',
          date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-15`,
          clothingIds: [],
          mood: 'calm',
          note: '平静的一天，工作顺利'
        },
        {
          id: '3',
          date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-20`,
          clothingIds: [],
          mood: 'excited',
          note: '周末和朋友出去玩了！'
        },
        {
          id: '4',
          date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-25`,
          clothingIds: [],
          mood: 'tired',
          note: '加班到很晚，好累'
        }
      ])
      setClothing([
        { id: 'c1', name: '白T恤', category: 'top', color: '#FFFFFF', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300', createdAt: '2024-01-01' },
        { id: 'c2', name: '牛仔裤', category: 'bottom', color: '#45B7D1', imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300', createdAt: '2024-01-01' },
        { id: 'c3', name: '运动鞋', category: 'shoes', color: '#FFFFFF', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300', createdAt: '2024-01-01' }
      ])
    }
  }

  const diaryMap = useMemo(() => {
    const map = new Map<string, DiaryEntry>()
    diaries.forEach((d) => {
      map.set(d.date, d)
    })
    return map
  }, [diaries])

  const getCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const firstWeekday = (firstDay.getDay() + 6) % 7
    const daysInMonth = lastDay.getDate()
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    
    const days: CalendarDay[] = []
    
    for (let i = firstWeekday - 1; i >= 0; i--) {
      const day = new Date(year, month - 1, prevMonthLastDay - i)
      const dateStr = formatDate(day)
      days.push({
        date: day,
        isCurrentMonth: false,
        diary: diaryMap.get(dateStr)
      })
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i)
      const dateStr = formatDate(day)
      days.push({
        date: day,
        isCurrentMonth: true,
        diary: diaryMap.get(dateStr)
      })
    }
    
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const day = new Date(year, month + 1, i)
      const dateStr = formatDate(day)
      days.push({
        date: day,
        isCurrentMonth: false,
        diary: diaryMap.get(dateStr)
      })
    }
    
    return days
  }

  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const monthTitle = (): string => {
    const year = displayDate.getFullYear()
    const month = displayDate.getMonth() + 1
    return `${year}年${month}月`
  }

  const prevMonth = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setSlideDirection('right')
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1)
    setTimeout(() => {
      setDisplayDate(newDate)
      setSlideDirection(null)
      setIsAnimating(false)
    }, 350)
  }

  const nextMonth = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setSlideDirection('left')
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1)
    setTimeout(() => {
      setDisplayDate(newDate)
      setSlideDirection(null)
      setIsAnimating(false)
    }, 350)
  }

  const handleDayClick = (day: CalendarDay) => {
    if (day.diary) {
      setSelectedEntry(day.diary)
    }
  }

  const getClothingById = (id: string): Clothing | undefined => {
    return clothing.find((c) => c.id === id)
  }

  const currentDays = useMemo(() => getCalendarDays(displayDate), [displayDate, diaryMap])
  
  const adjacentDate = useMemo(() => {
    if (slideDirection === 'left') {
      return getCalendarDays(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1))
    } else if (slideDirection === 'right') {
      return getCalendarDays(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1))
    }
    return null
  }, [slideDirection, displayDate, diaryMap])

  const shouldShowDot = (diary: DiaryEntry | undefined): boolean => {
    if (!diary) return false
    if (filter === 'all') return true
    return diary.mood === filter
  }

  const filterOptions: { value: FilterMood; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'happy', label: MOOD_LABELS.happy },
    { value: 'calm', label: MOOD_LABELS.calm },
    { value: 'sad', label: MOOD_LABELS.sad },
    { value: 'excited', label: MOOD_LABELS.excited },
    { value: 'tired', label: MOOD_LABELS.tired }
  ]

  const renderCalendarGrid = (days: CalendarDay[], className: string) => (
    <div className={`calendar-grid ${className}`}>
      {WEEKDAYS.map((w) => (
        <div key={w} className="weekday-cell">{w}</div>
      ))}
      {days.map((day, idx) => {
        const isToday = formatDate(day.date) === formatDate(currentDate)
        return (
          <div
            key={idx}
            className={`day-cell ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${day.diary ? 'has-diary' : ''}`}
            onClick={() => handleDayClick(day)}
          >
            <span className="day-number">{day.date.getDate()}</span>
            {shouldShowDot(day.diary) && (
              <span
                className="mood-dot"
                style={{ backgroundColor: MOOD_COLORS[day.diary!.mood] }}
              />
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="diary-page">
      <div className="diary-header">
        <h1>穿搭日记</h1>
      </div>

      <div className="filter-bar">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            className={`filter-btn ${filter === opt.value ? 'active' : ''}`}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="calendar-card">
        <div className="calendar-header">
          <button className="nav-btn" onClick={prevMonth} disabled={isAnimating}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <h2 className="month-title">{monthTitle()}</h2>
          <button className="nav-btn" onClick={nextMonth} disabled={isAnimating}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <div className="calendar-container">
          <div className="calendar-wrapper"
            style={{
              transform: slideDirection === 'left' ? 'translateX(-100%)' : slideDirection === 'right' ? 'translateX(100%)' : 'translateX(0)',
              transition: slideDirection ? 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              opacity: slideDirection ? 0 : 1,
              transitionProperty: slideDirection ? 'transform, opacity' : undefined,
            }}
          >
            {renderCalendarGrid(currentDays, '')}
          </div>
          {adjacentDate && (
            <div
              className="calendar-wrapper adjacent"
              style={{
                transform: slideDirection === 'left' ? 'translateX(0)' : slideDirection === 'right' ? 'translateX(0)' : undefined,
                left: slideDirection === 'left' ? '100%' : slideDirection === 'right' ? '-100%' : undefined,
                transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: 1,
              }}
            >
              {renderCalendarGrid(adjacentDate, '')}
            </div>
          )}
        </div>
      </div>

      {selectedEntry && (
        <div className="modal-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>日记详情</h3>
              <button className="close-btn" onClick={() => setSelectedEntry(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="detail-date">{selectedEntry.date}</div>

            <div className="detail-mood" style={{ backgroundColor: MOOD_COLORS[selectedEntry.mood] + '20' }}>
              <span className="mood-emoji">{MOOD_EMOJI[selectedEntry.mood]}</span>
              <span className="mood-text" style={{ color: MOOD_COLORS[selectedEntry.mood] }}>
                {MOOD_LABELS[selectedEntry.mood]}
              </span>
            </div>

            {selectedEntry.clothingIds.length > 0 && (
              <div className="detail-section">
                <h4>今日穿搭</h4>
                <div className="outfit-grid">
                  {selectedEntry.clothingIds.map((id) => {
                    const item = getClothingById(id)
                    if (!item) return null
                    return (
                      <div key={id} className="outfit-item">
                        <img src={item.imageUrl} alt={item.name} className="outfit-image" />
                        <div className="outfit-info">
                          <span className="outfit-name">{item.name}</span>
                          <span className="outfit-category">{CATEGORY_LABELS[item.category]}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedEntry.note && (
              <div className="detail-section">
              <h4>备注</h4>
              <p className="detail-note">{selectedEntry.note}</p>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Diary
