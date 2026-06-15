import React, { useEffect, useState } from 'react'
import { Flame, Droplets, Wind, Zap } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { ELEMENT_COLORS } from '../../shared/types'
import type { ElementType } from '../../shared/types'

const ELEMENT_ICONS: Record<ElementType, React.ReactNode> = {
  fire: <Flame className="w-12 h-12" />,
  water: <Droplets className="w-12 h-12" />,
  wind: <Wind className="w-12 h-12" />,
  thunder: <Zap className="w-12 h-12" />,
}

export const ComboDisplay: React.FC = () => {
  const { combo, currentElement, totalScore } = useGameStore()
  const [scalePulse, setScalePulse] = useState(false)
  const prevComboRef = React.useRef(combo)

  useEffect(() => {
    if (combo > prevComboRef.current && combo > 0) {
      setScalePulse(true)
      const timer = setTimeout(() => setScalePulse(false), 300)
      return () => clearTimeout(timer)
    }
    prevComboRef.current = combo
  }, [combo])

  const colors = ELEMENT_COLORS[currentElement]

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative p-5 rounded-3xl backdrop-blur-md border-2 transition-all duration-300"
        style={{
          backgroundColor: `${colors.primary}15`,
          borderColor: `${colors.primary}40`,
          boxShadow: `0 0 40px ${colors.primary}25, inset 0 0 30px ${colors.primary}10`,
        }}
      >
        {combo > 5 && (
          <div className="absolute inset-0 rounded-3xl animate-ring-sparkle pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: colors.primary,
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 45}deg) translateY(-90px)`,
                  boxShadow: `0 0 10px ${colors.primary}`,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        )}

        <div
          className="relative z-10 transition-transform duration-300"
          style={{
            color: colors.primary,
            filter: `drop-shadow(0 0 15px ${colors.primary})`,
            transform: scalePulse ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          {ELEMENT_ICONS[currentElement]}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div
          className={`relative transition-all duration-300 ${
            combo > 5 ? 'animate-shake-subtle' : ''
          }`}
          style={{
            transform: scalePulse ? 'scale(1.3)' : 'scale(1)',
          }}
        >
          <span
            className="text-5xl font-black tracking-tight"
            style={{
              fontFamily: '"Cinzel Decorative", serif',
              background: `linear-gradient(135deg, ${colors.gradient[0]}, ${colors.gradient[1]})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: `drop-shadow(0 0 15px ${colors.primary}80)`,
            }}
          >
            {combo}
          </span>
          {combo > 0 && (
            <span className="absolute -right-6 -top-1 text-sm font-bold text-white/60">
              连击
            </span>
          )}
        </div>

        <div className="mt-2 text-center">
          <div className="text-xs text-white/50 tracking-wider">当前得分</div>
          <div
            className="text-2xl font-bold transition-all duration-300"
            style={{
              fontFamily: '"Cinzel Decorative", serif',
              color: colors.primary,
              textShadow: `0 0 10px ${colors.primary}60`,
            }}
          >
            {totalScore.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}
