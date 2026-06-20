import { motion } from 'framer-motion'
import type { Cell } from '@/types'
import { getEventColor, getEventName } from '@/events/EventSystem'

interface BoardCellProps {
  cell: Cell
  size: number
  isMovable: boolean
  isAttackable: boolean
  isSelected: boolean
  hasUnit: boolean
  onClick: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

const factionColors = {
  light: '#4FC3F7',
  dark: '#AB47BC',
}

export function BoardCell({
  cell,
  size,
  isMovable,
  isAttackable,
  isSelected,
  hasUnit,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: BoardCellProps) {
  const eventColor = cell.eventType ? getEventColor(cell.eventType) : 'transparent'

  let highlightColor = 'transparent'
  let borderStyle = '1px solid #C9A96E'

  if (isMovable) {
    highlightColor = 'rgba(76, 175, 80, 0.25)'
    borderStyle = '1px dashed #4CAF50'
  } else if (isAttackable) {
    highlightColor = 'rgba(244, 67, 54, 0.25)'
    borderStyle = '1px dashed #F44336'
  }

  const cellContent = cell.tombstoneUnitId && (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative">
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          style={{ opacity: 0.5 }}
        >
          <path
            d="M14 2C8.5 2 4 6.5 4 12v14h20V12c0-5.5-4.5-10-10-10z"
            fill="#888"
            stroke="#666"
            strokeWidth="1"
          />
          <path
            d="M11 8h6M11 12h6M11 16h4"
            stroke="#555"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span
          className="absolute -top-2 -right-2 text-xs font-bold text-white bg-black/70 rounded-full w-5 h-5 flex items-center justify-center"
          style={{ color: factionColors[cell.tombstoneFaction!] }}
        >
          {cell.tombstoneTurns}
        </span>
      </div>
    </div>
  )

  return (
    <motion.div
      className="relative"
      style={{
        width: size,
        height: size,
        backgroundColor: '#1A0A2E',
        border: borderStyle,
        boxSizing: 'border-box',
        cursor: hasUnit || isMovable || isAttackable ? 'pointer' : 'default',
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      whileHover={{
        boxShadow: isSelected
          ? '0 0 20px #4FC3F7, inset 0 0 10px rgba(79, 195, 247, 0.3)'
          : 'inset 0 0 10px rgba(79, 195, 247, 0.3)',
        borderColor: '#4FC3F7',
        transition: { duration: 0.3 },
      }}
    >
      <svg
        className="absolute inset-0"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <polygon
          points={`${size / 2},${size * 0.15} ${size * 0.85},${size / 2} ${size / 2},${size * 0.85} ${size * 0.15},${size / 2}`}
          fill="rgba(128, 128, 128, 0.08)"
        />
      </svg>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: eventColor }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundColor: highlightColor }}
      />

      {cell.eventType && (
        <div className="absolute top-0.5 left-0.5 text-[8px] text-white/70 font-bold">
          {getEventName(cell.eventType).charAt(0)}
        </div>
      )}

      {cellContent}
    </motion.div>
  )
}
