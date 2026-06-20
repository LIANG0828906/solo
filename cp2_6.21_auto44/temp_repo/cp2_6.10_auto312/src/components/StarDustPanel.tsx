import { useState } from 'react'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Rarity = 'common' | 'rare' | 'legendary'

export interface StarDust {
  id: string
  name: string
  color: string
  rarity: Rarity
  count: number
}

interface StarDustPanelProps {
  starDustList: StarDust[]
  onDragStart: (e: React.PointerEvent, starDust: StarDust) => void
}

const rarityColors: Record<Rarity, string> = {
  common: 'text-gray-400 bg-gray-500/20 border-gray-500/30',
  rare: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  legendary: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
}

const rarityLabels: Record<Rarity, string> = {
  common: '普通',
  rare: '稀有',
  legendary: '传说',
}

const rarityGlow: Record<Rarity, string> = {
  common: 'shadow-gray-500/30',
  rare: 'shadow-blue-500/50',
  legendary: 'shadow-yellow-500/60',
}

export default function StarDustPanel({ starDustList, onDragStart }: StarDustPanelProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const handlePointerDown = (e: React.PointerEvent, starDust: StarDust) => {
    setDraggingId(starDust.id)
    onDragStart(e, starDust)
  }

  const handlePointerUp = () => {
    setDraggingId(null)
  }

  return (
    <div
      className={cn(
        'fixed left-0 top-1/2 -translate-y-1/2 w-[200px] p-4',
        'md:w-[200px] md:left-0 md:top-1/2 md:-translate-y-1/2',
        'bottom-0 left-0 right-0 top-auto translate-y-0 w-full h-auto',
        'md:h-auto md:translate-y-0'
      )}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        className={cn(
          'bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20',
          'shadow-lg overflow-hidden',
          'md:grid-cols-2 grid-cols-3 md:grid gap-2 p-3',
          'flex md:grid overflow-x-auto md:overflow-visible gap-3 p-4'
        )}
      >
        {starDustList.map((dust) => (
          <div
            key={dust.id}
            className={cn(
              'relative flex flex-col items-center p-3 rounded-xl',
              'bg-white/5 border border-white/10',
              'transition-all duration-300 cursor-pointer',
              'hover:bg-white/10 hover:scale-105',
              'min-w-[80px] md:min-w-0',
              draggingId === dust.id && 'opacity-50 scale-95'
            )}
            onPointerDown={(e) => handlePointerDown(e, dust)}
          >
            <div
              className={cn(
                'relative w-12 h-12 rounded-full mb-2',
                'flex items-center justify-center',
                'animate-spin-slow',
                `shadow-lg ${rarityGlow[dust.rarity]}`
              )}
              style={{
                background: `radial-gradient(circle, ${dust.color} 0%, ${dust.color}80 50%, transparent 70%)`,
                boxShadow: `0 0 20px ${dust.color}60, 0 0 40px ${dust.color}30`,
              }}
            >
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: dust.color }}
              />
            </div>

            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full border mb-1',
                rarityColors[dust.rarity]
              )}
            >
              {rarityLabels[dust.rarity]}
            </span>

            <span className="text-xs text-white/80 font-medium truncate w-full text-center">
              {dust.name}
            </span>

            <span className="text-[10px] text-white/50">×{dust.count}</span>

            <div className="absolute top-1 right-1 text-white/30">
              <GripVertical size={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
