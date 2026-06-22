import { useEffect, useRef, useCallback } from 'react'
import { useTimerStore } from '../store/timerStore'

export const useTimer = () => {
  const isRunning = useTimerStore((state) => state.isRunning)
  const isPaused = useTimerStore((state) => state.isPaused)
  const elapsedSeconds = useTimerStore((state) => state.elapsedSeconds)
  const targetDuration = useTimerStore((state) => state.targetDuration)
  const tick = useTimerStore((state) => state.tick)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        const shouldContinue = tick()
        if (!shouldContinue) {
          clearTimer()
        }
      }, 1000)
    } else {
      clearTimer()
    }

    return clearTimer
  }, [isRunning, isPaused, tick, clearTimer])

  const remainingSeconds = Math.max(0, targetDuration - elapsedSeconds)

  return {
    isRunning,
    isPaused,
    elapsedSeconds,
    targetDuration,
    remainingSeconds,
  }
}
