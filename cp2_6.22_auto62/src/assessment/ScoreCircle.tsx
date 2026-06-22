import { useState, useEffect } from 'react'

interface ScoreCircleProps {
  score: number
  passed: number
  total: number
}

const RADIUS = 45
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ScoreCircle({ score, passed, total }: ScoreCircleProps) {
  const [animated, setAnimated] = useState(false)
  const offset = animated
    ? CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE
    : CIRCUMFERENCE

  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setAnimated(true)
    })
    return () => cancelAnimationFrame(timer)
  }, [])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="#ff7f50"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{
              transition: 'stroke-dashoffset 1.2s ease-out',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold" style={{ color: '#1a3a5c' }}>{score}</span>
        </div>
      </div>
      <div className="text-sm text-gray-500">
        <span className="font-semibold" style={{ color: '#1a3a5c' }}>{passed}</span>
        <span className="mx-1">/</span>
        <span>{total}</span>
        <span className="ml-1">通过</span>
      </div>
    </div>
  )
}
