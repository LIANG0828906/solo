import { useState, useEffect, useCallback, useRef } from 'react'
import { getRandomQuestion, resetUsedPoetry, Question } from './PoetryBank'
import { GameSettings } from './setup'

interface GameBoardProps {
  settings: GameSettings
  onGameEnd: (scores: [number, number]) => void
  onBackToMenu: () => void
}

type AnswerState = 'idle' | 'correct' | 'wrong'

export default function GameBoard({ settings, onGameEnd, onBackToMenu }: GameBoardProps) {
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [scores, setScores] = useState<[number, number]>([0, 0])
  const [timeLeft, setTimeLeft] = useState<number>(settings.roundDuration)
  const [question, setQuestion] = useState<Question>(() => getRandomQuestion())
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showFireworks, setShowFireworks] = useState(false)
  const timerRef = useRef<number | null>(null)
  const fireworksCanvasRef = useRef<HTMLCanvasElement>(null)

  const playSound = useCallback((type: 'correct' | 'wrong' | 'switch') => {
    if (!settings.soundEnabled) return
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      if (type === 'correct') {
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.4)
      } else if (type === 'wrong') {
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.15)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } else {
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
      }
    } catch {
      // ignore audio errors
    }
  }, [settings.soundEnabled])

  const switchTurn = useCallback(() => {
    playSound('switch')
    if (currentPlayer === 1) {
      if (currentRound >= settings.totalRounds) {
        setShowFireworks(true)
        setTimeout(() => {
          onGameEnd(scores)
        }, 3500)
        return
      }
      setCurrentRound((r) => r + 1)
    }
    setCurrentPlayer((p) => (p === 0 ? 1 : 0) as 0 | 1)
    setTimeLeft(settings.roundDuration)
    resetUsedPoetry()
    setQuestion(getRandomQuestion())
    setAnswerState('idle')
    setSelectedAnswer(null)
  }, [currentPlayer, currentRound, settings, onGameEnd, scores, playSound])

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current)
      }
    }
  }, [currentPlayer, currentRound])

  useEffect(() => {
    if (timeLeft === 0 && answerState === 'idle') {
      switchTurn()
    }
  }, [timeLeft, answerState, switchTurn])

  const handleAnswer = (answer: string) => {
    if (answerState !== 'idle') return
    setSelectedAnswer(answer)
    if (answer === question.correctAnswer) {
      setAnswerState('correct')
      playSound('correct')
      setScores((s) => {
        const newScores: [number, number] = [...s] as [number, number]
        newScores[currentPlayer] += 10
        return newScores
      })
      setTimeout(() => {
        setQuestion(getRandomQuestion())
        setAnswerState('idle')
        setSelectedAnswer(null)
      }, 800)
    } else {
      setAnswerState('wrong')
      playSound('wrong')
      setTimeout(() => {
        switchTurn()
      }, 1500)
    }
  }

  useEffect(() => {
    if (!showFireworks || !fireworksCanvasRef.current) return

    const canvas = fireworksCanvasRef.current
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      alpha: number
      color: string
      size: number
    }

    const particles: Particle[] = []
    const colors = ['#ff0000', '#ffd700', '#ff6b6b', '#ffa500', '#ff1493', '#8b0000']

    const createFirework = (x: number, y: number) => {
      const particleCount = 80 + Math.random() * 40
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.2
        const speed = 2 + Math.random() * 4
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2 + Math.random() * 3,
        })
      }
    }

    let frameCount = 0
    const animate = () => {
      ctx.fillStyle = 'rgba(245, 240, 230, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.alpha -= 0.008
        p.size *= 0.98

        if (p.alpha <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      if (frameCount % 30 === 0 && frameCount < 180) {
        createFirework(
          Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
          Math.random() * canvas.height * 0.5 + canvas.height * 0.1
        )
      }

      if (frameCount < 240 || particles.length > 0) {
        frameCount++
        requestAnimationFrame(animate)
      }
    }

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        createFirework(
          Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
          Math.random() * canvas.height * 0.5 + canvas.height * 0.1
        )
      }, i * 300)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showFireworks])

  const timerPercentage = (timeLeft / settings.roundDuration) * 100

  return (
    <div className="game-board">
      {showFireworks && (
        <canvas
          ref={fireworksCanvasRef}
          className="fireworks-canvas"
        />
      )}

      {answerState === 'wrong' && <div className="screen-crack" />}

      <div className="top-bar">
        <button className="back-btn" onClick={onBackToMenu}>
          返回
        </button>
        <div className="round-info">
          <span className="round-label">第 {currentRound} 轮</span>
          <span className="round-divider">/</span>
          <span className="round-total">{settings.totalRounds}</span>
        </div>
        <div style={{ width: 60 }} />
      </div>

      <div className="scores-container">
        <div className={`player-score ${currentPlayer === 0 ? 'active' : ''}`}>
          <div className="player-label">玩家一</div>
          <div className="score-value">{scores[0]}</div>
        </div>
        <div className="vs-label">VS</div>
        <div className={`player-score ${currentPlayer === 1 ? 'active' : ''}`}>
          <div className="player-label">玩家二</div>
          <div className="score-value">{scores[1]}</div>
        </div>
      </div>

      <div className="timer-container">
        <div className="timer-bar-bg">
          <div
            className="timer-bar-fill"
            style={{
              width: `${timerPercentage}%`,
              background: timerPercentage < 30
                ? 'linear-gradient(90deg, #8b0000, #ff0000)'
                : 'linear-gradient(90deg, #2d5016, #4a7c23)',
            }}
          />
        </div>
        <div
          className={`timer-number ${timerPercentage < 30 ? 'urgent' : ''}`}
          key={timeLeft}
        >
          {timeLeft}s
        </div>
      </div>

      <div className="current-player-banner">
        {currentPlayer === 0 ? '玩家一' : '玩家二'} 答题中
      </div>

      <div className="question-card">
        <div className="poem-source">
          ——《{question.poetry.title}》{question.poetry.dynasty}·{question.poetry.author}
        </div>
        <div className="question-prompt">
          {question.prompt}
          <span className="prompt-ellipsis">，______</span>
        </div>
      </div>

      <div className="options-container">
        {question.options.map((option, index) => {
          let btnClass = 'option-btn'
          if (answerState !== 'idle') {
            if (option === question.correctAnswer) {
              btnClass += ' correct'
            } else if (option === selectedAnswer && answerState === 'wrong') {
              btnClass += ' wrong'
            } else {
              btnClass += ' disabled'
            }
          }
          return (
            <button
              key={index}
              className={btnClass}
              onClick={() => handleAnswer(option)}
              disabled={answerState !== 'idle'}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
              {answerState !== 'idle' && option === question.correctAnswer && (
                <span className="ink-spread" />
              )}
            </button>
          )
        })}
      </div>

      {answerState === 'wrong' && (
        <div className="wrong-answer-hint">
          正确答案是：<span className="correct-answer-text">{question.correctAnswer}</span>
        </div>
      )}
      {answerState === 'correct' && (
        <div className="correct-answer-hint">
          +10 分！答对了！
        </div>
      )}
    </div>
  )
}
