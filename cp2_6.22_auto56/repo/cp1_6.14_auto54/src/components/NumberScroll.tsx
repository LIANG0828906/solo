import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface NumberScrollProps {
  value: number
  decimals?: number
  className?: string
  duration?: number
}

export default function NumberScroll({
  value,
  decimals = 0,
  className,
  duration = 1500,
}: NumberScrollProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const startValueRef = useRef(0)

  useEffect(() => {
    const startValue = startValueRef.current
    const endValue = value
    startTimeRef.current = null

    const easeOutExpo = (t: number): number => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    }

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutExpo(progress)
      const currentValue = startValue + (endValue - startValue) * easedProgress

      setDisplayValue(currentValue)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        startValueRef.current = endValue
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [value, duration])

  const formatValue = (num: number): string => {
    return num.toFixed(decimals)
  }

  return (
    <span className={cn('tabular-nums', className)}>
      {formatValue(displayValue)}
    </span>
  )
}
