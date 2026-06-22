/**
 * ============================================================
 *  useCountdown Hook
 * ============================================================
 *
 *  依赖关系：零依赖，纯 React Hook
 *  数据流向：接收总时长和启动信号 → requestAnimationFrame 逐帧计算剩余时间
 *           → 返回剩余毫秒数和状态
 *
 *  引用此 Hook 的组件：
 *  - src/components/BuzzerPage.tsx (抢答倒计时、答题倒计时)
 *
 *  性能特点：
 *  - 使用 requestAnimationFrame 驱动，毫秒级精度
 *  - 基于时间戳计算，避免 setInterval 累积误差
 *  - 自动清理，避免内存泄漏
 * ============================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseCountdownOptions {
  duration: number
  autoStart?: boolean
  onComplete?: () => void
  onTick?: (remainingMs: number) => void
}

interface UseCountdownReturn {
  remainingMs: number
  isRunning: boolean
  isCompleted: boolean
  start: () => void
  stop: () => void
  reset: (newDuration?: number) => void
}

export function useCountdown(options: UseCountdownOptions): UseCountdownReturn {
  const { duration, autoStart = false, onComplete, onTick } = options

  const [remainingMs, setRemainingMs] = useState<number>(duration)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [isCompleted, setIsCompleted] = useState<boolean>(false)

  const startTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const onCompleteRef = useRef<typeof onComplete>(onComplete)
  const onTickRef = useRef<typeof onTick>(onTick)
  const durationRef = useRef<number>(duration)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    onTickRef.current = onTick
  }, [onTick])

  useEffect(() => {
    durationRef.current = duration
  }, [duration])

  const tick = useCallback(() => {
    const now = performance.now()
    const elapsed = now - startTimeRef.current
    const remaining = Math.max(0, durationRef.current - elapsed)

    setRemainingMs(remaining)
    onTickRef.current?.(remaining)

    if (remaining <= 0) {
      setIsRunning(false)
      setIsCompleted(true)
      animationFrameRef.current = null
      onCompleteRef.current?.()
      return
    }

    animationFrameRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(() => {
    if (isRunning) return

    startTimeRef.current = performance.now() - (durationRef.current - remainingMs)
    setIsRunning(true)
    setIsCompleted(false)
    animationFrameRef.current = requestAnimationFrame(tick)
  }, [isRunning, remainingMs, tick])

  const stop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setIsRunning(false)
  }, [])

  const reset = useCallback((newDuration?: number) => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (newDuration !== undefined) {
      durationRef.current = newDuration
      setRemainingMs(newDuration)
    } else {
      setRemainingMs(durationRef.current)
    }
    setIsRunning(false)
    setIsCompleted(false)
  }, [])

  useEffect(() => {
    if (autoStart && !isRunning && !isCompleted) {
      start()
    }
  }, [autoStart, isRunning, isCompleted, start])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return {
    remainingMs,
    isRunning,
    isCompleted,
    start,
    stop,
    reset,
  }
}
