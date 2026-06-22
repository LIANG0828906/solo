import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import type { Course, Employee, QuizQuestion } from '../../utils/types'

interface Props {
  employee: Employee
}

interface Answer {
  questionId: string
  selected: number
}

interface EvaluatedAnswer extends Answer {
  correct: boolean
}

export default function Quiz({ employee }: Props) {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ score: number; total: number; evaluated: EvaluatedAnswer[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCourse()
  }, [courseId])

  const loadCourse = async () => {
    try {
      const data = await api.get(`/courses/${courseId}`) as any
      setCourse(data)
      setAnswers(data.quizzes.map((q: QuizQuestion) => ({ questionId: q.id, selected: -1 })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (submitted) return
    setAnswers(prev => {
      const next = [...prev]
      next[questionIdx] = { ...next[questionIdx], selected: optionIdx }
      return next
    })
  }

  const handleSubmit = async () => {
    if (!course || !courseId) return
    const unanswered = answers.filter(a => a.selected === -1).length
    if (unanswered > 0) {
      if (!confirm(`还有 ${unanswered} 题未作答，确定提交吗？`)) return
    }

    try {
      const res = await api.post('/quiz/submit', {
        employeeId: employee.id,
        courseId,
        answers: answers.filter(a => a.selected >= 0)
      }) as any

      const evaluated: EvaluatedAnswer[] = res.answers || []
      setResult({
        score: res.score,
        total: res.totalQuestions,
        evaluated
      })
      setSubmitted(true)
    } catch (e) {
      console.error(e)
    }
  }

  const getQuestionStatus = (idx: number): 'unanswered' | 'answered' | 'correct' | 'incorrect' => {
    if (!submitted) {
      return answers[idx]?.selected >= 0 ? 'answered' : 'unanswered'
    }
    if (!result) return 'unanswered'
    const evalItem = result.evaluated.find(e => e.questionId === answers[idx]?.questionId)
    if (!evalItem) return 'unanswered'
    return evalItem.correct ? 'correct' : 'incorrect'
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'answered': return <i className="fa fa-circle" style={{ color: '#667eea', fontSize: 10 }} />
      case 'correct': return <i className="fa fa-check-circle" style={{ color: '#11998e' }} />
      case 'incorrect': return <i className="fa fa-times-circle" style={{ color: '#eb3349' }} />
      default: return <i className="fa fa-circle-o" style={{ color: '#ccc', fontSize: 10 }} />
    }
  }

  if (loading) {
    return (
      <div className="empty-state">
        <i className="fa fa-spinner fa-spin" />
        <p className="empty-state-text">加载测验中...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="empty-state">
        <i className="fa fa-exclamation-circle" />
        <p className="empty-state-text">课程不存在</p>
        <button className="btn btn-primary" onClick={() => navigate('/employee/courses')} style={{ marginTop: 16 }}>
          <i className="fa fa-arrow-left" /> 返回课程列表
        </button>
      </div>
    )
  }

  if (course.quizzes.length === 0) {
    return (
      <div className="empty-state">
        <i className="fa fa-info-circle" />
        <p className="empty-state-text">该课程暂无测验题目</p>
        <button className="btn btn-primary" onClick={() => navigate('/employee/courses')} style={{ marginTop: 16 }}>
          <i className="fa fa-arrow-left" /> 返回课程列表
        </button>
      </div>
    )
  }

  const question = course.quizzes[currentIdx]
  const currentAnswer = answers[currentIdx]
  const evalItem = submitted && result
    ? result.evaluated.find(e => e.questionId === question.id)
    : null

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <i className="fa fa-pencil-square-o" /> {course.name} - 测验
        </h1>
        {!submitted && (
          <button className="btn" onClick={() => navigate('/employee/courses')}>
            <i className="fa fa-arrow-left" /> 返回
          </button>
        )}
      </div>

      <div className="quiz-layout">
        <div className="glass-card quiz-sidebar">
          <div className="quiz-sidebar-title">
            <i className="fa fa-list-ol" /> 题目列表
          </div>
          <div className="question-nav">
            {course.quizzes.map((q, idx) => {
              const status = getQuestionStatus(idx)
              return (
                <div
                  key={q.id}
                  className={`question-nav-item ${idx === currentIdx ? 'active' : ''}`}
                  onClick={() => setCurrentIdx(idx)}
                >
                  <span className="question-nav-number">{idx + 1}</span>
                  <span className="question-nav-text">
                    {q.question.slice(0, 20)}...
                  </span>
                  <span className="question-nav-status">{statusIcon(status)}</span>
                </div>
              )
            })}
          </div>

          {!submitted && (
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 16 }}
              onClick={handleSubmit}
            >
              <i className="fa fa-paper-plane" /> 提交测验
            </button>
          )}

          {submitted && result && (
            <div className="quiz-score" style={{ marginTop: 16, flexDirection: 'column', alignItems: 'center' }}>
              <div className="score-badge">{result.score} / {result.total}</div>
              <p style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
                正确率 {Math.round((result.score / result.total) * 100)}%
              </p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 12 }}
                onClick={() => navigate('/employee/courses')}
              >
                <i className="fa fa-arrow-left" /> 返回课程
              </button>
            </div>
          )}
        </div>

        <div className="glass-card quiz-main">
          <div className="quiz-question">
            <span style={{ color: '#667eea', marginRight: 8 }}>第{currentIdx + 1}题</span>
            {question.question}
          </div>

          <div className="quiz-options">
            {question.options.map((opt, optIdx) => {
              const letter = String.fromCharCode(65 + optIdx)
              const isSelected = currentAnswer?.selected === optIdx
              const isCorrect = submitted && optIdx === question.correctAnswer
              const isWrong = submitted && isSelected && optIdx !== question.correctAnswer

              let className = 'quiz-option'
              if (submitted) {
                if (isCorrect) className += ' correct'
                if (isWrong) className += ' incorrect'
              } else if (isSelected) {
                className += ' selected'
              }

              return (
                <div
                  key={optIdx}
                  className={className}
                  onClick={() => handleSelectOption(currentIdx, optIdx)}
                >
                  <span className="quiz-option-letter">
                    {isCorrect ? <i className="fa fa-check" /> : isWrong ? <i className="fa fa-times" /> : letter}
                  </span>
                  <span className="quiz-option-text">{opt}</span>
                </div>
              )
            })}
          </div>

          {submitted && evalItem && !evalItem.correct && (
            <div className="quiz-explanation">
              <div className="quiz-explanation-title">
                <i className="fa fa-lightbulb-o" /> 解析
              </div>
              <div className="quiz-explanation-text">
                <p><strong>正确答案：</strong>{String.fromCharCode(65 + question.correctAnswer)}. {question.options[question.correctAnswer]}</p>
                <p style={{ marginTop: 8 }}>{question.explanation}</p>
              </div>
            </div>
          )}

          {submitted && evalItem && evalItem.correct && (
            <div className="quiz-explanation" style={{ borderLeftColor: '#11998e', background: 'rgba(17,153,142,0.1)' }}>
              <div className="quiz-explanation-title" style={{ color: '#11998e' }}>
                <i className="fa fa-check-circle" /> 回答正确
              </div>
              <div className="quiz-explanation-text">{question.explanation}</div>
            </div>
          )}

          <div className="quiz-footer">
            <button
              className="btn btn-sm"
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
            >
              <i className="fa fa-arrow-left" /> 上一题
            </button>
            <span style={{ color: '#666', fontSize: 13 }}>
              {currentIdx + 1} / {course.quizzes.length}
            </span>
            <button
              className="btn btn-sm"
              onClick={() => setCurrentIdx(Math.min(course.quizzes.length - 1, currentIdx + 1))}
              disabled={currentIdx === course.quizzes.length - 1}
            >
              下一题 <i className="fa fa-arrow-right" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
