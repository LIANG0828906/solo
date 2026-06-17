import React, { useState, useMemo, useCallback } from 'react'
import {
  useAppStore,
  COLORS,
  hexToRgba,
  getComplementaryColor,
  DiaryEntry,
} from '../store'

const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六']

const Calendar: React.FC = () => {
  const {
    viewMode,
    currentMonth,
    currentYear,
    setCurrentMonth,
    setCurrentYear,
    setViewMode,
    getEntryByDate,
  } = useAppStore()

  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [emptyTipDate, setEmptyTipDate] = useState<string | null>(null)

  const isLeapYear = useCallback((year: number) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  }, [])

  const getDaysInMonth = useCallback(
    (year: number, month: number) => {
      if (month === 1 && isLeapYear(year)) return 29
      return DAYS_IN_MONTH[month]
    },
    [isLeapYear]
  )

  const getFirstDayOfMonth = useCallback((year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }, [])

  const formatDateKey = useCallback((year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }, [])

  const handlePrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }, [currentMonth, currentYear, setCurrentMonth, setCurrentYear])

  const handleNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }, [currentMonth, currentYear, setCurrentMonth, setCurrentYear])

  const handleDateClick = useCallback(
    (dateKey: string, hasEntry: boolean) => {
      if (!hasEntry) {
        setEmptyTipDate(dateKey)
        setTimeout(() => setEmptyTipDate(null), 1000)
      }
    },
    []
  )

  const handleDateHover = useCallback(
    (dateKey: string, e: React.MouseEvent) => {
      const entry = getEntryByDate(dateKey)
      if (entry) {
        setHoveredDate(dateKey)
        const rect = e.currentTarget.getBoundingClientRect()
        const calendarRect = e.currentTarget.closest('.calendar-panel')?.getBoundingClientRect()
        if (calendarRect) {
          setTooltipPos({
            x: rect.left - calendarRect.left + rect.width / 2,
            y: rect.top - calendarRect.top - 8,
          })
        }
      }
    },
    [getEntryByDate]
  )

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }, [firstDay, daysInMonth])

  const getColorBar = (entry: DiaryEntry) => {
    const color = COLORS[entry.colorIndex]
    const complementary = getComplementaryColor(color)
    return (
      <div
        style={{
          position: 'absolute',
          bottom: '4px',
          left: '4px',
          right: '4px',
          height: '6px',
          borderRadius: '4px',
          background: `linear-gradient(to right, ${color}, ${complementary})`,
          pointerEvents: 'none',
        }}
      />
    )
  }

  const renderMonthView = () => (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={handlePrevMonth}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#555555',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#EEEEEE'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          ‹
        </button>
        <span style={{ fontSize: '16px', fontWeight: 400, color: '#333333' }}>
          {currentYear}年 {MONTH_NAMES[currentMonth]}
        </span>
        <button
          onClick={handleNextMonth}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#555555',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#EEEEEE'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          ›
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          marginBottom: '8px',
        }}
      >
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#9E9E9E',
              fontWeight: 300,
              height: '24px',
              lineHeight: '24px',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div
        className="calendar-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          position: 'relative',
        }}
      >
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} />
          }
          const dateKey = formatDateKey(currentYear, currentMonth, day)
          const entry = getEntryByDate(dateKey)
          const hasEntry = !!entry
          const isFirstDay = day === 1

          return (
            <div
              key={day}
              onClick={() => handleDateClick(dateKey, hasEntry)}
              onMouseEnter={(e) => {
                handleDateHover(dateKey, e)
                if (hasEntry) {
                  e.currentTarget.style.borderColor = '#BDBDBD'
                }
              }}
              onMouseLeave={(e) => {
                setHoveredDate(null)
                e.currentTarget.style.borderColor = '#E8E8E8'
              }}
              style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                border: '1px solid #E8E8E8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                color: '#555555',
                position: 'relative',
                cursor: hasEntry ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                fontWeight: 300,
              }}
            >
              {isFirstDay && (
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#4A90D9',
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>{day}</span>
              {hasEntry && entry && getColorBar(entry)}

              {emptyTipDate === dateKey && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-28px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#333333',
                    color: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 300,
                    whiteSpace: 'nowrap',
                    animation: 'fadeIn 0.3s ease',
                    zIndex: 10,
                  }}
                >
                  那天没有记录
                </div>
              )}
            </div>
          )
        })}

        {hoveredDate &&
          (() => {
            const entry = getEntryByDate(hoveredDate)
            if (!entry) return null
            const summary = entry.content.length > 20 ? entry.content.slice(0, 20) + '...' : entry.content
            return (
              <div
                style={{
                  position: 'absolute',
                  left: `${tooltipPos.x}px`,
                  top: `${tooltipPos.y - 4}px`,
                  transform: 'translateX(-50%) translateY(-100%)',
                  backgroundColor: '#333333',
                  color: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 300,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 20,
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                {summary}
              </div>
            )
          })()}
      </div>
    </div>
  )

  const renderYearView = () => {
    const months = 12
    const maxDays = 31

    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <button
            onClick={() => setCurrentYear(currentYear - 1)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#555555',
              padding: '4px 8px',
              marginRight: '12px',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EEEEEE'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            ‹
          </button>
          <span style={{ fontSize: '16px', fontWeight: 400, color: '#333333' }}>
            {currentYear} 年度色温画卷
          </span>
          <button
            onClick={() => setCurrentYear(currentYear + 1)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#555555',
              padding: '4px 8px',
              marginLeft: '12px',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#EEEEEE'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            ›
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(31, 18px)',
            gridTemplateRows: 'repeat(12, 18px)',
            gap: '2px',
            justifyContent: 'center',
          }}
        >
          {Array.from({ length: months }).map((_, monthIndex) =>
            Array.from({ length: maxDays }).map((_, dayIndex) => {
              const day = dayIndex + 1
              const monthDays = getDaysInMonth(currentYear, monthIndex)
              const isEmpty = day > monthDays
              const dateKey = formatDateKey(currentYear, monthIndex, day)
              const entry = getEntryByDate(dateKey)

              let bgColor = '#F5F5F0'
              if (entry) {
                bgColor = hexToRgba(COLORS[entry.colorIndex], 0.6)
              }
              if (isEmpty) {
                bgColor = 'transparent'
              }

              return (
                <div
                  key={`${monthIndex}-${day}`}
                  style={{
                    width: '18px',
                    height: '18px',
                    backgroundColor: bgColor,
                    borderRadius: '3px',
                    transition: 'background-color 0.3s ease',
                  }}
                  title={entry ? entry.content.slice(0, 30) : ''}
                />
              )
            })
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '12px',
            fontSize: '10px',
            color: '#9E9E9E',
          }}
        >
          <span>冷色</span>
          <div
            style={{
              flex: 1,
              height: '6px',
              margin: '0 8px',
              borderRadius: '3px',
              background: `linear-gradient(to right, ${COLORS[0]}, ${COLORS[6]}, ${COLORS[11]})`,
            }}
          />
          <span>暖色</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="calendar-panel"
      style={{
        width: '300px',
        backgroundColor: '#FAFAFA',
        borderRadius: '12px',
        padding: '16px',
        position: 'relative',
      }}
    >
      <button
        onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '12px',
          color: '#9E9E9E',
          fontWeight: 300,
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#555555'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#9E9E9E'
        }}
      >
        {viewMode === 'month' ? '年度画卷' : '月视图'}
      </button>

      {viewMode === 'month' ? renderMonthView() : renderYearView()}
    </div>
  )
}

export default React.memo(Calendar)
