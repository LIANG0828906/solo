import { useState, useEffect, useCallback, useRef } from 'react'
import { getRandomQuestion, resetUsedPoetry, Question } from './PoetryBank'
import { GameSettings } from './setup'

interface GameBoardProps {
  settings: GameSettings
  onGameEnd: (scores: [number, number]) => void
  onBackToMenu: () => void
}

type AnswerState = 'idle' | 'correct' | 'wrong'
type SoundType = 'correct' | 'wrong' | 'switch' | 'firework'

export default function GameBoard({ settings, onGameEnd, onBackToMenu }: GameBoardProps) {
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0)
  const [currentRound, setCurrentRound] = useState<number>(1)
  const [scores, setScores] = useState<[number, number]>([0, 0])
  const [timeLeft, setTimeLeft] = useState<number>(settings.roundDuration)
  const [question, setQuestion] = useState<Question>(() => getRandomQuestion())
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)
  const timeoutRefs = useRef<number[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const isSwitchingRef = useRef<boolean>(false)

  const safeTimeout = useCallback((callback: () => void, delay: number): number => {
    const id = window.setTimeout(callback, delay)
    timeoutRefs.current.push(id)
    return id
  }, [])

  const clearAllTimeouts = useCallback((): void => {
    timeoutRefs.current.forEach((id) => clearTimeout(id))
    timeoutRefs.current = []
  }, [])

  const playSound = useCallback((type: SoundType) => {
    if (!settings.soundEnabled) return
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }

      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      audioContextRef.current = audioContext

      if (type === 'correct') {
        const frequencies = [523.25, 659.25, 783.99, 1046.50]
        const noteDuration = 0.12
        const totalDuration = 0.5

        frequencies.forEach((freq, index) => {
          const osc = audioContext.createOscillator()
          const gain = audioContext.createGain()
          osc.connect(gain)
          gain.connect(audioContext.destination)
          osc.frequency.value = freq

          const startTime = audioContext.currentTime + index * noteDuration
          const peakTime = startTime + noteDuration * 0.5
          const endTime = startTime + noteDuration

          gain.gain.setValueAtTime(0, startTime)
          gain.gain.linearRampToValueAtTime(0.35, peakTime)
          gain.gain.exponentialRampToValueAtTime(0.01, endTime)

          osc.start(startTime)
          osc.stop(endTime)
        })

        safeTimeout(() => {
          if (audioContextRef.current === audioContext) {
            audioContext.close().catch(() => {})
            audioContextRef.current = null
          }
        }, totalDuration * 1000 + 100)
      } else if (type === 'wrong') {
        const frequencies = [150, 100]
        const noteDuration = 0.15
        const totalDuration = 0.3

        frequencies.forEach((freq, index) => {
          const osc = audioContext.createOscillator()
          const gain = audioContext.createGain()
          const distortion = audioContext.createWaveShaper()
          const curve = new Float32Array(256)
          for (let i = 0; i < 256; i++) {
            const x = (i / 256) * 2 - 1
            curve[i] = Math.tanh(x * 3)
          }
          distortion.curve = curve

          osc.type = 'square'
          osc.frequency.value = freq

          osc.connect(distortion)
          distortion.connect(gain)
          gain.connect(audioContext.destination)

          const startTime = audioContext.currentTime + index * noteDuration
          const endTime = startTime + noteDuration

          gain.gain.setValueAtTime(0.25, startTime)
          gain.gain.exponentialRampToValueAtTime(0.01, endTime)

          osc.start(startTime)
          osc.stop(endTime)
        })

        safeTimeout(() => {
          if (audioContextRef.current === audioContext) {
            audioContext.close().catch(() => {})
            audioContextRef.current = null
          }
        }, totalDuration * 1000 + 100)
      } else if (type === 'switch') {
        const frequencies = [392.0, 523.25]
        const noteDuration = 0.1
        const totalDuration = 0.25

        frequencies.forEach((freq, index) => {
          const osc = audioContext.createOscillator()
          const gain = audioContext.createGain()
          osc.connect(gain)
          gain.connect(audioContext.destination)
          osc.frequency.value = freq
          osc.type = 'sine'

          const startTime = audioContext.currentTime + index * noteDuration
          const endTime = startTime + noteDuration * 0.9

          gain.gain.setValueAtTime(0.25, startTime)
          gain.gain.exponentialRampToValueAtTime(0.01, endTime)

          osc.start(startTime)
          osc.stop(endTime)
        })

        safeTimeout(() => {
          if (audioContextRef.current === audioContext) {
            audioContext.close().catch(() => {})
            audioContextRef.current = null
          }
        }, totalDuration * 1000 + 100)
      } else if (type === 'firework') {
        const bufferSize = audioContext.sampleRate * 0.3
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
        const data = buffer.getChannelData(0)

        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
        }

        const noise = audioContext.createBufferSource()
        noise.buffer = buffer

        const filter = audioContext.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(2000, audioContext.currentTime)
        filter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3)

        const gain = audioContext.createGain()
        gain.gain.setValueAtTime(0.4, audioContext.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

        noise.connect(filter)
        filter.connect(gain)
        gain.connect(audioContext.destination)

        noise.start(audioContext.currentTime)
        noise.stop(audioContext.currentTime + 0.3)

        safeTimeout(() => {
          if (audioContextRef.current === audioContext) {
            audioContext.close().catch(() => {})
            audioContextRef.current = null
          }
        }, 400)
      }
    } catch {
      // ignore audio errors
    }
  }, [settings.soundEnabled, safeTimeout])

  const switchTurn = useCallback(() => {
    if (isSwitchingRef.current) return
    isSwitchingRef.current = true

    clearAllTimeouts()
    playSound('switch')

    const finishSwitch = (): void => {
      setCurrentPlayer((p) => (p === 0 ? 1 : 0) as 0 | 1)
      setTimeLeft(settings.roundDuration)
      resetUsedPoetry()
      setQuestion(getRandomQuestion())
      setAnswerState('idle')
      setSelectedAnswer(null)
      isSwitchingRef.current = false
    }

    if (currentPlayer === 1) {
      if (currentRound >= settings.totalRounds) {
        playSound('firework')
        safeTimeout(() => playSound('firework'), 200)
        safeTimeout(() => playSound('firework'), 400)
        safeTimeout(() => {
          isSwitchingRef.current = false
          onGameEnd(scores)
        }, 480)
        return
      }
      setCurrentRound((r) => r + 1)
    }

    finishSwitch()
  }, [currentPlayer, currentRound, settings, onGameEnd, scores, playSound, clearAllTimeouts, safeTimeout])

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
        timerRef.current = null
      }
      clearAllTimeouts()
    }
  }, [currentPlayer, currentRound, clearAllTimeouts])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      clearAllTimeouts()
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
    }
  }, [clearAllTimeouts])

  useEffect(() => {
    if (timeLeft === 0 && answerState === 'idle') {
      switchTurn()
    }
  }, [timeLeft, answerState, switchTurn])

  const handleAnswer = (answer: string): void => {
    if (answerState !== 'idle') return
    setSelectedAnswer(answer)

    clearAllTimeouts()

    if (answer === question.correctAnswer) {
      setAnswerState('correct')
      playSound('correct')
      setScores((s): [number, number] => {
        const newScores: [number, number] = [s[0], s[1]]
        newScores[currentPlayer] += 10
        return newScores
      })
      safeTimeout(() => {
        setQuestion(getRandomQuestion())
        setAnswerState('idle')
        setSelectedAnswer(null)
      }, 800)
    } else {
      setAnswerState('wrong')
      playSound('wrong')
      safeTimeout(() => {
        switchTurn()
      }, 1500)
    }
  }

  const handleBackClick = (): void => {
    onBackToMenu()
  }

  const handleOptionClick = (option: string): void => {
    handleAnswer(option)
  }

  const timerPercentage = (timeLeft / settings.roundDuration) * 100

  return (
    <div className="game-board">
      {answerState === 'wrong' && <div className="screen-crack" />}

      <div className="top-bar">
        <button className="back-btn" onClick={handleBackClick}>
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
            className={`timer-bar-fill ${timerPercentage < 30 ? 'urgent' : ''}`}
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
          ——《{question.pair.title}》{question.pair.dynasty}·{question.pair.author}
        </div>
        <div className="question-prompt">
          {question.isReverse ? (
            <>
              <span className="prompt-ellipsis">______，</span>
              {question.prompt}
            </>
          ) : (
            <>
              {question.prompt}
              <span className="prompt-ellipsis">，______</span>
            </>
          )}
        </div>
      </div>

      <div className="options-container">
        {question.options.map((option: string, index: number) => {
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
              onClick={() => handleOptionClick(option)}
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
