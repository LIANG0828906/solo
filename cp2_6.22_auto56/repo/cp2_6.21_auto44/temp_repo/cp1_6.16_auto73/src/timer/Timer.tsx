import { useEffect, useRef, useCallback } from 'react'
import { useAppState } from '../store/AppState'

export function useTimer() {
  const {
    timerMode, setTimerMode,
    focusDuration, breakDuration,
    currentTimeLeft, setCurrentTimeLeft,
    currentUser, updateUserStatus, addFocusMinutes,
    setShowSummary, setLastSessionMinutes
  } = useAppState()

  const startTimeRef = useRef<number>(0)
  const durationRef = useRef<number>(0)
  const rafIdRef = useRef<number>(0)
  const lastSessionAccumRef = useRef<number>(0)

  const tick = useCallback(() => {
    if (timerMode === 'idle') return
    const elapsed = (performance.now() - startTimeRef.current) / 1000
    const remaining = Math.max(0, durationRef.current - elapsed)
    setCurrentTimeLeft(remaining)

    if (remaining <= 0) {
      if (timerMode === 'focus') {
        const minutes = Math.round(focusDuration / 60)
        lastSessionAccumRef.current = minutes
        if (currentUser) {
          addFocusMinutes(currentUser.id, minutes)
        }
        setLastSessionMinutes(minutes)
        setTimerMode('break')
        updateUserStatus(currentUser?.id || '', 'resting')
        startTimeRef.current = performance.now()
        durationRef.current = breakDuration
        setCurrentTimeLeft(breakDuration)
      } else if (timerMode === 'break') {
        setTimerMode('idle')
        updateUserStatus(currentUser?.id || '', 'offline')
        setCurrentTimeLeft(focusDuration)
        setShowSummary(true)
      }
      return
    }
    rafIdRef.current = requestAnimationFrame(tick)
  }, [timerMode, focusDuration, breakDuration, currentUser, addFocusMinutes, setCurrentTimeLeft, setLastSessionMinutes, setTimerMode, updateUserStatus, setShowSummary])

  useEffect(() => {
    if (timerMode === 'focus' || timerMode === 'break') {
      startTimeRef.current = performance.now()
      durationRef.current = timerMode === 'focus' ? focusDuration : breakDuration
      setCurrentTimeLeft(durationRef.current)
      rafIdRef.current = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(rafIdRef.current)
    }
  }, [timerMode])

  const startFocus = useCallback(() => {
    updateUserStatus(currentUser?.id || '', 'focusing')
    setTimerMode('focus')
  }, [currentUser?.id, setTimerMode, updateUserStatus])

  const exitMode = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current)
    if (timerMode === 'focus' && currentUser) {
      const elapsed = (performance.now() - startTimeRef.current) / 1000
      const minutes = Math.max(1, Math.round(elapsed / 60))
      if (minutes >= 5) {
        lastSessionAccumRef.current = minutes
        addFocusMinutes(currentUser.id, minutes)
        setLastSessionMinutes(minutes)
      }
    }
    updateUserStatus(currentUser?.id || '', 'offline')
    setTimerMode('idle')
    setCurrentTimeLeft(focusDuration)
  }, [timerMode, currentUser, focusDuration, addFocusMinutes, setLastSessionMinutes, setTimerMode, updateUserStatus, setCurrentTimeLeft])

  return {
    timerMode,
    currentTimeLeft,
    focusDuration,
    breakDuration,
    startFocus,
    exitMode
  }
}
