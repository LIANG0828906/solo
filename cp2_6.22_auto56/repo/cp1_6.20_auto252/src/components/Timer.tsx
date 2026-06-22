import { useState, useEffect, useRef, useCallback } from 'react'

interface TimerProps {
  roomId: string
  userId: string
  onLeave: () => void
}

type TimerMode = 'idle' | 'focus' | 'break'

const FOCUS_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60

export default function Timer({ roomId, userId, onLeave }: TimerProps) {
  const [mode, setMode] = useState<TimerMode>('idle')
  const [remaining, setRemaining] = useState(FOCUS_SECONDS)
  const [total, setTotal] = useState(FOCUS_SECONDS)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (tickRef.current) clearInterval(tickRef.current)
    intervalRef.current = null
    tickRef.current = null
  }, [])

  const startFocus = useCallback(async () => {
    clearTimers()
    setMode('focus')
    setTotal(FOCUS_SECONDS)
    setRemaining(FOCUS_SECONDS)

    await fetch(`/api/rooms/${roomId}/focus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, focusing: true }),
    })

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearTimers()
          setMode('break')
          setTotal(BREAK_SECONDS)
          setRemaining(BREAK_SECONDS)
          fetch(`/api/rooms/${roomId}/focus`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, focusing: false }),
          })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    tickRef.current = setInterval(() => {
      fetch(`/api/rooms/${roomId}/tick?userId=${userId}`, { method: 'POST' }).catch(() => {})
    }, 1000)
  }, [roomId, userId, clearTimers])

  const startBreak = useCallback(async () => {
    clearTimers()
    setMode('break')
    setTotal(BREAK_SECONDS)
    setRemaining(BREAK_SECONDS)

    await fetch(`/api/rooms/${roomId}/focus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, focusing: false }),
    })

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearTimers()
          setMode('idle')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [roomId, userId, clearTimers])

  const stopTimer = useCallback(async () => {
    clearTimers()
    setMode('idle')
    setRemaining(FOCUS_SECONDS)
    setTotal(FOCUS_SECONDS)

    await fetch(`/api/rooms/${roomId}/focus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, focusing: false }),
    })
  }, [roomId, userId, clearTimers])

  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const radius = 120
  const stroke = 12
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const progress = total > 0 ? remaining / total : 1
  const strokeDashoffset = circumference * (1 - progress)

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60

  const gradientId = mode === 'break' ? 'break-gradient' : 'focus-gradient'

  const modeLabel = mode === 'focus' ? '专注中' : mode === 'break' ? '休息中' : '准备开始'

  return (
    <div className="timer-container">
      <div className="timer-mode-label">{modeLabel}</div>

      <svg
        className="timer-svg"
        width={radius * 2}
        height={radius * 2}
      >
        <defs>
          <linearGradient id="focus-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3f51b5" />
            <stop offset="100%" stopColor="#7986cb" />
          </linearGradient>
          <linearGradient id="break-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffcc80" />
            <stop offset="100%" stopColor="#ffcc80" />
          </linearGradient>
        </defs>

        <circle
          className="timer-bg-circle"
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          strokeWidth={stroke}
        />

        <circle
          className="timer-progress-circle"
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          strokeWidth={stroke}
          stroke={`url(#${gradientId})`}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${radius} ${radius})`}
        />

        <text
          className="timer-text"
          x={radius}
          y={radius}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </text>
      </svg>

      <div className="timer-buttons">
        <button className="btn btn-focus" onClick={startFocus} disabled={mode === 'focus'}>
          开始专注
        </button>
        <button className="btn btn-break" onClick={mode === 'break' ? stopTimer : startBreak} disabled={mode === 'idle' && remaining === FOCUS_SECONDS && false}>
          {mode === 'break' ? '结束休息' : '休息'}
        </button>
        <button className="btn btn-leave" onClick={mode !== 'idle' ? stopTimer : onLeave}>
          {mode !== 'idle' ? '停止' : '退出房间'}
        </button>
      </div>
    </div>
  )
}
