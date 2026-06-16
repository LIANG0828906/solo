import { useState, useMemo } from 'react'
import type { GrowthEvent } from '@/types'
import { formatDateTime } from '@/utils/dateUtils'
import { eventConfig, truncateText } from '@/utils/eventUtils'
import { EventIcon } from './EventIcon'

interface TimelineProps {
  events: GrowthEvent[]
}

interface TimelineItemProps {
  event: GrowthEvent
  nextEvent?: GrowthEvent
}

function TimelineItem({ event, nextEvent }: TimelineItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { color, label, gradientFrom, gradientTo } = eventConfig[event.type]
  const shouldTruncate = event.description.length > 80
  const displayText = shouldTruncate && !isExpanded 
    ? truncateText(event.description, 80) 
    : event.description

  const connectorStyle = nextEvent
    ? {
        background: `linear-gradient(to bottom, ${gradientTo} 0%, ${eventConfig[nextEvent.type].gradientFrom} 100%)`
      }
    : {
        background: `linear-gradient(to bottom, ${gradientTo} 0%, transparent 100%)`
      }

  return (
    <div className="timeline-item">
      <div className="timeline-left">
        <div className="timeline-date">{formatDateTime(event.timestamp)}</div>
        <div className="timeline-icon" style={{ backgroundColor: `${color}20` }}>
          <EventIcon type={event.type} size={20} />
        </div>
        {nextEvent && (
          <div className="timeline-connector" style={connectorStyle} />
        )}
      </div>
      <div className="timeline-right">
        <div className="timeline-card" onClick={() => shouldTruncate && setIsExpanded(!isExpanded)}>
          <div className="timeline-card-header">
            <span className="timeline-card-label" style={{ color }}>
              {label}
            </span>
          </div>
          <p className="timeline-card-description">
            {displayText}
          </p>
          {shouldTruncate && (
            <button className="timeline-card-toggle">
              {isExpanded ? '收起' : '展开全文'}
            </button>
          )}
          {event.photos.length > 0 && (
            <div className="timeline-card-photos">
              {event.photos.map((photo, index) => (
                <img 
                  key={index} 
                  src={photo} 
                  alt={`照片 ${index + 1}`} 
                  loading="lazy"
                  className="timeline-card-photo"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Timeline({ events }: TimelineProps) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [events])

  if (sortedEvents.length === 0) {
    return (
      <div className="timeline-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22v-10" />
          <path d="M12 12 Q8 8 8 4 Q10 8 12 12" fill="#E0E0E0" />
          <path d="M12 12 Q16 8 16 4 Q14 8 12 12" fill="#E0E0E0" />
          <path d="M7 22h10" />
        </svg>
        <p>还没有生长记录</p>
        <span>点击下方按钮记录第一个事件吧！</span>
      </div>
    )
  }

  return (
    <div className="timeline">
      {sortedEvents.map((event, index) => (
        <TimelineItem
          key={event.id}
          event={event}
          nextEvent={sortedEvents[index + 1]}
        />
      ))}
    </div>
  )
}
