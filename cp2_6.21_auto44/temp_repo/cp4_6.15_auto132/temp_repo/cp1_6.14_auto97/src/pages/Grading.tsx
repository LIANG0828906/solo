import { useState, useEffect } from 'react'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
} from 'lucide-react'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'
import Button from '@/components/Button'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { fetchSubmissions, fetchPaper } from '@/modules/paper'
import { fetchQuestions } from '@/modules/questionBank'
import { autoGrade, manualGrade } from '@/modules/grading'
import type {
  PaperSubmission,
  Question,
  GradingResult,
  Paper,
} from '@shared/types'

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

interface SubmissionWithGrading extends PaperSubmission {
  gradingResult?: GradingResult
  isAutoGraded: boolean
}

export default function Grading() {
  const { setCurrentStudent } = useStore()
  const [submissions, setSubmissions] = useState<SubmissionWithGrading[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [papers, setPapers] = useState<Paper[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithGrading | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoGrading, setAutoGrading] = useState<string | null>(null)
  const [savingGrade, setSavingGrade] = useState<string | null>(null)

  const [expandedExplanations, setExpandedExplanations] = useState<Set<string>>(new Set())
  const [manualScores, setManualScores] = useState<Record<string, number>>({})
  const [manualComments, setManualComments] = useState<Record<string, string>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [subs, qs] = await Promise.all([
        fetchSubmissions(),
        fetchQuestions(),
      ])

      const paperIds = [...new Set(subs.map((s) => s.paperId))]
      const paperPromises = paperIds.map((id) => fetchPaper(id))
      const p = await Promise.all(paperPromises)
      setPapers(p)

      const subsWithGrading: SubmissionWithGrading[] = subs.map((s) => ({
        ...s,
        isAutoGraded: false,
      }))

      setSubmissions(subsWithGrading)
      setQuestions(qs)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPaperTitle = (paperId: string) => {
    return papers.find((p) => p.id === paperId)?.title || '未知试卷'
  }

  const getQuestion = (questionId: string) => {
    return questions.find((q) => q.id === questionId)
  }

  const getStudentAnswer = (submission: PaperSubmission, questionId: string) => {
    return submission.answers.find((a) => a.questionId === questionId)?.answer || []
  }

  const checkAnswer = (question: Question, studentAnswer: string[]) => {
    if (question.type === 'fill' && question.fillAnswers) {
      return question.fillAnswers.some((fa) => {
        const correctAnswer = fa.answer.toLowerCase().trim()
        const answer = (studentAnswer[0] || '').toLowerCase().trim()
        if (fa.mode === 'strict') {
          return answer === correctAnswer
        } else {
          return answer.includes(correctAnswer) || correctAnswer.includes(answer)
        }
      })
    }

    if (question.type === 'single' || question.type === 'multiple') {
      if (!question.correctAnswer) return false
      const correct = [...question.correctAnswer].sort()
      const answer = [...studentAnswer].sort()
      return correct.length === answer.length && correct.every((v, i) => v === answer[i])
    }

    return false
  }

  const handleAutoGrade = async (submissionId: string) => {
    setAutoGrading(submissionId)
    try {
      await autoGrade(submissionId)

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? { ...s, isAutoGraded: true }
            : s,
        ),
      )

      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission((prev) =>
          prev ? { ...prev, isAutoGraded: true } : null,
        )
      }
    } catch (error) {
      console.error('Failed to auto grade:', error)
    } finally {
      setAutoGrading(null)
    }
  }

  const handleManualGrade = async (submissionId: string, questionId: string) => {
    const score = manualScores[questionId] ?? 0
    const comment = manualComments[questionId] || ''
    const question = getQuestion(questionId)
    if (!question) return

    if (score < 0 || score > question.score) {
      alert(`分数必须在 0 到 ${question.score} 之间`)
      return
    }

    setSavingGrade(questionId)
    try {
      await manualGrade(submissionId, questionId, score, comment)
      setSavingGrade(null)
    } catch (error) {
      console.error('Failed to manual grade:', error)
      setSavingGrade(null)
    }
  }

  const toggleExplanation = (questionId: string) => {
    const newExpanded = new Set(expandedExplanations)
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId)
    } else {
      newExpanded.add(questionId)
    }
    setExpandedExplanations(newExpanded)
  }

  const handleSelectSubmission = (submission: SubmissionWithGrading) => {
    setSelectedSubmission(submission)
    setCurrentStudent({ name: submission.studentName })
    setManualScores({})
    setManualComments({})
    setExpandedExplanations(new Set())
  }

  const calculateSubmissionScore = (submission: SubmissionWithGrading) => {
    let total = 0
    submission.answers.forEach((answer) => {
      const question = getQuestion(answer.questionId)
      if (question) {
        const isCorrect = checkAnswer(question, answer.answer)
        if (isCorrect) {
          total += question.score
        }
      }
    })
    return total
  }

  const calculateSubmissionTotal = (submission: SubmissionWithGrading) => {
    let total = 0
    submission.answers.forEach((answer) => {
      const question = getQuestion(answer.questionId)
      if (question) {
        total += question.score
      }
    })
    return total
  }

  return (
    <Layout>
      <PageHeader
        title="批改中心"
        description="查看和批改学生答卷"
        rightContent={
          selectedSubmission && (
            <Button
              onClick={() => handleAutoGrade(selectedSubmission.id)}
              loading={autoGrading === selectedSubmission.id}
              size="sm"
            >
              <Sparkles size={16} /> 自动批改
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="w-full md:w-1/3">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="font-semibold text-darkBlue">
                学生提交列表
                <span className="ml-2 text-sm font-normal text-gray-500">
                  （{submissions.length} 份）
                </span>
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-400">加载中...</div>
            ) : submissions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>暂无学生提交</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-auto">
                {submissions.map((submission) => {
                  const score = calculateSubmissionScore(submission)
                  const total = calculateSubmissionTotal(submission)
                  return (
                    <div
                      key={submission.id}
                      onClick={() => handleSelectSubmission(submission)}
                      className={cn(
                        'cursor-pointer border-b border-gray-100 p-4 transition-colors hover:bg-[rgba(54,156,255,0.08)]',
                        selectedSubmission?.id === submission.id &&
                          'bg-primary/5',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <span className="font-semibold text-primary">
                              {submission.studentName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {submission.studentName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getPaperTitle(submission.paperId)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-darkBlue">
                            {score}
                            <span className="text-sm font-normal text-gray-400">
                              /{total}
                            </span>
                          </p>
                          <div className="flex items-center gap-1">
                            {submission.isAutoGraded ? (
                              <>
                                <CheckCircle size={14} className="text-secondary" />
                                <span className="text-xs text-secondary">已批改</span>
                              </>
                            ) : (
                              <>
                                <Clock size={14} className="text-yellow-500" />
                                <span className="text-xs text-yellow-600">待批改</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="font-semibold text-darkBlue">
                {selectedSubmission
                  ? `${selectedSubmission.studentName} 的答卷`
                  : '请选择学生查看答卷'}
              </h3>
            </div>

            {!selectedSubmission ? (
              <div className="p-12 text-center text-gray-400">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>点击左侧列表选择学生答卷</p>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-auto p-4">
                <div className="space-y-6">
                  {selectedSubmission.answers.map((answer, index) => {
                    const question = getQuestion(answer.questionId)
                    if (!question) return null

                    const studentAnswer = answer.answer
                    const isCorrect = checkAnswer(question, studentAnswer)
                    const isExpanded = expandedExplanations.has(question.id)
                    const needsManual = question.type === 'fill'

                    return (
                      <div
                        key={question.id}
                        className={cn(
                          'rounded-lg border-2 p-4 transition-all',
                          isCorrect && question.type !== 'fill'
                            ? 'border-secondary/30 bg-secondary/5'
                            : !isCorrect && question.type !== 'fill'
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 bg-white',
                        )}
                      >
                        <div className="mb-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <span className="font-bold text-darkBlue">
                                {index + 1}.
                              </span>
                              <div className="flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                    {typeLabels[question.type]}
                                  </span>
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                    {question.score} 分
                                  </span>
                                  {question.type !== 'fill' && (
                                    isCorrect ? (
                                      <span className="flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                                        <CheckCircle size={12} /> 正确
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                                        <XCircle size={12} /> 错误
                                      </span>
                                    )
                                  )}
                                </div>
                                <div className="text-gray-800 leading-relaxed">
                                  {renderLatex(question.content)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {(question.type === 'single' || question.type === 'multiple') && question.options && (
                          <div className="ml-8 space-y-2">
                            {question.options.map((option) => {
                              const isStudentSelected = studentAnswer.includes(option.key)
                              const isCorrectOption = question.correctAnswer?.includes(option.key)
                              return (
                                <div
                                  key={option.key}
                                  className={cn(
                                    'flex items-start gap-2 rounded-lg border-2 p-3',
                                    isCorrectOption
                                      ? 'border-secondary bg-secondary/10'
                                      : isStudentSelected
                                      ? 'border-red-300 bg-red-100'
                                      : 'border-gray-200 bg-white',
                                  )}
                                >
                                  <div
                                    className={cn(
                                      'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                      isCorrectOption
                                        ? 'bg-secondary text-white'
                                        : isStudentSelected
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-100 text-gray-600',
                                    )}
                                  >
                                    {option.key}
                                  </div>
                                  <div className="flex-1 pt-0.5">
                                    <p
                                      className={cn(
                                        'text-sm',
                                        isCorrectOption
                                          ? 'text-secondary'
                                          : isStudentSelected
                                          ? 'text-red-600 line-through'
                                          : 'text-gray-600',
                                      )}
                                    >
                                      {option.content}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {question.type === 'fill' && (
                          <div className="ml-8 space-y-3">
                            <div className="rounded-lg border border-gray-200 p-3">
                              <p className="mb-1 text-xs text-gray-500">学生答案</p>
                              <p className="font-medium text-gray-800">
                                {studentAnswer[0] || '(未作答)'}
                              </p>
                            </div>

                            {question.fillAnswers && (
                              <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-3">
                                <p className="mb-1 text-xs text-gray-500">正确答案</p>
                                <div className="space-y-1">
                                  {question.fillAnswers.map((fa, i) => (
                                    <p key={i} className="font-medium text-secondary">
                                      {fa.answer} ({fa.mode === 'strict' ? '严格匹配' : '模糊匹配'})
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs text-gray-500">
                                  打分（满分 {question.score}）
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={question.score}
                                  value={manualScores[question.id] ?? ''}
                                  onChange={(e) =>
                                    setManualScores((prev) => ({
                                      ...prev,
                                      [question.id]: Number(e.target.value),
                                    }))
                                  }
                                  placeholder="请输入分数"
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-gray-500">
                                  <MessageSquare size={12} className="inline mr-1" />
                                  评语
                                </label>
                                <input
                                  type="text"
                                  value={manualComments[question.id] || ''}
                                  onChange={(e) =>
                                    setManualComments((prev) => ({
                                      ...prev,
                                      [question.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="输入评语（可选）"
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
                                />
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() =>
                                handleManualGrade(selectedSubmission.id, question.id)
                              }
                              loading={savingGrade === question.id}
                              disabled={manualScores[question.id] === undefined}
                            >
                              保存批改
                            </Button>
                          </div>
                        )}

                        <div className="mt-4 border-t border-gray-100 pt-4">
                          <button
                            onClick={() => toggleExplanation(question.id)}
                            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                          >
                            {isExpanded ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                            {isExpanded ? '收起解析' : '查看解析'}
                          </button>

                          <div
                            className={cn(
                              'grid overflow-hidden transition-all duration-300 ease-in-out',
                              isExpanded
                                ? 'grid-rows-[1fr] opacity-100 mt-3'
                                : 'grid-rows-[0fr] opacity-0',
                            )}
                          >
                            <div className="min-h-0">
                              <div className="rounded-lg bg-blue-50 p-4">
                                <p className="mb-1 text-xs font-medium text-primary">解析</p>
                                <div className="text-gray-700 leading-relaxed">
                                  {renderLatex(question.explanation)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
