import React, { useMemo, useRef } from 'react'
import { getSolarTermsByMonth, type SolarTerm } from './DataProvider'
import { getSeasonColor, getMonthDays, getMonthName, getWeekDay } from './utils'

interface CalendarProps {
  selectedSolarTerm: SolarTerm | null
  onSolarTermClick: (solarTerm: SolarTerm, elementRef: HTMLElement) => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const Calendar: React.FC<CalendarProps> = ({ selectedSolarTerm, onSolarTermClick }) => {
  const currentYear = new Date().getFullYear()
  const dotRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const monthsData = useMemo(() => {
    const months = []
    for (let m = 1; m <= 12; m++) {
      const days = getMonthDays(m, currentYear)
      const firstWeekDay = getWeekDay(currentYear, m, 1)
      const solarTerms = getSolarTermsByMonth(m)
      const solarTermMap: Record<number, SolarTerm> = {}
      solarTerms.forEach(st => {
        solarTermMap[st.day] = st
      })
      months.push({ month: m, days, firstWeekDay, solarTermMap })
    }
    return months
  }, [currentYear])

  const handleDotClick = (solarTerm: SolarTerm) => {
    const ref = dotRefs.current[solarTerm.id]
    if (ref) {
      onSolarTermClick(solarTerm, ref)
    }
  }

  return (
    <div style={{
      display: 'flex',
      gap: 24,
      padding: '40px 32px',
      overflowX: 'auto',
      minHeight: '100vh'
    }}>
      {monthsData.map(({ month, days, firstWeekDay, solarTermMap }) => (
        <div
          key={month}
          style={{
            flexShrink: 0,
            width: 200,
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 16,
            padding: '20px 16px',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div
            className="kaiti"
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: '#2C3E50',
              textAlign: 'center',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '2px solid #E8E0D0'
            }}
          >
            {getMonthName(month)}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 2,
              marginBottom: 8
            }}
          >
            {WEEKDAYS.map(wd => (
              <div
                key={wd}
                style={{
                  fontSize: 11,
                  color: '#999',
                  textAlign: 'center',
                  padding: '4px 0',
                  fontWeight: 500
                }}
              >
                {wd}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array.from({ length: firstWeekDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ height: 36 }} />
            ))}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1
              const solarTerm = solarTermMap[day]
              const isSelected = selectedSolarTerm?.id === solarTerm?.id

              return (
                <div
                  key={day}
                  style={{
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    fontSize: 13,
                    color: solarTerm ? 'transparent' : '#555',
                    fontWeight: solarTerm ? 600 : 400
                  }}
                >
                  {solarTerm ? (
                    <div
                      ref={el => { dotRefs.current[solarTerm.id] = el }}
                      onClick={() => handleDotClick(solarTerm)}
                      style={{
                        position: 'absolute',
                        width: isSelected ? 40 : 24,
                        height: isSelected ? 40 : 24,
                        borderRadius: '50%',
                        background: getSeasonColor(solarTerm.season),
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: isSelected ? 13 : 11,
                        fontWeight: 600,
                        boxShadow: isSelected
                          ? `0 0 0 4px ${getSeasonColor(solarTerm.season)}33, 0 4px 12px rgba(0,0,0,0.15)`
                          : '0 2px 6px rgba(0,0,0,0.1)',
                        zIndex: isSelected ? 2 : 1
                      }}
                      title={solarTerm.name}
                    >
                      {solarTerm.name.slice(-1)}
                    </div>
                  ) : (
                    day
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Calendar
