import React from 'react'
import { Flame, Droplets, Wind, Zap } from 'lucide-react'
import type { ElementType } from '../../shared/types'
import { ELEMENT_COLORS, ELEMENT_NAMES, ELEMENT_COUNTER } from '../../shared/types'
import { useGameStore } from '../store/gameStore'
import { cn } from '../lib/utils'

const ELEMENT_ICONS: Record<ElementType, React.ReactNode> = {
  fire: <Flame className="w-8 h-8" />,
  water: <Droplets className="w-8 h-8" />,
  wind: <Wind className="w-8 h-8" />,
  thunder: <Zap className="w-8 h-8" />,
}

interface ElementSelectorProps {
  onElementChange?: (element: ElementType) => void
}

export const ElementSelector: React.FC<ElementSelectorProps> = ({ onElementChange }) => {
  const { currentElement, setCurrentElement, setBackgroundTint, dailyElement } = useGameStore()

  const elements: ElementType[] = ['fire', 'water', 'wind', 'thunder']

  const handleElementClick = (element: ElementType) => {
    if (element === currentElement) return
    setCurrentElement(element)
    setBackgroundTint(ELEMENT_COLORS[element].primary)
    onElementChange?.(element)
  }

  const isDailyBonusElement = ELEMENT_COUNTER[currentElement] === dailyElement

  return (
    <div className="relative w-full">
      {isDailyBonusElement && (
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap"
          style={{
            background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
            color: '#1a0a2e',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
          }}
        >
          ⚡ 每日克制加成 1.5x ⚡
        </div>
      )}
      <div className="flex items-center justify-center gap-3 md:gap-6 p-4">
        {elements.map((element) => {
          const isActive = currentElement === element
          const colors = ELEMENT_COLORS[element]
          const isCounterDaily = ELEMENT_COUNTER[element] === dailyElement

          return (
            <button
              key={element}
              onClick={() => handleElementClick(element)}
              className={cn(
                'relative flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl transition-all duration-300 cursor-pointer',
                'backdrop-blur-md border-2',
                isActive ? 'scale-110 animate-bounce-short z-10' : 'hover:scale-105 opacity-70 hover:opacity-100',
              )}
              style={{
                backgroundColor: isActive ? `${colors.primary}25` : 'rgba(255,255,255,0.05)',
                borderColor: isActive ? colors.primary : 'rgba(255,255,255,0.15)',
                boxShadow: isActive
                  ? `0 0 30px ${colors.primary}60, inset 0 0 20px ${colors.primary}30`
                  : 'none',
              }}
            >
              <div
                className={cn(
                  'transition-all duration-300 rounded-xl p-2',
                  isActive && 'animate-pulse-glow',
                )}
                style={{
                  color: colors.primary,
                  filter: isActive ? `drop-shadow(0 0 8px ${colors.primary})` : 'none',
                }}
              >
                {ELEMENT_ICONS[element]}
              </div>
              <span
                className="mt-1 text-xs md:text-sm font-bold tracking-wider"
                style={{ color: colors.primary }}
              >
                {ELEMENT_NAMES[element]}
              </span>
              {isCounterDaily && (
                <div
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: '#ffd700', color: '#1a0a2e' }}
                >
                  ★
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
