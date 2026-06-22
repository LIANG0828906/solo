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
  date: Date | null
  dateStr: string | null
  dayOfMonth: number | null
  inChallenge: boolean
  isEmpty: boolean
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
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)
  const [bubblePos, setBubblePos] = useState({ x: 0, y: 0 })

  const start = useMemo(() => {
    const d = new Date(startDate)
    d.setHours(0, 0, 0, 0)
    return d
  }, [startDate])

  const end = useMemo(() => {
    const d = new Date(start)
    d.setDate(d.getDate() + durationDays - 1)
    return d
  }, [start, durationDays])

  const totalRows = useMemo(() => {
    const startWeekday = start.getDay()
    const totalCells = startWeekday + durationDays
    const rows = Math.ceil(totalCells / 7)
    return Math.min(rows, 5)
  }, [start, durationDays])

  const calendarDays = useMemo((): CalendarDay[] => {
    const startWeekday = start.getDay()
    const totalCells = totalRows * 7
    const days: CalendarDay[] = []

    for (let i = 0; i < startWeekday; i++) {
      days.push({
        date: null,
        dateStr: null,
        dayOfMonth: null,
        inChallenge: false,
        isEmpty: true,
        hasCheckIn: false,
      })
    }

    for (let i = 0; i < durationDays; i++) {
      if (days.length >= totalCells) break
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const checkIn = checkIns.find(c => c.date === dateStr)
      days.push({
        date: d,
        dateStr,
        dayOfMonth: d.getDate(),
        inChallenge: true,
        isEmpty: false,
        hasCheckIn: !!checkIn,
        checkIn,
      })
    }

    while (days.length < totalCells) {
      days.push({
        date: null,
        dateStr: null,
        dayOfMonth: null,
        inChallenge: false,
        isEmpty: true,
        hasCheckIn: false,
      })
    }

    return days
  }, [start, durationDays, totalRows, checkIns])

  const titleText = useMemo(() => {
    const startMonth = `${start.getFullYear()}年${start.getMonth() + 1}月`
    const endMonth = `${end.getFullYear()}年${end.getMonth() + 1}月`
    if (startMonth === endMonth) {
      return `${startMonth} · ${durationDays}天挑战`
    }
    return `${startMonth} - ${endMonth} · ${durationDays}天`
  }, [start, end, durationDays])

  const handleDayClick = (day: CalendarDay, e: React.MouseEvent) => {
    if (day.isEmpty || !day.inChallenge || !day.dateStr) return

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
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const todayStr = today.toISOString().split('T')[0]
            const challengeEnd = new Date(end)
            challengeEnd.setHours(0, 0, 0, 0)
            const useDate = today > challengeEnd ? challengeEnd.toISOString().split('T')[0] : todayStr
            onMakeUp(useDate)
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
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>
          {titleText}
        </div>
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

        {calendarDays.map((day, idx) => (
          day.isEmpty ? (
            <div
              key={idx}
              style={{
                aspectRatio: '1',
                background: 'transparent',
                borderRadius: '8px',
              }}
            />
          ) : (
            <div
              key={idx}
              onClick={(e) => handleDayClick(day, e)}
              style={{
                aspectRatio: '1',
                background: day.inChallenge ? '#fff' : '#1E293B',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (day.inChallenge) {
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
                  color: '#1E293B',
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
        ))}
      </div>

      {selectedDay && selectedDay.dateStr && (
        <>
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
                    const ds = selectedDay!.dateStr!
                    closeBubble()
                    onMakeUp(ds)
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
        </>
      )}
    </div>
  )
}

export default CalendarView
