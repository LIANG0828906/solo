import { useEffect, useState, useRef } from 'react'

interface Props {
  progress: number
  size?: number
  strokeWidth?: number
  label?: string
}

export default function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  label
}: Props) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const animRef = useRef<number>(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - animatedProgress / 100)

  useEffect(() => {
    const duration = 1200
    const startTime = performance.now()
    const startValue = animatedProgress

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progressRatio = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progressRatio, 3)
      const currentValue = startValue + (progress - startValue) * easeOut
      setAnimatedProgress(currentValue)

      if (progressRatio < 1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }

    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [progress])

  return (
    <div className="progress-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={`ringGrad-${size}-${strokeWidth}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#764ba2" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f093fb" stopOpacity="0.7" />
          </linearGradient>
          <filter id={`ringShadow-${size}`}>
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#667eea" floodOpacity="0.3" />
          </filter>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ringGrad-${size}-${strokeWidth})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          filter={`url(#ringShadow-${size})`}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>
      <span className="progress-ring-text">
        {label ?? `${Math.round(animatedProgress)}%`}
      </span>
    </div>
  )
}
