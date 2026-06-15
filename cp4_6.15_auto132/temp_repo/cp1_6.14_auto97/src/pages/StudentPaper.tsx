import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { FileText, User, Send } from 'lucide-react'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'
import Button from '@/components/Button'
import OptionCard from '@/components/OptionCard'
import FillInput from '@/components/FillInput'
import { cn } from '@/lib/utils'
import { fetchPaper, submitAnswer } from '@/modules/paper'
import { fetchQuestions } from '@/modules/questionBank'
import type { Paper, Question, StudentAnswer } from '@shared/types'

function renderLatex(text: string) {
  const parts: React.ReactNode[] = []
  const regex = /(\$\$[^$]+\$\$|\$[^$]+\$)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>)
    }

    const latex = match[0]
    const isBlock = latex.startsWith('$$')
    const content = isBlock ? latex.slice(2, -2) : latex.slice(1, -1)

    try {
      if (isBlock) {
        parts.push(
          <div key={key++} className="my-2 overflow-x-auto">
            <BlockMath math={content} />
          </div>,
        )
      } else {
        parts.push(<InlineMath key={key++} math={content} />)
      }
    } catch {
      parts.push(<span key={key++} className="text-red-500">{latex}</span>)
    }

    lastIndex = match.index + latex.length
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : <span>{text}</span>
}

const typeLabels: Record<string, string> = {
  single: '单选题',
  multiple: '多选题',
  fill: '填空题',
}

export default function StudentPaper() {
  const { paperId } = useParams<{ paperId: string }>()
  const [paper, setPaper] = useState<Paper | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [studentName, setStudentName] = useState('')
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (paperId) {
      loadPaper()
    }
  }, [paperId])

  const loadPaper = async () => {
    if (!paperId) return
    setLoading(true)
    try {
      const paperData = await fetchPaper(paperId)
      setPaper(paperData)

      const questionsData = await fetchQuestions({ chapterId: paperData.chapterId })
      const paperQuestions = paperData.questionIds
        .map((id) => questionsData.find((q) => q.id === id))
        .filter((q): q is Question => q !== undefined)
      setQuestions(paperQuestions)

      const initialAnswers: Record<string, string[]> = {}
      paperQuestions.forEach((q) => {
        initialAnswers[q.id] = []
      })
      setAnswers(initialAnswers)
    } catch (error) {
      console.error('Failed to load paper:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOptionClick = (questionId: string, optionKey: string, isMultiple: boolean) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionId] || []
      let newAnswers: string[]
      if (isMultiple) {
        newAnswers = currentAnswers.includes(optionKey)
          ? currentAnswers.filter((k) => k !== optionKey)
          : [...currentAnswers, optionKey]
      } else {
        newAnswers = [optionKey]
      }
      return { ...prev, [questionId]: newAnswers }
    })
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[questionId]
      return newErrors
    })
  }

  const handleFillChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: [value],
    }))
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[questionId]
      return newErrors
    })
  }

  const validateAnswers = () => {
    const newErrors: Record<string, string> = {}
    questions.forEach((q) => {
      const answer = answers[q.id] || []
      if (answer.length === 0 || (answer.length === 1 && answer[0].trim() === '')) {
        newErrors[q.id] = '请作答此题'
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!studentName.trim()) {
      alert('请输入姓名')
      return
    }
    if (!validateAnswers()) {
      alert('请完成所有题目')
      return
    }
    if (!paper || !paperId) return

    setSubmitting(true)
    try {
      const studentAnswers: StudentAnswer[] = Object.entries(answers).map(
        ([questionId, answer]) => ({
          questionId,
          answer,
        }),
      )

      await submitAnswer({
        paperId,
        studentName: studentName.trim(),
        answers: studentAnswers,
      })
      setSubmitted(true)
    } catch (error) {
      console.error('Failed to submit answer:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <div className="rounded-full bg-secondary/10 p-8">
            <Send size={64} className="text-secondary" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-darkBlue">提交成功！</h2>
          <p className="mt-2 text-gray-500">
            {studentName}，你的答卷已成功提交，请等待教师批改。
          </p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageHeader
        title={paper?.title || '学生作答'}
        description={paper ? `${questions.length} 题，共 ${paper.totalScore} 分` : ''}
      />

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <User size={20} className="text-gray-400" />
            <label className="text-sm font-medium text-gray-700">学生姓名：</label>
          </div>
          <input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="请输入你的姓名"
            className="flex-1 max-w-xs rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">加载中...</div>
      ) : questions.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>试卷不存在或已被删除</p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className={cn(
                'rounded-lg border border-gray-200 bg-white p-6 transition-all',
                errors[question.id] && 'border-red-300 bg-red-50/50',
              )}
            >
              <div className="mb-4">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-darkBlue">{index + 1}.</span>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {typeLabels[question.type]}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {question.score} 分
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        {question.knowledgePoint}
                      </span>
                    </div>
                    <div className="text-gray-800 leading-relaxed">
                      {renderLatex(question.content)}
                    </div>
                  </div>
                </div>
              </div>

              {(question.type === 'single' || question.type === 'multiple') && question.options && (
                <div className="ml-6 space-y-3">
                  {question.options.map((option) => (
                    <OptionCard
                      key={option.key}
                      option={option}
                      selected={(answers[question.id] || []).includes(option.key)}
                      onClick={() =>
                        handleOptionClick(question.id, option.key, question.type === 'multiple')
                      }
                    />
                  ))}
                </div>
              )}

              {question.type === 'fill' && (
                <div className="ml-6">
                  <FillInput
                    value={(answers[question.id] || [''])[0]}
                    onChange={(value) => handleFillChange(question.id, value)}
                    placeholder="请输入答案"
                  />
                </div>
              )}

              {errors[question.id] && (
                <p className="mt-2 text-sm text-red-500">{errors[question.id]}</p>
              )}
            </div>
          ))}

          <div className="sticky bottom-0 rounded-lg border border-gray-200 bg-white/95 p-4 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="text-sm text-gray-500">
                已完成 {Object.values(answers).filter((a) => a.length > 0 && a[0]?.trim() !== '').length} / {questions.length} 题
              </div>
              <Button
                size="lg"
                onClick={handleSubmit}
                loading={submitting}
                disabled={!studentName.trim()}
              >
                <Send size={20} /> 提交答卷
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
