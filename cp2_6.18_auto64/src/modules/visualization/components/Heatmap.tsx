import React, { useMemo, useState } from 'react'
import { Member, CheckInRecord } from '../../../store/challengeStore'

interface HeatmapProps {
  members: Member[]
  checkIns: CheckInRecord[]
  startDate: string
  durationDays: number
  onMemberClick?: (memberId: string) => void
}

interface DayInfo {
  dateStr: string
  dateObj: Date
  dayLabel: string
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

  const days = useMemo(() => {
    const result: DayInfo[] = []
    const start = new Date(startDate)
    for (let i = 0; i < Math.min(durationDays, 28); i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      result.push({
        dateStr: d.toISOString().split('T')[0],
        dateObj: d,
        dayLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      })
    }
    return result
  }, [startDate, durationDays])

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
          }}
        >
          {days.map((day, idx) => (
            <div
              key={idx}
              style={{
                width: '16px',
                fontSize: '9px',
                color: '#64748B',
                textAlign: 'center',
                transform: idx % 3 === 0 ? 'none' : 'opacity(0)',
              }}
            >
              {idx % 3 === 0 ? day.dayLabel : ''}
            </div>
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
              transition: 'background 0.2s',
            }}
            onClick={() => onMemberClick && onMemberClick(member.id)}
            onMouseEnter={(e) => {
              const target = e.currentTarget
              target.style.background = 'rgba(59, 130, 246, 0.1)'
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget
              target.style.background = 'transparent'
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
              {days.map((day, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    background: getCompletionColor(member.id, day.dateStr),
                    transition: 'transform 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => handleMouseEnter(member.id, day.dateStr, e)}
                  onMouseLeave={handleMouseLeave}
                />
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
