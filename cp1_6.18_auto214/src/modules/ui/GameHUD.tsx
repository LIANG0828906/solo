import React, { useState, useEffect } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { gameEngine } from '@/modules/game/GameEngine'

export const GameHUD: React.FC = () => {
  const unlockedCount = useGameStore(state => state.unlockedCount)
  const totalConstellations = useGameStore(state => state.totalConstellations)
  const [isHoveringReset, setIsHoveringReset] = useState(false)
  const [resetRotation, setResetRotation] = useState(0)

  const progress = unlockedCount / totalConstellations
  const circumference = 2 * Math.PI * 18
  const strokeDashoffset = circumference * (1 - progress)

  useEffect(() => {
    if (isHoveringReset) {
      setResetRotation(30)
    } else {
      setResetRotation(0)
    }
  }, [isHoveringReset])

  const handleReset = () => {
    gameEngine.resetGame()
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 p-6 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-6 pointer-events-auto">
        <div className="relative">
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="#333333"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="#FFD700"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 20 20)"
              style={{
                transition: 'stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
            <circle
              cx="20"
              cy="20"
              r="15"
              fill="#333333"
              style={{
                transition: 'fill 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
            <circle
              cx="20"
              cy="20"
              r="15"
              fill="#FFD700"
              style={{
                opacity: progress,
                transition: 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            />
            {progress > 0 && (
              <circle
                cx="20"
                cy="20"
                r="15"
                fill="none"
                stroke="#FFD700"
                strokeWidth="1"
                style={{
                  opacity: 0.5
                }}
              />
            )}
          </svg>
        </div>

        <div>
          <div
            className="text-2xl font-bold tracking-wider"
            style={{ color: '#FFD700' }}
          >
            已解锁 {unlockedCount}/{totalConstellations}
          </div>
          <div className="text-gray-500 text-sm">
            拖拽恒星连接星座
          </div>
        </div>
      </div>

      <button
        onClick={handleReset}
        onMouseEnter={() => setIsHoveringReset(true)}
        onMouseLeave={() => setIsHoveringReset(false)}
        className="w-10 h-10 rounded-full flex items-center justify-center pointer-events-auto transition-all duration-200"
        style={{
          background: isHoveringReset ? '#FF4444' : '#222222',
          transform: `rotate(${resetRotation}deg)`,
          boxShadow: isHoveringReset ? '0 0 20px rgba(255, 68, 68, 0.5)' : 'none'
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: '#FFFFFF' }}
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  )
}
