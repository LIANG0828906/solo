import { useMemo, useCallback, useState, useEffect } from 'react'
import { useTimer } from '../hooks/useTimer'
import { useTimerStore } from '../store/timerStore'
import '../styles.css'

interface CompleteModalProps {
  totalMinutes: number
  onClose: () => void
}

const CompleteModal = ({ totalMinutes, onClose }: CompleteModalProps) => {
  const [visible, setVisible] = useState(true)

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 300)
  }, [onClose])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [handleClose])

  if (!visible) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
      >
        <button className="modal-close" onClick={handleClose}>
          ✕
        </button>
        <h2 className="modal-title">🎉 专注完成！</h2>
        <p className="modal-message">
          今日已完成 <strong style={{ color: '#2ECC71' }}>{totalMinutes}</strong>{' '}
          分钟专注。继续保持，你做得很棒！
        </p>
        <div className="modal-actions">
          <button className="modal-btn confirm" onClick={handleClose}>
            知道了
          </button>
        </div>
      </div>
    </div>
  )
}

const playCompletionSound = () => {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    const ctx = new AudioCtx()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(440, ctx.currentTime)

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
  } catch {
    // ignore audio errors
  }
}

export const TimerPanel = () => {
  const { isRunning, isPaused, remainingSeconds, targetDuration, elapsedSeconds } =
    useTimer()

  const targetMinutes = useTimerStore((state) => state.targetDuration)
  const setTargetDuration = useTimerStore((state) => state.setTargetDuration)
  const startTimer = useTimerStore((state) => state.startTimer)
  const pauseTimer = useTimerStore((state) => state.pauseTimer)
  const resetTimer = useTimerStore((state) => state.resetTimer)
  const dailyFocusMinutes = useTimerStore((state) => state.dailyFocusMinutes)

  const [customMinutes, setCustomMinutes] = useState<string>('')
  const [selectedPreset, setSelectedPreset] = useState<number>(25)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [prevIsRunning, setPrevIsRunning] = useState(false)

  const todayKey = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
  }, [])

  const todayTotalMinutes = useMemo(
    () => dailyFocusMinutes[todayKey] || 0,
    [dailyFocusMinutes, todayKey]
  )

  useEffect(() => {
    if (prevIsRunning && !isRunning && elapsedSeconds === 0 && targetDuration > 0) {
      playCompletionSound()
      setShowCompleteModal(true)
    }
    setPrevIsRunning(isRunning)
  }, [isRunning, prevIsRunning, elapsedSeconds, targetDuration])

  const displayTime = useMemo(() => {
    const mins = Math.floor(remainingSeconds / 60)
    const secs = remainingSeconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }, [remainingSeconds])

  const timerColor = useMemo(() => {
    if (!isRunning && elapsedSeconds === 0) return '#FFFFFF'
    const progress = targetDuration > 0 ? elapsedSeconds / targetDuration : 0

    if (progress <= 0.5) {
      const t = progress * 2
      const r = Math.round(46 + (241 - 46) * t)
      const g = Math.round(204 + (196 - 204) * t)
      const b = Math.round(113 + (15 - 113) * t)
      return `rgb(${r}, ${g}, ${b})`
    } else {
      const t = (progress - 0.5) * 2
      const r = Math.round(241 + (231 - 241) * t)
      const g = Math.round(196 + (76 - 196) * t)
      const b = Math.round(15 + (60 - 15) * t)
      return `rgb(${r}, ${g}, ${b})`
    }
  }, [elapsedSeconds, targetDuration, isRunning])

  const statusText = useMemo(() => {
    if (!isRunning && elapsedSeconds === 0) return '准备开始专注'
    if (isPaused) return '⏸ 已暂停'
    if (isRunning) return '🔥 专注中...'
    return ''
  }, [isRunning, isPaused, elapsedSeconds])

  const handlePreset = useCallback(
    (minutes: number) => {
      if (isRunning) return
      setSelectedPreset(minutes)
      setCustomMinutes('')
      setTargetDuration(minutes)
    },
    [isRunning, setTargetDuration]
  )

  const handleCustomDuration = useCallback(() => {
    if (isRunning) return
    const mins = parseInt(customMinutes, 10)
    if (isNaN(mins) || mins < 1 || mins > 120) return
    setSelectedPreset(0)
    setTargetDuration(mins)
  }, [customMinutes, isRunning, setTargetDuration])

  const handleStartPause = useCallback(() => {
    if (isRunning) {
      if (isPaused) {
        startTimer()
      } else {
        pauseTimer()
      }
    } else {
      startTimer()
    }
  }, [isRunning, isPaused, startTimer, pauseTimer])

  const handleReset = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  const startButtonClass = useMemo(() => {
    if (isRunning && !isPaused) return 'control-btn running'
    if (isPaused) return 'control-btn paused'
    return 'control-btn start'
  }, [isRunning, isPaused])

  const startButtonText = useMemo(() => {
    if (isRunning && !isPaused) return '暂停'
    if (isPaused) return '继续'
    return '开始'
  }, [isRunning, isPaused])

  return (
    <div className="panel timer-panel">
      <h2 className="panel-title">⏱ 专注计时</h2>

      <div className="card">
        <div
          className="timer-display"
          style={{ color: timerColor }}
        >
          {displayTime}
        </div>

        <div className="timer-status">{statusText}</div>

        <div className="duration-selector">
          {[25, 45, 60].map((mins) => (
            <button
              key={mins}
              className={`duration-btn ${selectedPreset === mins ? 'active' : ''}`}
              onClick={() => handlePreset(mins)}
              disabled={isRunning}
            >
              {mins}分钟
            </button>
          ))}
        </div>

        <div className="custom-duration">
          <input
            type="number"
            min="1"
            max="120"
            placeholder="自定义(1-120分钟)"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            disabled={isRunning}
          />
          <button onClick={handleCustomDuration} disabled={isRunning}>
            确定
          </button>
        </div>

        <div className="timer-controls">
          <button className={startButtonClass} onClick={handleStartPause}>
            {startButtonText}
          </button>
          <button className="control-btn reset" onClick={handleReset}>
            重置
          </button>
        </div>

        <div
          style={{
            marginTop: 20,
            textAlign: 'center',
            fontSize: 13,
            color: '#9090a8',
          }}
        >
          目标时长: {Math.round(targetMinutes / 60)} 分钟
        </div>
      </div>

      {showCompleteModal && (
        <CompleteModal
          totalMinutes={todayTotalMinutes}
          onClose={() => setShowCompleteModal(false)}
        />
      )}
    </div>
  )
}
