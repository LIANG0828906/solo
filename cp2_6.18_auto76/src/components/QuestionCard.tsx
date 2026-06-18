import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
  const [loading, setLoading] = useState(false)
  const [cardTransition, setCardTransition] = useState<'idle' | 'out' | 'in'>('idle')
  const [cardKey, setCardKey] = useState(0)

  const answerLockedRef = useRef(answerLocked)
  const roundTransitionRef = useRef(roundTransition)
  const selectedAnswerRef = useRef(selectedAnswer)
  const answerCorrectRef = useRef(answerCorrect)

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
    return (currentRound / totalRounds) * 100
  }, [currentRound, totalRounds])

  const timerPercent = useMemo(() => {
    if (totalTime === 0) return 0
    if (showResult && answerCorrectRef.current === false) return 0
    return (timeRemaining / totalTime) * 100
  }, [timeRemaining, totalTime, showResult])

  const handleOptionClick = useCallback((index: number) => {
    if (answerLockedRef.current || loading || showResult) return
    setPressedIndex(index)
    setLoading(true)
    setTimeout(() => {
      setPressedIndex(null)
    }, 180)
    eventBus.emit('answerSubmit', {
      playerId: currentPlayerId,
      questionId: currentQuestion?.questionId || '',
      selectedIndex: index,
    })
  }, [loading, showResult, currentPlayerId, currentQuestion?.questionId])

  useEffect(() => {
    if (!answerLocked) return
    const resultTimer = setTimeout(() => {
      setLoading(false)
      setShowResult(true)
    }, 300)
    const transitionTimer = setTimeout(() => {
      setCardTransition('out')
      setTimeout(() => {
        setCardKey((k) => k + 1)
        setCardTransition('in')
        setTimeout(() => {
          setCardTransition('idle')
          setShowResult(false)
        }, 300)
      }, 300)
    }, 1500)
    return () => {
      clearTimeout(resultTimer)
      clearTimeout(transitionTimer)
    }
  }, [answerLocked])

  useEffect(() => {
    if (!roundTransition) return
    setCardTransition('out')
    setTimeout(() => {
      setCardKey((k) => k + 1)
      setShowResult(false)
      setLoading(false)
      setCardTransition('in')
      setTimeout(() => {
        setCardTransition('idle')
      }, 300)
    }, 300)
  }, [roundTransition])

  const getOptionClasses = useCallback((index: number) => {
    const base = 'option-btn py-6 px-4 text-center font-semibold text-base md:text-lg relative'
    const classes = [base]
    if (pressedIndex === index) {
      classes.push('animate-btnPress')
    }
    if (showResult && currentQuestion) {
      const correct = index === currentQuestion.correctIndex
      const isSelected = index === selectedAnswerRef.current
      if (correct) {
        classes.push('option-correct')
        if (isSelected && answerCorrectRef.current === true) {
          classes.push('animate-flashGreen', 'animate-pulseGlow')
        }
      } else if (isSelected && answerCorrectRef.current === false) {
        classes.push('option-wrong', 'animate-shake')
      }
    }
    return classes.join(' ')
  }, [pressedIndex, showResult, currentQuestion])

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
            <span className="text-sm text-white/50 font-medium">
              {answerLocked ? (answerCorrect ? '回答正确!' : '回答错误') : '请选择答案'}
            </span>
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
                transition: showResult && answerCorrectRef.current === false ? 'width 0.5s ease-in' : 'width 1s linear',
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

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:flex-wrap md:justify-center">
          <div className="grid grid-cols-2 gap-4 md:hidden w-full">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={loading || showResult || answerLocked}
                className={getOptionClasses(index)}
              >
                {showResult && currentQuestion.correctIndex === index && (
                  <div className="absolute inset-0 rounded-xl animate-wave pointer-events-none" style={{
                    background: 'radial-gradient(circle, rgba(0,255,136,0.4) 0%, transparent 70%)',
                  }} />
                )}
                <span className="relative z-10 block">{option}</span>
                {loading && !showResult && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 spinner-dot animate-spinnerRotate" />
                )}
                {showResult && currentQuestion.correctIndex === index && answerCorrect === true && (
                  <span
                    className="absolute -top-2 right-2 font-bold text-xl animate-floatUp"
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      color: '#00FF88',
                      textShadow: '0 0 10px rgba(0,255,136,0.8)',
                    }}
                  >
                    +100
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="hidden md:flex md:flex-row md:gap-6 md:flex-wrap md:justify-center md:w-full">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={loading || showResult || answerLocked}
                className={`${getOptionClasses(index)} md:w-[calc(50%-12px)]`}
              >
                {showResult && currentQuestion.correctIndex === index && (
                  <div className="absolute inset-0 rounded-xl animate-wave pointer-events-none" style={{
                    background: 'radial-gradient(circle, rgba(0,255,136,0.4) 0%, transparent 70%)',
                  }} />
                )}
                <span className="relative z-10 block">{option}</span>
                {loading && !showResult && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 spinner-dot animate-spinnerRotate" />
                )}
                {showResult && currentQuestion.correctIndex === index && answerCorrect === true && (
                  <span
                    className="absolute -top-2 right-2 font-bold text-xl animate-floatUp"
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      color: '#00FF88',
                      textShadow: '0 0 10px rgba(0,255,136,0.8)',
                    }}
                  >
                    +100
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
