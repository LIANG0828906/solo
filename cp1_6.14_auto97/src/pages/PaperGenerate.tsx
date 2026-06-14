import { useState, useEffect } from 'react'
import {
  Plus,
  Minus,
  Search,
  Filter,
  FileText,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'
import Button from '@/components/Button'
import PaperPreview from '@/components/PaperPreview'
import Modal from '@/components/Modal'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { fetchCourses } from '@/modules/course'
import { fetchQuestions } from '@/modules/questionBank'
import { createPaper } from '@/modules/paper'
import type {
  Course,
  Question,
  QuestionType,
  Difficulty,
  Paper,
} from '@shared/types'

const typeLabels: Record<QuestionType, string> = {
  single: '单选题',
  multiple: '多选题',
  fill: '填空题',
}

const difficultyLabels: Record<Difficulty, string> = {
  basic: '基础',
  medium: '中等',
  hard: '困难',
}

const difficultyColors: Record<Difficulty, string> = {
  basic: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

export default function PaperGenerate() {
  const { selectedCourse, selectedChapter, selectedQuestions, setSelectedCourse, setSelectedChapter, toggleSelectedQuestion, clearSelectedQuestions } =
    useStore()

  const [courses, setCourses] = useState<Course[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const [filterType, setFilterType] = useState<QuestionType | ''>('')
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | ''>('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const [showPreview, setShowPreview] = useState(false)
  const [paperTitle, setPaperTitle] = useState('')
  const [titleModalOpen, setTitleModalOpen] = useState(false)
  const [createdPaper, setCreatedPaper] = useState<Paper | null>(null)

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    if (selectedChapter) {
      loadQuestions()
    } else {
      setQuestions([])
    }
  }, [selectedChapter, filterType, filterDifficulty, searchKeyword])

  const loadCourses = async () => {
    try {
      const data = await fetchCourses()
      setCourses(data)
    } catch (error) {
      console.error('Failed to load courses:', error)
    }
  }

  const loadQuestions = async () => {
    if (!selectedChapter) return
    setLoading(true)
    try {
      const params = {
        chapterId: selectedChapter.id,
        ...(filterType && { type: filterType }),
        ...(filterDifficulty && { difficulty: filterDifficulty }),
      }
      const data = await fetchQuestions(params)

      let filtered = data
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase()
        filtered = data.filter(
          (q) =>
            q.content.toLowerCase().includes(keyword) ||
            q.knowledgePoint.toLowerCase().includes(keyword),
        )
      }
      setQuestions(filtered)
    } catch (error) {
      console.error('Failed to load questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const isSelected = (questionId: string) => {
    return selectedQuestions.some((q) => q.id === questionId)
  }

  const handleSelectAll = () => {
    const availableQuestions = questions.filter(
      (q) => !selectedQuestions.some((sq) => sq.id === q.id),
    )
    availableQuestions.forEach((q) => toggleSelectedQuestion(q))
  }

  const handleDeselectAll = () => {
    clearSelectedQuestions()
  }

  const handleGeneratePaper = () => {
    if (selectedQuestions.length === 0) {
      alert('请至少选择一道题目')
      return
    }
    const defaultTitle = `${selectedCourse?.name || ''}${selectedChapter?.name || ''}练习卷`
    setPaperTitle(defaultTitle)
    setTitleModalOpen(true)
  }

  const handleConfirmGenerate = async () => {
    if (!paperTitle.trim() || !selectedChapter) return
    setCreating(true)
    try {
      const paper = await createPaper({
        title: paperTitle.trim(),
        chapterId: selectedChapter.id,
        questionIds: selectedQuestions.map((q) => q.id),
      })
      setCreatedPaper(paper)
      setTitleModalOpen(false)
      setShowPreview(true)
    } catch (error) {
      console.error('Failed to create paper:', error)
    } finally {
      setCreating(false)
    }
  }

  const totalScore = selectedQuestions.reduce((sum, q) => sum + q.score, 0)

  return (
    <Layout>
      <PageHeader
        title="组卷中心"
        description="从题库中选择题目生成试卷"
      />

      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Filter size={18} />
          <span className="text-sm font-medium">筛选条件</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCourse?.id || ''}
            onChange={(e) => {
              const course = courses.find((c) => c.id === e.target.value)
              if (course) {
                setSelectedCourse(course)
                setSelectedChapter(null)
                clearSelectedQuestions()
              } else {
                setSelectedCourse(null)
                setSelectedChapter(null)
                clearSelectedQuestions()
              }
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">选择课程</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>

          <select
            value={selectedChapter?.id || ''}
            onChange={(e) => {
              const chapter = selectedCourse?.chapters.find(
                (ch) => ch.id === e.target.value,
              )
              if (chapter) {
                setSelectedChapter(chapter)
                clearSelectedQuestions()
              } else {
                setSelectedChapter(null)
                clearSelectedQuestions()
              }
            }}
            disabled={!selectedCourse}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">选择章节</option>
            {selectedCourse?.chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.name}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as QuestionType | '')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">全部题型</option>
            <option value="single">单选题</option>
            <option value="multiple">多选题</option>
            <option value="fill">填空题</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value as Difficulty | '')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">全部难度</option>
            <option value="basic">基础</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索题目内容或知识点..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="w-full md:w-1/2">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="font-semibold text-darkBlue">
                题目列表
                {selectedChapter && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    （{questions.length} 题）
                  </span>
                )}
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={!selectedChapter || questions.length === 0}
                >
                  <Plus size={14} /> 全选
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={selectedQuestions.length === 0}
                >
                  <Minus size={14} /> 清空
                </Button>
              </div>
            </div>

            {!selectedChapter ? (
              <div className="p-12 text-center text-gray-400">
                <Search size={48} className="mx-auto mb-4 opacity-50" />
                <p>请先选择课程和章节</p>
              </div>
            ) : loading ? (
              <div className="p-12 text-center text-gray-400">加载中...</div>
            ) : questions.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <p>暂无符合条件的题目</p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-auto divide-y divide-gray-100">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    onClick={() => toggleSelectedQuestion(question)}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 p-4 transition-colors',
                      'hover:bg-[rgba(54,156,255,0.08)]',
                      isSelected(question.id) && 'bg-primary/5',
                    )}
                  >
                    <div
                      className={cn(
                        'mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors',
                        isSelected(question.id)
                          ? 'border-primary bg-primary'
                          : 'border-gray-300',
                      )}
                    >
                      {isSelected(question.id) && (
                        <CheckCircle2 size={14} className="text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex flex-wrap gap-2">
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
                      </div>
                      <p className="line-clamp-2 text-sm text-gray-800">
                        {question.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="font-semibold text-darkBlue">
                已选题目
                <span className="ml-2 text-sm font-normal text-gray-500">
                  （{selectedQuestions.length} 题，{totalScore} 分）
                </span>
              </h3>
              {selectedQuestions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(true)}
                >
                  <FileText size={14} /> 预览
                </Button>
              )}
            </div>

            {selectedQuestions.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>点击左侧题目添加到试卷</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-auto divide-y divide-gray-100">
                {selectedQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="flex items-start gap-3 p-4 transition-colors hover:bg-[rgba(54,156,255,0.08)]"
                  >
                    <span className="mt-1 flex-shrink-0 text-sm font-bold text-primary">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex flex-wrap gap-2">
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
                      </div>
                      <p className="line-clamp-2 text-sm text-gray-800">
                        {question.content}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleSelectedQuestion(question)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">已选题目</p>
              <p className="text-2xl font-bold text-darkBlue">
                {selectedQuestions.length}
                <span className="ml-1 text-sm font-normal text-gray-500">题</span>
              </p>
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-sm text-gray-500">总分</p>
              <p className="text-2xl font-bold text-primary">
                {totalScore}
                <span className="ml-1 text-sm font-normal text-gray-500">分</span>
              </p>
            </div>
          </div>
          <Button
            size="lg"
            onClick={handleGeneratePaper}
            disabled={selectedQuestions.length === 0 || !selectedChapter}
          >
            <ChevronRight size={20} /> 生成试卷
          </Button>
        </div>
      </div>

      <Modal
        isOpen={titleModalOpen}
        onClose={() => setTitleModalOpen(false)}
        title="设置试卷标题"
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
              {selectedQuestions.length} 题，{totalScore} 分
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setTitleModalOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleConfirmGenerate} loading={creating}>
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
        title={createdPaper ? '试卷预览' : '已选题目预览'}
        className="max-w-4xl"
      >
        <PaperPreview
          paper={createdPaper || undefined}
          questions={selectedQuestions}
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
                clearSelectedQuestions()
                setShowPreview(false)
                setCreatedPaper(null)
              }}
            >
              继续组卷
            </Button>
          </div>
        )}
      </Modal>
    </Layout>
  )
}
