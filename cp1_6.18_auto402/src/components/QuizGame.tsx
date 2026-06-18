import { useState } from 'react'
import { getDailyQuestions } from '../data/quizQuestions'
import type { QuizQuestion } from '../types'
import Button from './Button'
import RarityTag from './RarityTag'
import { getRarityName } from '../modules/nft-core/ItemGenerator'

interface Props {
  onComplete: (correctCount: number, total: number) => void
  onClose: () => void
}

const QuizGame = ({ onComplete, onClose }: Props) => {
  const [questions] = useState<QuizQuestion[]>(() => getDailyQuestions(3))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [finished, setFinished] = useState(false)

  const question = questions[currentIndex]
  const correctCount = answers.filter((a, i) => a === questions[i].correctAnswer).length

  const handleSelect = (idx: number) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(idx)
  }

  const handleNext = () => {
    if (selectedAnswer === null) return
    const newAnswers = [...answers, selectedAnswer]
    setAnswers(newAnswers)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
    } else {
      setFinished(true)
      const finalCorrect = newAnswers.filter(
        (a, i) => a === questions[i].correctAnswer
      ).length
      setTimeout(() => onComplete(finalCorrect, questions.length), 2000)
    }
  }

  const getExpectedRarity = () => {
    if (questions.length === 0) return 'common'
    const ratio = correctCount / questions.length
    if (ratio >= 1) return 'legendary'
    if (ratio >= 0.66) return 'epic'
    if (ratio >= 0.33) return 'rare'
    return 'common'
  }

  if (finished) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 26, marginBottom: 12 }}>答题完成！</h2>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 20 }}>
          正确率：<strong style={{ color: '#00D4AA' }}>{Math.round((correctCount / questions.length) * 100)}%</strong>
          {' '}（{correctCount}/{questions.length}）
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>获得碎片：</span>
          <RarityTag rarity={getExpectedRarity()} size="md" />
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          共获得 {correctCount} 个 {getRarityName(getExpectedRarity())} 碎片
        </p>
      </div>
    )
  }

  return (
    <div style={{ minWidth: 300 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>📚 每日答题</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {questions.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background:
                i < currentIndex
                  ? '#00D4AA'
                  : i === currentIndex
                  ? 'linear-gradient(90deg, #00D4AA, #009FCC)'
                  : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>

      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
        第 {currentIndex + 1} / {questions.length} 题
      </div>

      <h3 style={{ fontSize: 18, marginBottom: 24, lineHeight: 1.5 }}>{question.question}</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {question.options.map((opt, idx) => {
          const isCorrect = selectedAnswer !== null && idx === question.correctAnswer
          const isWrong = selectedAnswer === idx && idx !== question.correctAnswer
          const isSelected = selectedAnswer === idx

          let bg = 'rgba(255,255,255,0.05)'
          let border = 'rgba(255,255,255,0.1)'
          if (isCorrect) {
            bg = 'rgba(0, 212, 170, 0.15)'
            border = '#00D4AA'
          } else if (isWrong) {
            bg = 'rgba(231, 76, 60, 0.15)'
            border = '#E74C3C'
          } else if (isSelected) {
            bg = 'rgba(0, 212, 170, 0.08)'
            border = '#00D4AA50'
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={selectedAnswer !== null}
              style={{
                padding: '14px 18px',
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 10,
                color: '#fff',
                textAlign: 'left',
                cursor: selectedAnswer === null ? 'pointer' : 'default',
                fontSize: 15,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isSelected
                    ? 'linear-gradient(135deg, #00D4AA, #009FCC)'
                    : 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span>{opt}</span>
              {isCorrect && <span style={{ marginLeft: 'auto' }}>✓</span>}
              {isWrong && <span style={{ marginLeft: 'auto', color: '#E74C3C' }}>✗</span>}
            </button>
          )
        })}
      </div>

      <Button
        size="lg"
        onClick={handleNext}
        disabled={selectedAnswer === null}
        style={{ width: '100%' }}
      >
        {currentIndex < questions.length - 1 ? '下一题 →' : '查看结果'}
      </Button>
    </div>
  )
}

export default QuizGame
