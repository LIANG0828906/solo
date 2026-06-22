import React, { useMemo } from 'react'

interface RingProgressProps {
  percentage: number
  size?: number
  strokeWidth?: number
}

const RingProgress: React.FC<RingProgressProps> = ({
  percentage,
  size = 160,
  strokeWidth = 14,
}) => {
  const safePercentage = Math.max(0, Math.min(100, percentage))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const isEmpty = safePercentage <= 0

  const dashOffset = useMemo(() => {
    if (isEmpty) return circumference + 1
    return circumference - (safePercentage / 100) * circumference
  }, [safePercentage, circumference, isEmpty])

  const dashArray = useMemo(() => {
    if (isEmpty) return '0 ' + circumference
    return `${circumference} ${circumference}`
  }, [circumference, isEmpty])

  const gradientId = `ring-gradient-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#334155"
          strokeWidth={strokeWidth}
        />
        {!isEmpty && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#FFFFFF',
            lineHeight: 1,
          }}
        >
          {safePercentage}%
        </div>
        <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
          完成率
        </div>
      </div>
    </div>
  )
}

export default RingProgress
