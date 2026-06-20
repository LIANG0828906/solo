import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Coffee, Brain, Zap } from 'lucide-react'
import { useAppStore } from '@/store/app'
import { createTimerSession } from '@/lib/api'
import { formatMMSS, todayISO, clamp } from '@/lib/date'
import type { TimerType } from '@/types'

const typeLabels: Record<TimerType, { label: string; icon: typeof Play; color: string }> = {
  focus: { label: '专注', icon: Brain, color: '#5B9BD5' },
  shortBreak: { label: '短休息', icon: Coffee, color: '#F4D03F' },
  longBreak: { label: '长休息', icon: Zap, color: '#8CD092' },
}

function playBeep() {
  try {
    const AudioCtx =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(880, ctx.currentTime)
    o.frequency.setValueAtTime(660, ctx.currentTime + 0.15)
    o.frequency.setValueAtTime(880, ctx.currentTime + 0.3)
    g.gain.setValueAtTime(0.0001, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7)
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + 0.72)
  } catch {
    /* ignore */
  }
}

export default function PomodoroTimer() {
  const { settings, addTimerSession, timerSessions } = useAppStore()
  const [type, setType] = useState<TimerType>('focus')
  const [seconds, setSeconds] = useState(settings.focusDuration * 60)
  const [running, setRunning] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const startedAtRef = useRef<string | null>(null)
  const intervalRef = useRef<number | null>(null)

  const totalSeconds = useMemo(() => {
    if (type === 'focus') return settings.focusDuration * 60
    if (type === 'shortBreak') return settings.shortBreakDuration * 60
    return settings.longBreakDuration * 60
  }, [type, settings])

  useEffect(() => {
    if (!running) setSeconds(totalSeconds)
  }, [type, totalSeconds, running])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }
    intervalRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          onFinish()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  async function onFinish() {
    setRunning(false)
    playBeep()
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 3400)
    const now = new Date().toISOString()
    const duration =
      type === 'focus' ? settings.focusDuration : type === 'shortBreak' ? settings.shortBreakDuration : settings.longBreakDuration
    try {
      const session = await createTimerSession({
        duration,
        startedAt: startedAtRef.current || now,
        completedAt: now,
        type,
      })
      addTimerSession(session)
    } catch {
      /* ignore */
    }
  }

  function handleStart() {
    if (!running) {
      startedAtRef.current = new Date().toISOString()
      if (seconds === 0) setSeconds(totalSeconds)
    }
    setRunning((r) => !r)
  }

  function handleReset() {
    setRunning(false)
    setSeconds(totalSeconds)
    startedAtRef.current = null
  }

  const progress = clamp(1 - seconds / totalSeconds, 0, 1)
  const radius = 100
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)
  const ringColor = typeLabels[type].color
  const todayFocusMinutes = timerSessions
    .filter((s) => s.type === 'focus' && s.completedAt.startsWith(todayISO()))
    .reduce((acc, s) => acc + s.duration, 0)

  return (
    <section className="relative flex h-full flex-col items-center rounded-card bg-white p-6 shadow-card animate-fadeInUp stagger-2">
      {showFlash && <div className="timer-flash-overlay" />}
      <header className="mb-2 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-sea-blue-900">番茄钟</h2>
            <p className="mt-0.5 text-xs text-sea-blue-500">
              今日已专注 {todayFocusMinutes} 分钟 · 目标 {settings.dailyGoal} 个番茄
            </p>
          </div>
          <div className="flex gap-1 rounded-btn bg-sea-blue-50 p-1">
            {(Object.keys(typeLabels) as TimerType[]).map((k) => {
              const cfg = typeLabels[k]
              const Icon = cfg.icon
              const active = type === k
              return (
                <button
                  key={k}
                  onClick={() => {
                    if (running) return
                    setType(k)
                  }}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition ${
                    active
                      ? 'bg-white text-sea-blue-700 shadow-sm'
                      : 'text-sea-blue-500 hover:text-sea-blue-700'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <div className="relative my-6 grid place-items-center">
        <svg
          className="timer-ring -rotate-90"
          width="260"
          height="260"
          viewBox="0 0 240 240"
        >
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="#EEF5FC"
            strokeWidth="14"
          />
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.8s linear, stroke 0.4s' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-5xl font-semibold tracking-tight text-sea-blue-900">
              {formatMMSS(seconds)}
            </p>
            <p className="mt-2 text-xs text-sea-blue-500">
              {typeLabels[type].label}中 · {Math.round(progress * 100)}%
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-3">
        <button onClick={handleReset} className="btn-ghost inline-flex items-center gap-1.5">
          <RotateCcw className="h-4 w-4" />
          重置
        </button>
        <button
          onClick={handleStart}
          className="btn-primary inline-flex items-center gap-1.5 px-6"
        >
          {running ? (
            <>
              <Pause className="h-4 w-4" />
              暂停
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              {seconds === totalSeconds ? '开始' : '继续'}
            </>
          )}
        </button>
      </div>
    </section>
  )
}
