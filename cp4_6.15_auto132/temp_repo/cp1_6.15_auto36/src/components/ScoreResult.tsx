import React, { useEffect, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { ELEMENT_COLORS, ELEMENT_NAMES } from '../../shared/types'
import { Sparkles, AlertCircle, CheckCircle, Star } from 'lucide-react'

export const ScoreResult: React.FC = () => {
  const { lastScoreResult, clearLastResult, currentElement, combo } = useGameStore()
  const [visible, setVisible] = useState(false)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (lastScoreResult) {
      setVisible(true)
      setKey((k) => k + 1)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(() => clearLastResult(), 400)
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [lastScoreResult])

  if (!lastScoreResult || !visible) return null

  const isSuccess = lastScoreResult.matchQuality !== 'fail'
  const isPerfect = lastScoreResult.matchQuality === 'perfect'
  const colors = ELEMENT_COLORS[currentElement]

  return (
    <div
      key={key}
      className="pointer-events-none absolute inset-0 flex items-center justify-center z-30"
    >
      <div className="animate-score-float-up">
        <div
          className="relative px-10 py-6 rounded-3xl backdrop-blur-xl border-2 text-center"
          style={{
            background: isPerfect
              ? `linear-gradient(145deg, rgba(255,215,0,0.2), ${colors.primary}20)`
              : isSuccess
              ? `linear-gradient(145deg, ${colors.primary}25, ${colors.primary}08)`
              : 'linear-gradient(145deg, rgba(255,68,68,0.2), rgba(255,68,68,0.05))',
            borderColor: isPerfect
              ? 'rgba(255,215,0,0.5)'
              : isSuccess
              ? `${colors.primary}50`
              : 'rgba(255,68,68,0.4)',
            boxShadow: isPerfect
              ? `0 0 60px rgba(255,215,0,0.35), inset 0 0 40px rgba(255,215,0,0.15)`
              : isSuccess
              ? `0 0 40px ${colors.primary}35, inset 0 0 25px ${colors.primary}15`
              : '0 0 30px rgba(255,68,68,0.2)',
          }}
        >
          {isPerfect && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div
                className="px-4 py-1 rounded-full text-xs font-black flex items-center gap-1 animate-bounce-short"
                style={{
                  background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                  color: '#1a0a2e',
                  boxShadow: '0 0 20px rgba(255,215,0,0.6)',
                }}
              >
                <Star className="w-3 h-3 fill-current" />
                完美释放 x2
                <Star className="w-3 h-3 fill-current" />
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mb-3">
            <div
              className="animate-bounce-short"
              style={{
                color: isPerfect
                  ? '#ffd700'
                  : isSuccess
                  ? colors.primary
                  : '#ff4444',
                filter: `drop-shadow(0 0 12px currentColor)`,
              }}
            >
              {isPerfect ? (
                <Sparkles className="w-8 h-8" />
              ) : isSuccess ? (
                <CheckCircle className="w-8 h-8" />
              ) : (
                <AlertCircle className="w-8 h-8" />
              )}
            </div>
          </div>

          <div
            className="text-7xl font-black mb-3 tracking-tighter"
            style={{
              fontFamily: '"Cinzel Decorative", serif',
              color: isPerfect
                ? '#ffd700'
                : isSuccess
                ? colors.primary
                : '#ff6666',
              textShadow: isPerfect
                ? `0 0 40px rgba(255,215,0,0.8), 0 0 80px rgba(255,215,0,0.4)`
                : isSuccess
                ? `0 0 30px ${colors.primary}80`
                : '0 0 20px rgba(255,102,102,0.5)',
            }}
          >
            {lastScoreResult.score}
            <span className="text-3xl align-top ml-1 opacity-70">%</span>
          </div>

          <div
            className="text-sm font-bold mb-1"
            style={{
              color: isSuccess ? colors.primary : '#ff6666',
              fontFamily: '"Cinzel Decorative", serif',
            }}
          >
            {ELEMENT_NAMES[currentElement]}符咒
          </div>

          <p className="text-sm text-white/80 max-w-xs leading-relaxed">
            {lastScoreResult.message}
          </p>

          {combo > 1 && isSuccess && (
            <div
              className="mt-3 text-xs font-bold inline-flex items-center gap-1 px-3 py-1 rounded-full"
              style={{
                backgroundColor: `${colors.primary}25`,
                color: colors.primary,
              }}
            >
              🔥 连击 x{combo}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
