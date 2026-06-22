import type { EventType } from '@/types'
import { eventConfig } from '@/utils/eventUtils'

interface EventIconProps {
  type: EventType
  size?: number
}

export function EventIcon({ type, size = 24 }: EventIconProps) {
  const { color } = eventConfig[type]

  const icons: Record<EventType, JSX.Element> = {
    sowing: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22v-7" />
        <ellipse cx="12" cy="10" rx="6" ry="8" fill={color} fillOpacity="0.2" />
        <path d="M7 10 Q4 6 7 3 Q10 6 12 10" fill={color} fillOpacity="0.4" />
        <path d="M17 10 Q20 6 17 3 Q14 6 12 10" fill={color} fillOpacity="0.4" />
        <ellipse cx="12" cy="19" rx="4" ry="2" fill={color} fillOpacity="0.3" />
      </svg>
    ),
    germination: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22v-10" />
        <path d="M12 12 Q8 8 8 4 Q10 8 12 12" fill={color} fillOpacity="0.5" />
        <path d="M12 12 Q16 8 16 4 Q14 8 12 12" fill={color} fillOpacity="0.5" />
        <path d="M7 22h10" />
      </svg>
    ),
    watering: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 Q6 10 6 15 A6 6 0 0 0 18 15 Q18 10 12 2" fill={color} fillOpacity="0.3" />
        <ellipse cx="12" cy="17" rx="2" ry="1" fill={color} fillOpacity="0.2" />
      </svg>
    ),
    fertilizing: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="14" rx="8" ry="6" fill={color} fillOpacity="0.2" />
        <path d="M12 8 V4" />
        <path d="M8 6 L16 6" />
        <path d="M10 14 v6" />
        <path d="M14 14 v6" />
        <circle cx="6" cy="16" r="1.5" fill={color} fillOpacity="0.6" />
        <circle cx="18" cy="16" r="1.5" fill={color} fillOpacity="0.6" />
        <circle cx="12" cy="18" r="1.5" fill={color} fillOpacity="0.6" />
      </svg>
    ),
    pruning: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 4 L18 8" />
        <circle cx="14" cy="4" r="2" fill={color} fillOpacity="0.3" />
        <circle cx="18" cy="8" r="2" fill={color} fillOpacity="0.3" />
        <path d="M4 20 L14 10" />
        <path d="M10 20 L16 14" />
        <path d="M4 20 Q8 16 10 14" fill="none" />
      </svg>
    ),
    harvest: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="14" rx="7" ry="6" fill={color} fillOpacity="0.3" />
        <path d="M12 8 V4" />
        <path d="M8 6 Q6 4 4 5" />
        <path d="M16 6 Q18 4 20 5" />
        <path d="M9 14 Q10 12 12 12 Q14 12 15 14" />
        <path d="M11 17 Q12 15 13 17" />
        <path d="M9 12 L9 9" />
        <path d="M15 12 L15 9" />
      </svg>
    ),
    pests: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="6" fill={color} fillOpacity="0.2" />
        <path d="M12 6 V3" />
        <path d="M8 6 L6 3" />
        <path d="M16 6 L18 3" />
        <path d="M6 12 H3" />
        <path d="M18 12 H21" />
        <path d="M8 18 L6 21" />
        <path d="M16 18 L18 21" />
        <circle cx="10" cy="10" r="1" fill={color} />
        <circle cx="14" cy="10" r="1" fill={color} />
        <path d="M9 14 Q12 16 15 14" />
      </svg>
    )
  }

  return icons[type]
}
