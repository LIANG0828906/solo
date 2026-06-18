import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import eventBus from '../eventBus'
import { useGameStore } from '../game/gameManager'

export default function QuestionCard() {
  const {
    currentQuestion,
    currentRound,
    totalRounds,
    timeRemaining,
    totalTime,
    answerLocked,
    selectedAnswer,
    answerCorrect,
    currentPlayerId,
    roundTransition,
  } = useGameStore()

  const [pressedIndex, setPressedIndex] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [fadingResult, setFadingResult] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cardTransition, setCardTransition] = useState<'idle' | 'out' | 'in'>('idle')
  const [cardKey, setCardKey] = useState(0)

  const answerLockedRef = useRef(answerLocked)
  const roundTransitionRef = useRef(roundTransition)
  const selectedAnswerRef = useRef(selectedAnswer)
  const answerCorrectRef = useRef(answerCorrect)
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    answerLockedRef.current = answerLocked
  }, [answerLocked])

  useEffect(() => {
    roundTransitionRef.current = roundTransition
  }, [roundTransition])

  useEffect(() => {
    selectedAnswerRef.current = selectedAnswer
  }, [selectedAnswer])

  useEffect(() => {
    answerCorrectRef.current = answerCorrect
  }, [answerCorrect])

  const progressPercent = useMemo(() => {
    if (totalRounds === 0) return 0
    return ((currentRound + 1) / totalRounds) * 100
  }, [currentRound, totalRounds])

  const timerPercent = useMemo(() => {
    if (totalTime === 0) return 0
    if (showResult && !fadingResult && answerCorrectRef.current === false) return 0
    return (timeRemaining / totalTime) * 100
  }, [timeRemaining, totalTime, showResult, fadingResult])

  const handleOptionClick = useCallback((index: number) => {
    if (answerLockedRef.current || loading || showResult || fadingResult) return
    setPressedIndex(index)
    if (pressedTimerRef.current) clearTimeout(pressedTimerRef.current)
    pressedTimerRef.current = setTimeout(() => {
      setPressedIndex(null)
    }, 180)
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
    loadingTimerRef.current = setTimeout(() => {
      setLoading(true)
    }, 100)
    eventBus.emit('answerSubmit', {
      playerId: currentPlayerId,
      questionId: currentQuestion?.questionId || '',
      selectedIndex: index,
    })
  }, [loading, showResult, fadingResult, currentPlayerId, currentQuestion?.questionId])

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
      if (pressedTimerRef.current) clearTimeout(pressedTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!answerLocked) return
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
    setLoading(true)
    let showResultTimer: ReturnType<typeof setTimeout> | null = null
    let fadeTimer: ReturnType<typeof setTimeout> | null = null
    let transitionTimer: ReturnType<typeof setTimeout> | null = null
    showResultTimer = setTimeout(() => {
      setLoading(false)
      setShowResult(true)
    }, 300)
    fadeTimer = setTimeout(() => {
      setFadingResult(true)
    }, 1100)
    transitionTimer = setTimeout(() => {
      setShowResult(false)
      setFadingResult(false)
      setCardTransition('out')
      setTimeout(() => {
        setCardKey((k) => k + 1)
        setCardTransition('in')
        setTimeout(() => {
          setCardTransition('idle')
        }, 300)
      }, 300)
    }, 1500)
    return () => {
      if (showResultTimer) clearTimeout(showResultTimer)
      if (fadeTimer) clearTimeout(fadeTimer)
      if (transitionTimer) clearTimeout(transitionTimer)
    }
  }, [answerLocked])

  useEffect(() => {
    if (!roundTransition) return
    setCardTransition('out')
    setTimeout(() => {
      setCardKey((k) => k + 1)
      setShowResult(false)
      setFadingResult(false)
      setLoading(false)
      setCardTransition('in')
      setTimeout(() => {
        setCardTransition('idle')
      }, 300)
    }, 300)
  }, [roundTransition])

  const getOptionClasses = useCallback((index: number) => {
    const base = 'option-btn py-6 px-4 text-center font-semibold text-base md:text-lg relative transition-all duration-300'
    const classes = [base]
    if (pressedIndex === index) {
      classes.push('animate-btnPress')
    }
    if (showResult && currentQuestion) {
      const correct = index === currentQuestion.correctIndex
      const isSelected = index === selectedAnswerRef.current
      if (correct) {
        classes.push('option-correct scale-[1.03]')
        if (!fadingResult) {
          classes.push('animate-pulseGlow')
          if (isSelected && answerCorrectRef.current === true) {
            classes.push('animate-flashGreen')
          }
        }
      } else if (isSelected && answerCorrectRef.current === false && !fadingResult) {
        classes.push('option-wrong animate-shake')
      }
    }
    return classes.join(' ')
  }, [pressedIndex, showResult, fadingResult, currentQuestion])

  const renderOptionButton = (option: string, index: number) => (
    <button
      key={index}
      onClick={() => handleOptionClick(index)}
      disabled={loading || showResult || answerLocked}
      className={getOptionClasses(index)}
    >
      {showResult && currentQuestion && currentQuestion.correctIndex === index && !fadingResult && (
        <div className="absolute inset-0 rounded-xl animate-wave pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(0,255,136,0.5) 0%, transparent 70%)',
        }} />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {showResult && !fadingResult && currentQuestion && currentQuestion.correctIndex === index && (
          <span style={{ color: '#00FF88', textShadow: '0 0 8px rgba(0,255,136,0.8)' }}>✓</span>
        )}
        {showResult && !fadingResult && currentQuestion && currentQuestion.correctIndex !== index && index === selectedAnswerRef.current && answerCorrectRef.current === false && (
          <span style={{ color: '#FF4444', textShadow: '0 0 8px rgba(255,68,68,0.8)' }}>✗</span>
        )}
        {option}
      </span>
      {showResult && currentQuestion && currentQuestion.correctIndex === index && answerCorrect === true && !fadingResult && (
        <span
          className="absolute -top-6 right-2 font-bold text-xl animate-floatUp"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            color: '#00FF88',
            textShadow: '0 0 12px rgba(0,255,136,0.9)',
          }}
        >
          +100
        </span>
      )}
    </button>
  )

  if (!currentQuestion) {
    return (
      <div className="w-full max-w-4xl mx-auto glass-panel p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="spinner-dot animate-spinnerRotate mb-4" />
        <div className="text-xl font-semibold text-white/80">准备中...</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div key={cardKey} className={`glass-panel p-6 md:p-10 ${
        cardTransition === 'out' ? 'animate-slideOutLeft' :
        cardTransition === 'in' ? 'animate-slideInRight' : ''
      }`}>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-lg font-bold"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                background: 'linear-gradient(90deg, #00DBDE 0%, #FC00FF 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              {currentRound + 1} / {totalRounds}
            </span>
            <div className="flex items-center gap-2">
              {loading && !showResult && (
                <>
                  <div className="spinner-dot animate-spinnerRotate w-4 h-4" />
                  <span className="text-sm text-white/60 font-medium animate-loadingPulse">
                    提交中...
                  </span>
                </>
              )}
              {!loading && !showResult && (
                <span className="text-sm text-white/50 font-medium">请选择答案</span>
              )}
              {showResult && !fadingResult && (
                <span
                  className="text-sm font-bold"
                  style={{
                    color: answerCorrect ? '#00FF88' : '#FF4444',
                    textShadow: answerCorrect
                      ? '0 0 10px rgba(0,255,136,0.6)'
                      : '0 0 10px rgba(255,68,68,0.6)',
                  }}
                >
                  {answerCorrect ? '✓ 回答正确 +100' : '✗ 回答错误'}
                </span>
              )}
            </div>
          </div>
          <div className="progress-indicator-bg mb-4">
            <div
              className="progress-indicator-fill animate-progressGradientSweep"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="timer-bar">
            <div
              className="timer-fill animate-progressGradientSweep"
              style={{
                width: `${timerPercent}%`,
                transition: showResult && !fadingResult && answerCorrectRef.current === false
                  ? 'width 0.5s ease-in'
                  : 'width 1s linear',
              }}
            />
          </div>
        </div>

        <div
          className="text-2xl md:text-3xl font-bold text-center mb-10 mt-6"
          style={{
            fontFamily: "'Orbitron', 'Exo 2', sans-serif",
            color: '#FFFFFF',
            textShadow: '0 0 20px rgba(108, 99, 255, 0.3)',
          }}
        >
          {currentQuestion.text}
        </div>

        <div className="grid grid-cols-2 gap-4 md:hidden w-full">
          {currentQuestion.options.map((option, index) => renderOptionButton(option, index))}
        </div>

        <div className="hidden md:grid md:grid-cols-2 md:gap-6 w-full">
          {currentQuestion.options.map((option, index) => renderOptionButton(option, index))}
        </div>
      </div>
    </div>
  )
}
