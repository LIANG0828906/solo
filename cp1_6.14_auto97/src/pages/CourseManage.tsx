import { useState, useEffect } from 'react'
import {
  ChevronRight,
  ChevronDown,
  BookOpen,
  FileText,
  Plus,
  Edit2,
  Trash2,
  BookMarked,
} from 'lucide-react'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import {
  fetchCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  createChapter,
  updateChapter,
  deleteChapter,
} from '@/modules/course'
import type { Course, Chapter } from '@shared/types'

export default function CourseManage() {
  const { selectedCourse, selectedChapter, setSelectedCourse, setSelectedChapter } =
    useStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const [courseModalOpen, setCourseModalOpen] = useState(false)
  const [chapterModalOpen, setChapterModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [formName, setFormName] = useState('')
  const [formKnowledgePoints, setFormKnowledgePoints] = useState('')

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    setLoading(true)
    try {
      const data = await fetchCourses()
      setCourses(data)
    } catch (error) {
      console.error('Failed to load courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
    }
    setExpandedCourses(newExpanded)
  }

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course)
    setSelectedChapter(null)
  }

  const handleSelectChapter = (chapter: Chapter, course: Course) => {
    setSelectedCourse(course)
    setSelectedChapter(chapter)
  }

  const openAddCourse = () => {
    setEditingCourse(null)
    setFormName('')
    setCourseModalOpen(true)
  }

  const openEditCourse = (course: Course) => {
    setEditingCourse(course)
    setFormName(course.name)
    setCourseModalOpen(true)
  }

  const handleSaveCourse = async () => {
    if (!formName.trim()) return
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, formName.trim())
      } else {
        await createCourse(formName.trim())
      }
      setCourseModalOpen(false)
      loadCourses()
    } catch (error) {
      console.error('Failed to save course:', error)
    }
  }

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`确定删除课程"${course.name}"吗？相关章节和题目也会被删除。`)) return
    try {
      await deleteCourse(course.id)
      if (selectedCourse?.id === course.id) {
        setSelectedCourse(null)
        setSelectedChapter(null)
      }
      loadCourses()
    } catch (error) {
      console.error('Failed to delete course:', error)
    }
  }

  const openAddChapter = () => {
    if (!selectedCourse) {
      alert('请先选择一个课程')
      return
    }
    setEditingChapter(null)
    setFormName('')
    setFormKnowledgePoints('')
    setChapterModalOpen(true)
  }

  const openEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter)
    setFormName(chapter.name)
    setFormKnowledgePoints(chapter.knowledgePoints.join(', '))
    setChapterModalOpen(true)
  }

  const handleSaveChapter = async () => {
    if (!formName.trim() || !selectedCourse) return
    const knowledgePoints = formKnowledgePoints
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k)
    try {
      if (editingChapter) {
        await updateChapter(editingChapter.id, formName.trim(), knowledgePoints)
      } else {
        await createChapter(selectedCourse.id, formName.trim(), knowledgePoints)
      }
      setChapterModalOpen(false)
      loadCourses()
    } catch (error) {
      console.error('Failed to save chapter:', error)
    }
  }

  const handleDeleteChapter = async (chapter: Chapter) => {
    if (!confirm(`确定删除章节"${chapter.name}"吗？相关题目也会被删除。`)) return
    try {
      await deleteChapter(chapter.id)
      if (selectedChapter?.id === chapter.id) {
        setSelectedChapter(null)
      }
      loadCourses()
    } catch (error) {
      console.error('Failed to delete chapter:', error)
    }
  }

  return (
    <Layout>
      <PageHeader
        title="课程管理"
        description="管理课程和章节信息"
        rightContent={
          <div className="flex gap-2">
            <Button onClick={openAddCourse} size="sm">
              <Plus size={16} /> 新建课程
            </Button>
            <Button onClick={openAddChapter} variant="secondary" size="sm">
              <FileText size={16} /> 新建章节
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="w-full rounded-lg border border-gray-200 bg-white md:w-1/3">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="font-semibold text-darkBlue">课程列表</h3>
          </div>
          <div className="max-h-[600px] overflow-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-400">加载中...</div>
            ) : courses.length === 0 ? (
              <div className="p-8 text-center text-gray-400">暂无课程，点击上方按钮创建</div>
            ) : (
              <div className="py-2">
                {courses.map((course) => (
                  <div key={course.id}>
                    <div
                      className={cn(
                        'flex cursor-pointer items-center gap-2 px-4 py-2 transition-colors hover:bg-[rgba(54,156,255,0.08)]',
                        selectedCourse?.id === course.id &&
                          !selectedChapter &&
                          'bg-primary/10',
                      )}
                    >
                      <button
                        onClick={() => toggleCourse(course.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {expandedCourses.has(course.id) ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                      <BookOpen
                        size={18}
                        className="flex-shrink-0 text-primary"
                        onClick={() => handleSelectCourse(course)}
                      />
                      <span
                        className="flex-1 truncate"
                        onClick={() => handleSelectCourse(course)}
                      >
                        {course.name}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditCourse(course)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {expandedCourses.has(course.id) && course.chapters.length > 0 && (
                      <div className="ml-8">
                        {course.chapters.map((chapter) => (
                          <div
                            key={chapter.id}
                            className={cn(
                              'flex cursor-pointer items-center gap-2 px-4 py-2 transition-colors hover:bg-[rgba(54,156,255,0.08)]',
                              selectedChapter?.id === chapter.id &&
                                'bg-primary/10',
                            )}
                          >
                            <FileText
                              size={16}
                              className="flex-shrink-0 text-gray-400"
                              onClick={() => handleSelectChapter(chapter, course)}
                            />
                            <span
                              className="flex-1 truncate text-sm"
                              onClick={() => handleSelectChapter(chapter, course)}
                            >
                              {chapter.name}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => openEditChapter(chapter)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteChapter(chapter)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="font-semibold text-darkBlue">详情</h3>
          </div>
          <div className="p-6">
            {selectedChapter ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <FileText className="text-primary" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-darkBlue">
                      {selectedChapter.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      所属课程：{selectedCourse?.name}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h5 className="mb-2 font-medium text-gray-700">知识点</h5>
                  {selectedChapter.knowledgePoints.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedChapter.knowledgePoints.map((kp, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                        >
                          {kp}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">暂无知识点</p>
                  )}
                </div>
              </div>
            ) : selectedCourse ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <BookMarked className="text-primary" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-darkBlue">
                      {selectedCourse.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      创建时间：
                      {new Date(selectedCourse.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h5 className="mb-2 font-medium text-gray-700">章节列表</h5>
                  {selectedCourse.chapters.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCourse.chapters.map((chapter, index) => (
                        <div
                          key={chapter.id}
                          className="flex items-center justify-between rounded-lg bg-white p-3"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-400">
                              {index + 1}.
                            </span>
                            <span className="text-gray-700">{chapter.name}</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {chapter.knowledgePoints.length} 个知识点
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">暂无章节</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                <BookOpen size={48} className="mb-4 opacity-50" />
                <p>请选择课程或章节查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        title={editingCourse ? '编辑课程' : '新建课程'}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              课程名称
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="请输入课程名称"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setCourseModalOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleSaveCourse}>
              {editingCourse ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={chapterModalOpen}
        onClose={() => setChapterModalOpen(false)}
        title={editingChapter ? '编辑章节' : '新建章节'}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              章节名称
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="请输入章节名称"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              知识点（用逗号分隔）
            </label>
            <input
              type="text"
              value={formKnowledgePoints}
              onChange={(e) => setFormKnowledgePoints(e.target.value)}
              placeholder="例如：一元二次方程, 求根公式"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setChapterModalOpen(false)}
            >
              取消
            </Button>
            <Button onClick={handleSaveChapter}>
              {editingChapter ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
