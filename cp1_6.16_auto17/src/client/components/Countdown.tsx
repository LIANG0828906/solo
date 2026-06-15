import { useState, useEffect } from 'react'

interface CountdownProps {
  endTime: number
  className?: string
}

export default function Countdown({ endTime, className = '' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<number>(() => endTime - Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(endTime - Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  if (timeLeft <= 0) {
    return <span className={className}>拍卖已结束</span>
  }

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

  const isUrgent = timeLeft <= 10000

  const timeText = days > 0
    ? `${days}天${hours}时${minutes}分${seconds}秒`
    : `${hours}时${minutes}分${seconds}秒`

  return (
    <span className={`${className} ${isUrgent ? 'countdown-urgent' : ''}`}>
      {timeText}
    </span>
  )
}
