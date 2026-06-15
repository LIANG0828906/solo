import { useState, useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  useFoodStore,
  MEAL_TYPE_LABELS,
  MEAL_TYPE_EMOJIS,
  MealType,
  MealRecord,
} from '../store/foodStore'

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

interface DayDetailModalProps {
  date: Date
  onClose: () => void
}

function DayDetailModal({ date, onClose }: DayDetailModalProps) {
  const { getDayRecords, getDayNutrition } = useFoodStore()
  const records = getDayRecords(date)
  const nutrition = getDayNutrition(date)

  const grouped = useMemo(() => {
    const result: Record<MealType, MealRecord[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    }
    records.forEach((r) => {
      result[r.mealType].push(r)
    })
    return result
  }, [records])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            📅 {format(date, 'yyyy年M月d日', { locale: zhCN })}
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="meal-summary-calories">
          <div className="meal-summary-calories-label">总热量摄入</div>
          <div className="meal-summary-calories-value">
            {Math.round(nutrition.calories)}
            <span style={{ fontSize: '16px', fontWeight: 500 }}> 千卡</span>
          </div>
          <div style={{ fontSize: '12px', color: '#616161', marginTop: '6px' }}>
            蛋白质 {nutrition.protein}g · 碳水 {nutrition.carbs}g · 脂肪 {nutrition.fat}g
          </div>
        </div>

        {records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <div className="empty-text">当天还没有饮食记录</div>
          </div>
        ) : (
          <div className="meal-list">
            {MEAL_TYPES.map((type) => {
              const items = grouped[type]
              if (items.length === 0) return null
              const typeCalories = items.reduce((sum, r) => sum + r.calories, 0)
              return (
                <div key={type} className="meal-section">
                  <div className="meal-section-title">
                    <span>{MEAL_TYPE_EMOJIS[type]}</span>
                    <span>{MEAL_TYPE_LABELS[type]}</span>
                    <span style={{ marginLeft: 'auto', color: '#FF8C00', fontWeight: 700 }}>
                      {Math.round(typeCalories)} 千卡
                    </span>
                  </div>
                  {items.map((r) => (
                    <div key={r.id} className="meal-item">
                      <div className="meal-item-info">
                        <span className="meal-item-name">{r.foodName}</span>
                        <span className="meal-item-detail">
                          {r.quantity} × {r.serving}
                          {' · '}
                          {format(new Date(r.timestamp), 'HH:mm')}
                        </span>
                      </div>
                      <div className="meal-item-calories">
                        +{Math.round(r.calories)}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const { hasRecordsOnDay } = useFoodStore()

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart, { locale: zhCN })
    const endDate = endOfWeek(monthEnd, { locale: zhCN })
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <div className="card calendar-container">
      <div className="card-title">📅 日历回顾</div>

      <div className="calendar-header">
        <button
          className="calendar-nav-btn"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          title="上一个月"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="calendar-month">
          {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
        </div>
        <button
          className="calendar-nav-btn"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          title="下一个月"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="calendar-weekday">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, currentMonth)
          const hasRecord = hasRecordsOnDay(day)
          const today = isToday(day)
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          const classes = [
            'calendar-day',
            !inMonth ? 'other-month' : '',
            today ? 'today' : '',
            inMonth ? (hasRecord ? 'has-record' : 'no-record') : '',
            isSelected ? 'selected' : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={day.toISOString()}
              className={classes}
              onClick={() => inMonth && handleDayClick(day)}
              disabled={!inMonth}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <DayDetailModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  )
}
