import { useState, useEffect, useCallback } from 'react'

interface Question {
  id: number
  text: string
  options: { text: string }[]
}

interface QuizCardProps {
  question: Question
  currentIndex: number
  totalQuestions: number
  onAnswer: (optionIndex: number) => void
}

export default function QuizCard({
  question,
  currentIndex,
  totalQuestions,
  onAnswer,
}: QuizCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [displayIndex, setDisplayIndex] = useState(currentIndex)

  useEffect(() => {
    if (currentIndex !== displayIndex) {
      setIsFlipped(true)
      const timer = setTimeout(() => {
        setDisplayIndex(currentIndex)
        setIsFlipped(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, displayIndex])

  const handleSelect = useCallback(
    (optionIndex: number) => {
      onAnswer(optionIndex)
    },
    [onAnswer]
  )

  return (
    <div className="glass-card card-enter" key={currentIndex}>
      <div className="progress-container">
        <span className="progress-text">
          第 {currentIndex + 1} / {totalQuestions} 题
        </span>
        <div className="progress-dots">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={`progress-dot ${
                i < currentIndex
                  ? 'completed'
                  : i === currentIndex
                    ? 'active'
                    : ''
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flip-container">
        <div className={`flip-inner ${isFlipped ? 'flipped' : ''}`}>
          <div className="flip-face">
            <p className="question-text">{question.text}</p>
            <div>
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  className="btn-option"
                  onClick={() => handleSelect(idx)}
                >
                  {String.fromCharCode(65 + idx)}. {opt.text}
                </button>
              ))}
            </div>
          </div>
          <div className="flip-face flip-back">
            <p className="question-text">准备下一题...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
