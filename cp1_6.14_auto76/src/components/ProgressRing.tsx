import { useEffect, useState } from 'react'

interface Props {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
}

export default function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  color = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  label
}: Props) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - animatedProgress / 100)

  useEffect(() => {
    const duration = 1000
    const startTime = performance.now()
    const startValue = animatedProgress

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progressRatio = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progressRatio, 3)
      const currentValue = startValue + (progress - startValue) * easeOut
      setAnimatedProgress(currentValue)

      if (progressRatio < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [progress])

  return (
    <div className="progress-ring-container">
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={`ringGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy