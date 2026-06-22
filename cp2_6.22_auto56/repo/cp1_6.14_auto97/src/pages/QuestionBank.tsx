import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, X, Filter } from 'lucide-react'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'
import Button from '@/components/Button'
import SplitPane from '@/components/SplitPane'
import QuestionEditor from '@/components/QuestionEditor'
import QuestionPreview from '@/components/QuestionPreview'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { fetchCourses } from '@/modules/course'
import {
  fetchQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '@/modules/questionBank'
import type { Course, Question, QuestionType, Difficulty } from '@shared/types'

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

export default function QuestionBank() {
  const { selectedCourse, selectedChapter, setSelectedCourse, setSelectedChapter } =
    useStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)

  const [filterType, setFilterType] = useState<QuestionType | ''>('')
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | ''>('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const [isEditing, setIsEditing] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [saving, setSaving] = useState(false)

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

  const handleAddQuestion = () => {
    if (!selectedChapter) {
      alert('请先选择一个章节')
      return
    }
    setEditingQuestion(null)
    setIsEditing(true)
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
    setIsEditing(true)
  }

  const handleSaveQuestion = async (data: Partial<Question>) => {
    if (!selectedChapter) return
    setSaving(true)
    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, data)
      } else {
        await createQuestion(data as any)
      }
      setIsEditing(false)
      setEditingQuestion(null)
      loadQuestions()
    } catch (error) {
      console.error('Failed to save question:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuestion = async (question: Question) => {
    if (!confirm(`确定删除此题吗？`)) return
    try {
      await deleteQuestion(question.id)
      loadQuestions()
    } catch (error) {
      console.error('Failed to delete question:', error)
    }
  }

  const handleCloseEditor = () => {
    setIsEditing(false)
    setEditingQuestion(null)
  }

  const allChapters = courses.flatMap((course) =>
    course.chapters.map((chapter) => ({ ...chapter, courseName: course.name })),
  )

  return (
    <Layout>
      <PageHeader
        title="题库管理"
        description="管理各章节的题目"
        rightContent={
          <Button onClick={handleAddQuestion} size="sm">
            <Plus size={16} /> 新建题目
          </Button>
        }
      />

      {isEditing ? (
        <div className="h-[calc(100vh-200px)] min-h-[600px]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-darkBlue">
              {editingQuestion ? '编辑题目' : '新建题目'}
            </h3>
            <Button variant="outline" size="sm" onClick={handleCloseEditor}>
              <X size={16} /> 关闭
            </Button>
          </div>
          <SplitPane
            leftPane={
              <QuestionEditor
                question={editingQuestion}
                chapterId={selectedChapter?.id || ''}
                onSave={handleSaveQuestion}
              />
            }
            rightPane={
              <QuestionPreview
                question={editingQuestion}
                showAnswer={true}
              />
            }
            initialSplit={50}
            className="h-full"
          />
        </div>
      ) : (
        <>
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
                  } else {
                    setSelectedCourse(null)
                    setSelectedChapter(null)
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
                  const chapter = allChapters.find((ch) => ch.id === e.target.value)
                  if (chapter) {
                    const course = courses.find(
                      (c) => c.id === selectedCourse?.id,
                    )
                    if (course) {
                      setSelectedChapter(chapter)
                    }
                  } else {
                    setSelectedChapter(null)
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

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="font-semibold text-darkBlue">
                题目列表
                {selectedChapter && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    {selectedChapter.name}（{questions.length} 题）
                  </span>
                )}
              </h3>
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
                <p>暂无题目，点击上方按钮创建</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="flex items-start gap-4 p-4 transition-colors hover:bg-[rgba(54,156,255,0.08)]"
                  >
                    <span className="mt-1 flex-shrink-0 text-sm font-medium text-gray-400">
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
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                          {question.knowledgePoint}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-gray-800">
                        {question.content}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-primary"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question)}
                        className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  )
}
