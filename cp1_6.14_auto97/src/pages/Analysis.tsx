import { useState, useEffect } from 'react'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import {
  Users,
  TrendingDown,
  BookOpen,
  FileText,
  Sparkles,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'
import Button from '@/components/Button'
import KnowledgePieChart from '@/components/KnowledgePieChart'
import Modal from '@/components/Modal'
import PaperPreview from '@/components/PaperPreview'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { fetchSubmissions } from '@/modules/paper'
import { fetchWeakPoints, fetchRecommendQuestions } from '@/modules/analysis'
import { createPaper } from '@/modules/paper'
import type { WeakPoint, Question, Paper } from '@shared/types'

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

const difficultyLabels: Record<string, string> = {
  basic: '基础',
  medium: '中等',
  hard: '困难',
}

const difficultyColors: Record<string, string> = {
  basic: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

export default function Analysis() {
  const { setSelectedQuestions } = useStore()
  const [students, setStudents] = useState<string[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([])
  const [recommendQuestions, setRecommendQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [showPreview, setShowPreview] = useState(false)
  const [createdPaper, setCreatedPaper] = useState<Paper | null>(null)
  const [paperTitle, setPaperTitle] = useState('')
  const [titleModalOpen, setTitleModalOpen] = useState(false)

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    if (selectedStudent) {
      loadAnalysis()
    }
  }, [selectedStudent])

  const loadStudents = async () => {
    try {
      const submissions = await fetchSubmissions()
      const uniqueStudents = [...new Set(submissions.map((s) => s.studentName))]
      setStudents(uniqueStudents)
      if (uniqueStudents.length > 0) {
        setSelectedStudent(uniqueStudents[0])
      }
    } catch (error) {
      console.error('Failed to load students:', error)
    }
  }

  const loadAnalysis = async () => {
    if (!selectedStudent) return
    setLoading(true)
    try {
      const [weakPointsData, recommendData] = await Promise.all([
        fetchWeakPoints(selectedStudent),
        fetchRecommendQuestions(selectedStudent),
      ])
      setWeakPoints(weakPointsData)
      setRecommendQuestions(recommendData)
    } catch (error) {
      console.error('Failed to load analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePaper = () => {
    if (recommendQuestions.length === 0) {
      alert('暂无推荐题目')
      return
    }
    setPaperTitle(`${selectedStudent} 薄弱知识点练习卷`)
    setTitleModalOpen(true)
  }

  const handleConfirmGenerate = async () => {
    if (!paperTitle.trim() || recommendQuestions.length === 0) return
    setGenerating(true)
    try {
      const chapterId = recommendQuestions[0]?.chapterId || ''
      const paper = await createPaper({
        title: paperTitle.trim(),
        chapterId,
        questionIds: recommendQuestions.map((q) => q.id),
      })
      setCreatedPaper(paper)
      setTitleModalOpen(false)
      setShowPreview(true)
      setSelectedQuestions(recommendQuestions)
    } catch (error) {
      console.error('Failed to create paper:', error)
    } finally {
      setGenerating(false)
    }
  }

  const sortedWeakPoints = [...weakPoints].sort((a, b) => {
    const errorRateA = a.totalCount > 0 ? a.errorCount / a.totalCount : 0
    const errorRateB = b.totalCount > 0 ? b.errorCount / b.totalCount : 0
    return errorRateB - errorRateA
  })

  return (
    <Layout>
      <PageHeader
        title="错题分析"
        description="分析学生薄弱知识点，生成针对性练习"
        rightContent={
          recommendQuestions.length > 0 && (
            <Button onClick={handleGeneratePaper} size="sm">
              <Sparkles size={16} /> 一键生成练习卷
            </Button>
          )
        }
      />

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-gray-400" />
            <label className="text-sm font-medium text-gray-700">选择学生：</label>
          </div>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="max-w-xs rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
          >
            <option value="">请选择学生</option>
            {students.map((student) => (
              <option key={student} value={student}>
                {student}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedStudent ? (
        <div className="p-12 text-center text-gray-400">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p>请选择学生查看分析报告</p>
        </div>
      ) : loading ? (
        <div className="p-12 text-center text-gray-400">加载中...</div>
      ) : (
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="w-full md:w-1/3">
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="font-semibold text-darkBlue">知识点错误占比</h3>
              </div>
              <div className="p-4">
                <KnowledgePieChart data={sortedWeakPoints} />
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <TrendingDown size={18} className="text-red-500" />
                  <h3 className="font-semibold text-darkBlue">薄弱知识点</h3>
                </div>
              </div>
              <div className="max-h-[400px] overflow-auto">
                {sortedWeakPoints.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <p>暂无数据</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {sortedWeakPoints.map((wp, index) => {
                      const errorRate = wp.totalCount > 0
                        ? ((wp.errorCount / wp.totalCount) * 100).toFixed(1)
                        : '0'
                      return (
                        <div
                          key={wp.name}
                          className="p-4 transition-colors hover:bg-[rgba(54,156,255,0.08)]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                                  index === 0
                                    ? 'bg-red-500 text-white'
                                    : index === 1
                                    ? 'bg-orange-500 text-white'
                                    : index === 2
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-gray-300 text-gray-600',
                                )}
                              >
                                {index + 1}
                              </span>
                              <span className="font-medium text-gray-800">
                                {wp.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-red-500">
                                {errorRate}%
                              </p>
                              <p className="text-xs text-gray-400">
                                {wp.errorCount}/{wp.totalCount} 题
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-500"
                              style={{ width: `${errorRate}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3">
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-primary" />
                  <h3 className="font-semibold text-darkBlue">
                    推荐练习题
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      （{recommendQuestions.length} 题）
                    </span>
                  </h3>
                </div>
              </div>

              {recommendQuestions.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>暂无推荐题目</p>
                  <p className="mt-1 text-sm">请先完成一些题目练习</p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-auto divide-y divide-gray-100">
                  {recommendQuestions.map((question, index) => {
                    const relatedWeakPoint = sortedWeakPoints.find(
                      (wp) => wp.name === question.knowledgePoint,
                    )
                    const errorRate = relatedWeakPoint && relatedWeakPoint.totalCount > 0
                      ? ((relatedWeakPoint.errorCount / relatedWeakPoint.totalCount) * 100).toFixed(1)
                      : null

                    return (
                      <div
                        key={question.id}
                        className="p-4 transition-colors hover:bg-[rgba(54,156,255,0.08)]"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-1 flex-shrink-0 text-sm font-bold text-primary">
                            {index + 1}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="mb-2 flex flex-wrap gap-2">
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {typeLabels[question.type]}
                              </span>
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-xs font-medium',
                                  difficultyColors[question.difficulty],
                                )}
                              >
                                {difficultyLabels[question.difficulty]}
                              </span>
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                {question.score} 分
                              </span>
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-600">
                                {question.knowledgePoint}
                              </span>
                              {errorRate && (
                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                                  错误率 {errorRate}%
                                </span>
                              )}
                            </div>
                            <div className="text-gray-800 leading-relaxed">
                              {renderLatex(question.content)}
                            </div>

                            {(question.type === 'single' || question.type === 'multiple') && question.options && (
                              <div className="mt-3 ml-6 space-y-2">
                                {question.options.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className="flex items-start gap-2 rounded-lg border border-gray-200 p-2"
                                  >
                                    <span className="text-xs font-bold text-gray-500">
                                      {option.key}.
                                    </span>
                                    <span className="text-sm text-gray-600">
                                      {renderLatex(option.content)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {question.correctAnswer && (
                              <div className="mt-3 rounded-lg bg-secondary/5 p-3">
                                <p className="text-xs font-medium text-secondary">
                                  正确答案：{question.correctAnswer.join('、')}
                                </p>
                              </div>
                            )}

                            {question.fillAnswers && (
                              <div className="mt-3 rounded-lg bg-secondary/5 p-3">
                                <p className="text-xs font-medium text-secondary">
                                  正确答案：
                                  {question.fillAnswers.map((fa, i) => (
                                    <span key={i} className="mr-2">
                                      {fa.answer} ({fa.mode === 'strict' ? '严格' : '模糊'})
                                    </span>
                                  ))}
                                </p>
                              </div>
                            )}
                          </div>
                          <ChevronRight size={20} className="mt-1 flex-shrink-0 text-gray-400" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={titleModalOpen}
        onClose={() => setTitleModalOpen(false)}
        title="设置练习卷标题"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              试卷标题
            </label>
            <input
              type="text"
              value={paperTitle}
              onChange={(e) => setPaperTitle(e.target.value)}
              placeholder="请输入试卷标题"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">已选题目：</span>
              {recommendQuestions.length} 题，
              共 {recommendQuestions.reduce((sum, q) => sum + q.score, 0)} 分
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setTitleModalOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleConfirmGenerate} loading={generating}>
              确认生成
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false)
          setCreatedPaper(null)
        }}
        title="练习卷预览"
        className="max-w-4xl"
      >
        <PaperPreview
          paper={createdPaper || undefined}
          questions={recommendQuestions}
          title={createdPaper?.title || paperTitle}
        />
        {createdPaper && (
          <div className="mt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowPreview(false)
                setCreatedPaper(null)
              }}
            >
              关闭
            </Button>
            <Button
              onClick={() => {
                setShowPreview(false)
                setCreatedPaper(null)
                setSelectedQuestions([])
              }}
            >
              完成
            </Button>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
