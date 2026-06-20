import React, { useState, useEffect, useRef, useCallback } from 'react'
import TimerDisplay from './TimerDisplay'
import TimerControls from './TimerControls'
import { usePomodoroStore } from '../../store/usePomodoroStore'

const TimerManager: React.FC = () => {
  const {
    settings,
    currentTagId,
    timerStatus,
    setTimerStatus,
    logSession,
    setShowModal,
  } = usePomodoroStore()

  const [remainingTime, setRemainingTime] = useState(settings.workDuration * 60)
  const [isBreak, setIsBreak] = useState(false)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)
  const totalDurationRef = useRef<number>(settings.workDuration * 60)

  useEffect(() => {
    if (timerStatus === 'idle') {
      const duration = settings.workDuration * 60
      setRemainingTime(duration)
      totalDurationRef.current = duration
      setIsBreak(false)
    }
  }, [settings.workDuration, timerStatus])

  const tick = useCallback(() => {
    const now = performance.now()
    const elapsed = (now - startTimeRef.current) / 1000
    const remaining = Math.max(0, totalDurationRef.current - elapsed)

    setRemainingTime(remaining)

    if (remaining <= 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      if (!isBreak && currentTagId) {
        logSession(currentTagId, Math.round(totalDurationRef.current / 60))
        setTimerStatus('idle')
      } else {
        setTimerStatus('idle')
        setIsBreak(false)
        const workDuration = settings.workDuration * 60
        setRemainingTime(workDuration)
        totalDurationRef.current = workDuration
      }
      return
    }

    animationFrameRef.current = requestAnimationFrame(tick)
  }, [isBreak, currentTagId, logSession, setTimerStatus, settings.workDuration])

  useEffect(() => {
    if (timerStatus === 'running' || timerStatus === 'breakRunning') {
      startTimeRef.current = performance.now() - (totalDurationRef.current - remainingTime) * 1000
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [timerStatus, tick])

  const handleStart = () => {
    if (timerStatus === 'break' || timerStatus === 'breakRunning') {
      setTimerStatus('breakRunning')
    } else {
      setTimerStatus('running')
    }
  }

  const handlePause = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    pausedTimeRef.current = remainingTime
    if (isBreak || timerStatus === 'breakRunning') {
      setTimerStatus('break')
    } else {
      setTimerStatus('paused')
    }
  }

  const handleReset = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setShowModal(false)
    const duration = settings.workDuration * 60
    setRemainingTime(duration)
    totalDurationRef.current = duration
    setIsBreak(false)
    setTimerStatus('idle')
  }

  const handleStartBreak = useCallback(() => {
    setShowModal(false)
    const breakDuration = settings.breakDuration * 60
    setRemainingTime(breakDuration)
    totalDurationRef.current = breakDuration
    setIsBreak(true)
    setTimerStatus('breakRunning')
  }, [settings.breakDuration, setShowModal, setTimerStatus])

  const handleContinueWork = useCallback(() => {
    setShowModal(false)
    const workDuration = settings.workDuration * 60
    setRemainingTime(workDuration)
    totalDurationRef.current = workDuration
    setIsBreak(false)
    setTimerStatus('running')
  }, [settings.workDuration, setShowModal, setTimerStatus])

  const label = isBreak ? '休息中' : '专注中'
  const displayStatus = isBreak
    ? (timerStatus === 'breakRunning' ? 'breakRunning' : 'break')
    : timerStatus

  return (
    <>
      <TimerDisplay
        remainingTime={remainingTime}
        totalDuration={totalDurationRef.current}
        label={label}
        isBreak={isBreak}
      />
      <TimerControls
        status={displayStatus as any}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
      />
      <CompletionModal onStartBreak={handleStartBreak} onContinue={handleContinueWork} />
    </>
  )
}

const CompletionModal: React.FC<{
  onStartBreak: () => void
  onContinue: () => void
}> = ({ onStartBreak, onContinue }) => {
  const { showModal, completedSession, tags, setShowModal } = usePomodoroStore()

  if (!showModal || !completedSession) return null

  const tag = tags.find((t) => t.id === completedSession.tagId)

  return (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-congrats">🎉 恭喜完成一个番茄钟！</div>
        {tag && (
          <div className="modal-tag">
            <span
              className="modal-tag-dot"
              style={{ backgroundColor: tag.color }}
            />
            {tag.name}
          </div>
        )}
        <div className="modal-session">
          今日第 {completedSession.sessionNumber} 个番茄钟
        </div>
        <div className="modal-actions">
          <button className="btn btn-info" onClick={onStartBreak}>
            开始5分钟休息
          </button>
          <button className="btn btn-muted" onClick={onContinue}>
            继续工作
          </button>
        </div>
      </div>
    </div>
  )
}

export default TimerManager
