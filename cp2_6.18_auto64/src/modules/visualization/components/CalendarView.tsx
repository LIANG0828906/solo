import React, { useState, useMemo } from 'react'
import { CheckInRecord } from '../../../store/challengeStore'

interface CalendarViewProps {
  memberId: string
  memberName: string
  memberAvatar: string
  checkIns: CheckInRecord[]
  startDate: string
  durationDays: number
  onMakeUp: (date: string) => void
}

interface CalendarDay {
  date: Date
  dateStr: string
  dayOfMonth: number
  isCurrentMonth: boolean
  hasCheckIn: boolean
  checkIn?: CheckInRecord
}

const CalendarView: React.FC<CalendarViewProps> = ({
  memberName,
  memberAvatar,
  checkIns,
  startDate,
  durationDays,
  onMakeUp,
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(startDate)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [bubblePos, setBubblePos] = useState({ x: 0, y: 0 })

  const calendarDays = useMemo((): CalendarDay[] => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDayOfWeek = firstDay.getDay()

    const days: CalendarDay[] = []
    const prevMonthLastDay = new Date(year, month, 0).getDate()

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i)
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        dayOfMonth: prevMonthLastDay - i,
        isCurrentMonth: false,
        hasCheckIn: false,
      })
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i)
      const dateStr = d.toISOString().split('T')[0]
      const checkIn = checkIns.find(c => c.date === dateStr)
      days.push({
        date: d,
        dateStr,
        dayOfMonth: i,
        isCurrentMonth: true,
        hasCheckIn: !!checkIn,
        checkIn,
      })
    }

    const remaining = 35 - days.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        dayOfMonth: i,
        isCurrentMonth: false,
        hasCheckIn: false,
      })
    }

    return days
  }, [currentMonth, checkIns])

  const isDateInChallenge = (dateStr: string): boolean => {
    const start = new Date(startDate)
    const end = new Date(startDate)
    end.setDate(end.getDate() + durationDays - 1)
    const d = new Date(dateStr)
    return d >= start && d <= end
  }

  const handleDayClick = (day: CalendarDay, e: React.MouseEvent) => {
    if (!day.isCurrentMonth) return
    if (!isDateInChallenge(day.dateStr)) return

    const rect = e.currentTarget.getBoundingClientRect()
    setBubblePos({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    })
    setSelectedDay(day)
  }

  const closeBubble = () => {
    setSelectedDay(null)
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: memberAvatar,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            {memberName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
              {memberName}
            </div>
            <div style={{ fontSize: '13px', color: '#94A3B8' }}>
              打卡日历
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            const today = new Date().toISOString().split('T')[0]
            onMakeUp(today)
          }}
          style={{
            background: '#3B82F6',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          + 补卡
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={prevMonth}
          style={{
            background: '#334155',
            color: '#E2E8F0',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ‹
        </button>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>
          {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
        </div>
        <button
          onClick={nextMonth}
          style={{
            background: '#334155',
            color: '#E2E8F0',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ›
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '6px',
        }}
      >
        {weekDays.map(day => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#64748B',
              padding: '8px 0',
            }}
          >
            {day}
          </div>
        ))}

        {calendarDays.map((day, idx) => {
          const inChallenge = isDateInChallenge(day.dateStr)
          return (
            <div
              key={idx}
              onClick={(e) => handleDayClick(day, e)}
              style={{
                aspectRatio: '1',
                background: day.isCurrentMonth && inChallenge ? '#fff' : '#1E293B',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: day.isCurrentMonth && inChallenge ? 'pointer' : 'default',
                opacity: day.isCurrentMonth ? 1 : 0.4,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                if (day.isCurrentMonth && inChallenge) {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  color: day.isCurrentMonth && inChallenge ? '#1E293B' : '#64748B',
                  fontWeight: '500',
                }}
              >
                {day.dayOfMonth}
              </span>
              {day.hasCheckIn && (
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#22C55E',
                    position: 'absolute',
                    bottom: '6px',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {selectedDay && (
        <div
          style={{
            position: 'fixed',
            left: bubblePos.x,
            top: bubblePos.y,
            transform: 'translateX(-50%)',
            background: '#1E293B',
            color: '#fff',
            padding: '16px',
            borderRadius: '12px',
            zIndex: 1000,
            minWidth: '240px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontWeight: '600', fontSize: '14px' }}>
              {selectedDay.dateStr}
            </span>
            <button
              onClick={closeBubble}
              style={{
                background: 'transparent',
                color: '#94A3B8',
                fontSize: '18px',
                padding: '0 4px',
              }}
            >
              ×
            </button>
          </div>

          {selectedDay.checkIn ? (
            <>
              <p style={{ fontSize: '13px', color: '#CBD5E1', marginBottom: '12px' }}>
                {selectedDay.checkIn.description || '无描述'}
              </p>
              {selectedDay.checkIn.imageBase64 && (
                <div
                  style={{
                    width: '100%',
                    height: '120px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#334155',
                  }}
                >
                  <img
                    src={selectedDay.checkIn.imageBase64}
                    alt="打卡图片"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '12px',
                    color: '#22C55E',
                    fontWeight: '600',
                  }}
                >
                  完成度: {selectedDay.checkIn.completionAmount}%
                </span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
                当日未打卡
              </p>
              <button
                onClick={() => {
                  closeBubble()
                  onMakeUp(selectedDay.dateStr)
                }}
                style={{
                  background: '#3B82F6',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                补卡
              </button>
            </div>
          )}
        </div>
      )}

      {selectedDay && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={closeBubble}
        />
      )}
    </div>
  )
}

export default CalendarView
