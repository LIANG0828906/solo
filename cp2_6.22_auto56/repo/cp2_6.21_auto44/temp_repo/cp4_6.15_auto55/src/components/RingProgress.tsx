import React from 'react'
import { cn } from '@/lib/utils'

interface RingProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
  ringColor?: string
}

function RingProgress({ percentage, size = 60, strokeWidth = 6, ringColor }: RingProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference
  const color = ringColor ?? (percentage > 70 ? '#FFD700' : '#2C5F3B')

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span
        className={cn('absolute text-xs font-bold')}
        style={{ color }}
      >
        {percentage}%
      </span>
    </div>
  )
}

export default React.memo(RingProgress)
