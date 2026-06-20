import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import api from '../../utils/api'
import CourseCard from '../../components/CourseCard'
import type { Course, CourseChapter } from '../../utils/types'

export default function CourseList() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '技术类' as Course['category'],
    difficulty: 1 as Course['difficulty'],
    outline: [{ id: uuidv4(), title: '', content: '', order: 1 }] as CourseChapter[]
  })

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      const data = await api.get('/courses') as any
      setCourses(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCourse(null)
    setFormData({
      name: '',
      category: '技术类',
      difficulty: 1,
      outline: [{ id: uuidv4(), title: '', content: '', order: 1 }]
    })
    setShowModal(true)
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      category: course.category,
      difficulty: course.difficulty,
      outline: course.outline.length > 0
        ? course.outline.map(ch => ({ ...ch }))
        : [{ id: uuidv4(), title: '', content: '', order: 1 }]
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该课程吗？')) return
    try {
      await api.delete(`/courses/${id}`)
      setCourses(prev => prev.filter(c => c.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return
    const cleanOutline = formData.outline
      .filter(ch => ch.title.trim())
      .map((ch, i) => ({ ...ch, order: i + 1 }))

    try {
      if (editingCourse) {
        const updated = await api.put(`/courses/${editingCourse.id}`, {
          ...editingCourse,
          name: formData.name,
          category: formData.category,
          difficulty: formData.difficulty,
          outline: cleanOutline
        }) as any
        setCourses(prev => prev.map(c => c.id === editingCourse.id ? updated : c))
      } else {
        const created = await api.post('/courses', {
          name: formData.name,
          category: formData.category,
          difficulty: formData.difficulty,
          outline: cleanOutline,
          quizzes: [],
          targetSkills: []
        }) as any
        setCourses(prev => [...prev, created])
      }
      setShowModal(false)
    } catch (e) {
      console.error(e)
    }
  }

  const addChapter = () => {
    setFormData(prev => ({
      ...prev,
      outline: [...prev.outline, { id: uuidv4(), title: '', content: '', order: prev.outline.length + 1 }]
    }))
  }

  const removeChapter = (id: string) => {
    setFormData(prev => ({
      ...prev,
      outline: prev.outline.filter(ch => ch.id !== id).map((ch, i) => ({ ...ch, order: i + 1 }))
    }))
  }

  const updateChapter = (id: string, title: string) => {
    setFormData(prev => ({
      ...prev,
      outline: prev.outline.map(ch => ch.id === id ? { ...ch, title } : ch)
    }))
  }

  const moveChapterUp = (index: number) => {
    if (index === 0) return
    setFormData(prev => {
      const newOutline = [...prev.outline]
      const temp = newOutline[index]
      newOutline[index] = newOutline[index - 1]
      newOutline[index - 1] = temp
      return { ...prev, outline: newOutline.map((ch, i) => ({ ...ch, order: i + 1 })) }
    })
  }

  const moveChapterDown = (index: number) => {
    if (index >= formData.outline.length - 1) return
    setFormData(prev => {
      const newOutline = [...prev.outline]
      const temp = newOutline[index]
      newOutline[index] = newOutline[index + 1]
      newOutline[index + 1] = temp
      return { ...prev, outline: newOutline.map((ch, i) => ({ ...ch, order: i + 1 })) }
    })
  }

  if (loading) {
    return (
      <div className="empty-state">
        <i className="fa fa-spinner fa-spin" />
        <p className="empty-state-text">加载中...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"><i className="fa fa-book" /> 课程管理</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          <i className="fa fa-plus" /> 发布新课程
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <i className="fa fa-book" />
          <p className="empty-state-text">暂无课程，点击上方按钮创建</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course, i) => (
            <div key={course.id} style={{ animationDelay: `${i * 0.1}s` }}>
              <CourseCard
                course={course}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingCourse ? '编辑课程' : '发布新课程'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="fa fa-times" />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">课程名称</label>
              <input
                className="form-input"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入课程名称"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">课程类别</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as Course['category'] }))}
                >
                  <option value="技术类">技术类</option>
                  <option value="管理类">管理类</option>
                  <option value="产品类">产品类</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">难度等级</label>
                <select
                  className="form-select"
                  value={formData.difficulty}
                  onChange={e => setFormData(prev => ({ ...prev, difficulty: Number(e.target.value) as Course['difficulty'] }))}
                >
                  <option value={1}>初级</option>
                  <option value={2}>中级</option>
                  <option value={3}>高级</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                课程大纲 <span style={{ fontWeight: 400, color: '#999' }}>(拖拽或使用箭头调整顺序)</span>
              </label>
              {formData.outline.map((chapter, index) => (
                <div key={chapter.id} className="chapter-item" style={{ animation: `fadeInUp 0.3s ease ${index * 0.05}s both` }}>
                  <span className="outline-number">{index + 1}</span>
                  <input
                    type="text"
                    value={chapter.title}
                    onChange={e => updateChapter(chapter.id, e.target.value)}
                    placeholder={`第${index + 1}章标题`}
                  />
                  <button className="btn btn-sm" onClick={() => moveChapterUp(index)} disabled={index === 0}>
                    <i className="fa fa-arrow-up" />
                  </button>
                  <button className="btn btn-sm" onClick={() => moveChapterDown(index)} disabled={index === formData.outline.length - 1}>
                    <i className="fa fa-arrow-down" />
                  </button>
                  <button className="chapter-remove" onClick={() => removeChapter(chapter.id)}>
                    <i className="fa fa-times" />
                  </button>
                </div>
              ))}
              <button className="btn btn-sm" onClick={addChapter} style={{ marginTop: 8 }}>
                <i className="fa fa-plus" /> 添加章节
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSave}>
                <i className="fa fa-check" /> {editingCourse ? '保存修改' : '发布课程'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
