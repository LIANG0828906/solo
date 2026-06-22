import React, { useMemo, useState } from 'react'
import { Member, CheckInRecord } from '../../../store/challengeStore'

interface HeatmapProps {
  members: Member[]
  checkIns: CheckInRecord[]
  startDate: string
  durationDays: number
  onMemberClick?: (memberId: string) => void
}

interface WeekCell {
  dateStr: string | null
  dateObj: Date | null
  dayLabel: string
  isEmpty: boolean
}

const Heatmap: React.FC<HeatmapProps> = ({
  members,
  checkIns,
  startDate,
  durationDays,
  onMemberClick,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    memberId: string
    date: string
    x: number
    y: number
  } | null>(null)

  const weeks = useMemo(() => {
    const start = new Date(startDate)
    const startWeekday = start.getDay()

    const weeksArr: WeekCell[][] = []
    let currentWeek: WeekCell[] = []

    for (let i = 0; i < startWeekday; i++) {
      currentWeek.push({
        dateStr: null,
        dateObj: null,
        dayLabel: '',
        isEmpty: true,
      })
    }

    const daysToShow = Math.min(durationDays, 84)
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      currentWeek.push({
        dateStr: d.toISOString().split('T')[0],
        dateObj: d,
        dayLabel: `${d.getMonth() + 1}/${d.getDate()}`,
        isEmpty: false,
      })
      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek)
        currentWeek = []
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          dateStr: null,
          dateObj: null,
          dayLabel: '',
          isEmpty: true,
        })
      }
      weeksArr.push(currentWeek)
    }

    return weeksArr
  }, [startDate, durationDays])

  const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']

  const getCompletionColor = (memberId: string, dateStr: string): string => {
    const record = checkIns.find(
      c => c.memberId === memberId && c.date === dateStr
    )
    if (!record) return '#DC2626'
    if (record.completionAmount >= 100) return '#22C55E'
    if (record.completionAmount >= 50) return '#FACC15'
    return '#FACC15'
  }

  const getCompletionText = (memberId: string, dateStr: string): string => {
    const record = checkIns.find(
      c => c.memberId === memberId && c.date === dateStr
    )
    if (!record) return '未打卡'
    return `${record.completionAmount}% 完成`
  }

  const handleMouseEnter = (
    memberId: string,
    dateStr: string,
    e: React.MouseEvent
  ) => {
    setHoveredCell({
      memberId,
      date: dateStr,
      x: e.clientX,
      y: e.clientY,
    })
  }

  const handleMouseLeave = () => {
    setHoveredCell(null)
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 'fit-content' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '120px',
            gap: '4px',
            marginBottom: '4px',
          }}
        >
          {weekdayLabels.map((label, idx) => (
            <div
              key={idx}
              style={{
                width: '16px',
                fontSize: '10px',
                color: '#64748B',
                textAlign: 'center',
                fontWeight: '500',
              }}
            >
              {label}
            </div>
          ))}
          <div style={{ width: '12px' }} />
          {weeks.length > 1 && weeks.map((_, idx) => (
            idx % 2 === 1 ? (
              <div
                key={`w-${idx}`}
                style={{
                  width: '16px',
                  fontSize: '10px',
                  color: '#64748B',
                  textAlign: 'center',
                  marginLeft: idx === 1 ? '8px' : '20px',
                }}
              >
                {weeks[idx] && weeks[idx].find(c => !c.isEmpty)
                  ? weeks[idx].find(c => !c.isEmpty)!.dayLabel.split('/')[0] + '月'
                  : ''}
              </div>
            ) : null
          ))}
        </div>

        {members.map(member => (
          <div
            key={member.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: onMemberClick ? 'pointer' : 'default',
              padding: '4px 0',
              borderRadius: '8px',
              transition: 'background 0.2s ease',
            }}
            onClick={() => onMemberClick && onMemberClick(member.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <div
              style={{
                width: '112px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: member.avatar,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
              <span
                style={{
                  fontSize: '13px',
                  color: '#E2E8F0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {member.name}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              {weeks.map((week, weekIdx) => (
                <React.Fragment key={weekIdx}>
                  {week.map((cell, dayIdx) => (
                    cell.isEmpty ? (
                      <div
                        key={`${weekIdx}-${dayIdx}`}
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          background: 'transparent',
                        }}
                      />
                    ) : (
                      <div
                        key={`${weekIdx}-${dayIdx}`}
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          background: getCompletionColor(member.id, cell.dateStr!),
                          transition: 'transform 0.15s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => handleMouseEnter(member.id, cell.dateStr!, e)}
                        onMouseLeave={handleMouseLeave}
                      />
                    )
                  ))}
                  <div style={{ width: '4px' }} />
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>

      {hoveredCell && (
        <div
          style={{
            position: 'fixed',
            left: hoveredCell.x + 12,
            top: hoveredCell.y + 12,
            background: '#1E293B',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '2px' }}>
            {hoveredCell.date}
          </div>
          <div style={{ color: '#94A3B8' }}>
            {getCompletionText(hoveredCell.memberId, hoveredCell.date)}
          </div>
        </div>
      )}
    </div>
  )
}

export default Heatmap
