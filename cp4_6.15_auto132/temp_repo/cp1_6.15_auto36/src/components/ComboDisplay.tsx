import React, { useEffect, useState, useRef } from 'react'
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

function getComboMultiplier(combo: number): number {
  if (combo >= 20) return 3
  if (combo >= 10) return 2
  if (combo >= 5) return 1.5
  return 1
}

function getComboText(combo: number): string {
  if (combo >= 20) return '传说连击!'
  if (combo >= 10) return '超神连击!'
  if (combo >= 5) return '完美连击!'
  return ''
}

export const ComboDisplay: React.FC = () => {
  const { combo, currentElement, totalScore } = useGameStore()
  const [scalePulse, setScalePulse] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [showComboBreak, setShowComboBreak] = useState(false)
  const [goldenFlash, setGoldenFlash] = useState(false)
  const prevComboRef = useRef(combo)

  useEffect(() => {
    if (combo > prevComboRef.current && combo > 0) {
      setScalePulse(true)
      const timer = setTimeout(() => setScalePulse(false), 300)
      return () => clearTimeout(timer)
    }
    prevComboRef.current = combo
  }, [combo])

  useEffect(() => {
    if (combo < prevComboRef.current && prevComboRef.current > 0 && combo === 0) {
      setIsShaking(true)
      setShowComboBreak(true)
      const shakeTimer = setTimeout(() => setIsShaking(false), 500)
      const breakTimer = setTimeout(() => setShowComboBreak(false), 1000)
      return () => {
        clearTimeout(shakeTimer)
        clearTimeout(breakTimer)
      }
    }
    prevComboRef.current = combo
  }, [combo])

  useEffect(() => {
    if (combo >= 10) {
      const interval = setInterval(() => {
        setGoldenFlash(true)
        setTimeout(() => setGoldenFlash(false), 200)
      }, 500)
      return () => clearInterval(interval)
    }
  }, [combo])

  const colors = ELEMENT_COLORS[currentElement]
  const multiplier = getComboMultiplier(combo)
  const comboText = getComboText(combo)

  const numberSize = combo >= 20 ? 'text-7xl' : combo >= 10 ? 'text-6xl' : combo >= 5 ? 'text-5xl' : 'text-4xl'

  return (
    <div className="flex flex-col items-center gap-4 relative">
      {showComboBreak && (
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 text-red-500 font-black text-2xl animate-combo-break"
          style={{
            fontFamily: '"Cinzel Decorative", serif',
            textShadow: '0 0 20px rgba(239, 68, 68, 0.8)',
            zIndex: 50,
          }}
        >
          连击中断!
        </div>
      )}

      <div
        className={`relative p-5 rounded-3xl backdrop-blur-md border-2 transition-all duration-300 ${
          isShaking ? 'animate-shake' : ''
        }`}
        style={{
          backgroundColor: `${colors.primary}15`,
          borderColor: `${colors.primary}40`,
          boxShadow: `0 0 40px ${colors.primary}25, inset 0 0 30px ${colors.primary}10`,
        }}
      >
        {combo >= 5 && (
          <div className="absolute inset-0 rounded-3xl animate-ring-rotate pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: colors.primary,
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 45}deg) translateY(-90px)`,
                  boxShadow: `0 0 12px ${colors.primary}, 0 0 24px ${colors.primary}80`,
                  opacity: 0.9,
                }}
              />
            ))}
          </div>
        )}

        {combo >= 10 && goldenFlash && (
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none animate-golden-flash"
            style={{
              boxShadow: '0 0 60px rgba(255, 215, 0, 0.8), inset 0 0 40px rgba(255, 215, 0, 0.4)',
              border: '2px solid rgba(255, 215, 0, 0.6)',
            }}
          />
        )}

        {combo >= 20 && (
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none animate-rainbow-border"
            style={{
              padding: '3px',
              background: 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)',
              backgroundSize: '400% 400%',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
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
            isShaking ? 'animate-shake' : ''
          } ${combo >= 20 ? 'animate-shake-intense' : combo > 5 ? 'animate-shake-subtle' : ''}`}
          style={{
            transform: scalePulse ? 'scale(1.3)' : 'scale(1)',
          }}
        >
          <span
            className={`${numberSize} font-black tracking-tight ${
              combo >= 20 ? 'animate-rainbow-text' : ''
            }`}
            style={{
              fontFamily: '"Cinzel Decorative", serif',
              background: combo >= 20
                ? 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)'
                : `linear-gradient(135deg, ${colors.gradient[0]}, ${colors.gradient[1]})`,
              backgroundSize: combo >= 20 ? '400% 400%' : '100% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: combo >= 20
                ? 'drop-shadow(0 0 25px rgba(255, 215, 0, 0.9))'
                : `drop-shadow(0 0 15px ${colors.primary}80)`,
              animation: combo >= 20 ? 'rainbowShift 2s linear infinite' : undefined,
            }}
          >
            {combo}
          </span>
          {combo > 0 && (
            <span
              className="absolute -right-8 -top-2 text-sm font-bold"
              style={{
                fontFamily: '"Cinzel Decorative", serif',
                color: colors.primary,
                textShadow: `0 0 8px ${colors.primary}`,
              }}
            >
              连击
            </span>
          )}
        </div>

        {comboText && (
          <div
            className="mt-1 text-lg font-bold animate-pulse"
            style={{
              fontFamily: '"Cinzel Decorative", serif',
              background: combo >= 20
                ? 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)'
                : `linear-gradient(135deg, ${colors.gradient[0]}, ${colors.gradient[1]})`,
              backgroundSize: combo >= 20 ? '400% 400%' : '100% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: combo >= 20 ? 'rainbowShift 2s linear infinite' : undefined,
              textShadow: `0 0 10px ${colors.primary}60`,
            }}
          >
            {comboText}
          </div>
        )}

        {combo > 0 && (
          <div
            className="mt-2 px-4 py-1 rounded-full text-sm font-bold"
            style={{
              fontFamily: '"Cinzel Decorative", serif',
              backgroundColor: `${colors.primary}25`,
              color: colors.primary,
              border: `1px solid ${colors.primary}50`,
              boxShadow: `0 0 15px ${colors.primary}30`,
              textShadow: `0 0 6px ${colors.primary}`,
            }}
          >
            {multiplier}x 倍率
          </div>
        )}

        <div className="mt-3 text-center">
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

      <style>{`
        @keyframes ringRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-ring-rotate {
          animation: ringRotate 3s linear infinite;
        }

        @keyframes goldenFlash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-golden-flash {
          animation: goldenFlash 0.2s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shakeSubtle {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        .animate-shake-subtle {
          animation: shakeSubtle 0.3s ease-in-out infinite;
        }

        @keyframes shakeIntense {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(-3px, -2px) rotate(-1deg); }
          40% { transform: translate(3px, 2px) rotate(1deg); }
          60% { transform: translate(-3px, 2px) rotate(-1deg); }
          80% { transform: translate(3px, -2px) rotate(1deg); }
        }
        .animate-shake-intense {
          animation: shakeIntense 0.2s ease-in-out infinite;
        }

        @keyframes comboBreak {
          0% {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          30% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          70% {
            opacity: 1;
            transform: translate(-50%, -10px);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -30px);
          }
        }
        .animate-combo-break {
          animation: comboBreak 1s ease-out forwards;
        }

        @keyframes rainbowShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 400% 50%; }
        }
        .animate-rainbow-text {
          animation: rainbowShift 2s linear infinite;
        }
      `}</style>
    </div>
  )
}
