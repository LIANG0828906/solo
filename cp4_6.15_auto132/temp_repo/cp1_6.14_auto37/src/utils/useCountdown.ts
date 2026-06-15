import { useRef, useEffect, useState } from 'react'

interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
  timeLevel: 'far' | 'medium' | 'soon'
}

export function useCountdown(targetDate: string): CountdownResult {
  const [countdown, setCountdown] = useState<CountdownResult>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    timeLevel: 'far',
  })

  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const calculate = () => {
      const now = new Date().getTime()
      const target = new Date(targetDate).getTime()
      const diff = target - now

      if (diff <= 0) {
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          timeLevel: 'soon',
        })
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      let timeLevel: 'far' | 'medium' | 'soon' = 'far'
      if (days < 1) {
        timeLevel = 'soon'
      } else if (days <= 7) {
        timeLevel = 'medium'
      }

      setCountdown({ days, hours, minutes, seconds, isExpired: false, timeLevel })
    }

    calculate()
    timerRef.current = window.setInterval(calculate, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [targetDate])

  return countdown
}
