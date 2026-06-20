import { motion } from 'framer-motion'
import type { Unit } from '@/types'

interface ChessUnitProps {
  unit: Unit
  cellSize: number
  isSelected: boolean
  onClick: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
}

const factionColors = {
  light: '#4FC3F7',
  dark: '#AB47BC',
}

const elementColors = {
  fire: '#FF5722',
  ice: '#42A5F5',
  thunder: '#9C27B0',
  dark: '#212121',
}

const elementIcons = {
  fire: '🔥',
  ice: '❄️',
  thunder: '⚡',
  dark: '🌑',
}

const unitShapes: Record<string, (color: string, size: number) => JSX.Element> = {
  warrior: (color, size) => (
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 60 60">
      <polygon points="30,5 55,25 45,55 15,55 5,25" fill={color} stroke="#fff" strokeWidth="2" />
      <polygon points="30,15 45,30 40,45 20,45 15,30" fill="rgba(255,255,255,0.3)" />
    </svg>
  ),
  mage: (color, size) => (
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 60 60">
      <polygon points="30,2 58,55 2,55" fill={color} stroke="#fff" strokeWidth="2" />
      <circle cx="30" cy="40" r="8" fill="rgba(255,255,255,0.5)" />
    </svg>
  ),
  archer: (color, size) => (
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 60 60">
      <polygon points="30,5 50,30 30,55 10,30" fill={color} stroke="#fff" strokeWidth="2" />
      <path d="M20,30 Q30,10 40,30 Q30,50 20,30" fill="none" stroke="#fff" strokeWidth="2" />
    </svg>
  ),
  assassin: (color, size) => (
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 60 60">
      <polygon points="30,5 55,50 30,40 5,50" fill={color} stroke="#fff" strokeWidth="2" />
      <polygon points="30,20 40,35 30,30 20,35" fill="rgba(255,255,255,0.4)" />
    </svg>
  ),
  priest: (color, size) => (
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 60 60">
      <circle cx="30" cy="30" r="25" fill={color} stroke="#fff" strokeWidth="2" />
      <rect x="26" y="12" width="8" height="36" fill="rgba(255,255,255,0.6)" />
      <rect x="12" y="26" width="36" height="8" fill="rgba(255,255,255,0.6)" />
    </svg>
  ),
  warlock: (color, size) => (
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 60 60">
      <polygon points="30,2 50,20 50,45 30,58 10,45 10,20" fill={color} stroke="#fff" strokeWidth="2" />
      <polygon points="30,15 42,25 42,40 30,50 18,40 18,25" fill="rgba(255,255,255,0.3)" />
    </svg>
  ),
}

export function ChessUnit({
  unit,
  cellSize,
  isSelected,
  onClick,
  onDragStart,
  onDragEnd,
}: ChessUnitProps) {
  const factionColor = factionColors[unit.faction]
  const elementColor = elementColors[unit.element]
  const shape = unitShapes[unit.type](elementColor, cellSize)
  const hpPercent = (unit.hp / unit.maxHp) * 100
  const mpPercent = (unit.mp / unit.maxMp) * 100

  const unitOffset = cellSize * 0.2

  return (
    <motion.div
      className="absolute cursor-grab active:cursor-grabbing"
      style={{
        width: cellSize,
        height: cellSize,
        left: unit.x * cellSize,
        top: unit.y * cellSize,
        zIndex: isSelected ? 20 : 10,
      }}
      onClick={e => {
        e.stopPropagation()
        onClick()
      }}
      draggable
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(e)
      }}
      onDragEnd={onDragEnd}
      animate={{
        scale: isSelected ? 1.1 : 1,
        y: isSelected ? -4 : 0,
      }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 60,
          height: 60,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${factionColor}4D 0%, transparent 70%)`,
          opacity: 0.3,
        }}
      />

      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `translateY(-${unitOffset}px)` }}
      >
        {shape}
      </div>

      <div
        className="absolute text-[10px]"
        style={{
          top: cellSize * 0.05,
          right: cellSize * 0.1,
        }}
      >
        {elementIcons[unit.element]}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col gap-0.5" style={{ bottom: 4 }}>
        <div className="w-10 h-1 bg-black/50 rounded overflow-hidden">
          <motion.div
            className="h-full rounded"
            style={{ backgroundColor: '#E53935' }}
            initial={false}
            animate={{ width: `${hpPercent}%` }}
          />
        </div>
        <div className="w-10 h-1 bg-black/50 rounded overflow-hidden">
          <motion.div
            className="h-full rounded"
            style={{ backgroundColor: '#1E88E5' }}
            initial={false}
            animate={{ width: `${mpPercent}%` }}
          />
        </div>
      </div>

      {(unit.hasMoved || unit.hasAttacked) && (
        <div className="absolute inset-0 bg-black/40 rounded" />
      )}
    </motion.div>
  )
}
