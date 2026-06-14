import { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useCourses } from './hooks/useCourses'
import { CourseCard } from './components/CourseCard'
import { ConflictModal } from './components/ConflictModal'
import { Course, Student, loadCourseStudents, ConflictErrorData } from './api'

function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation()

  const navItems = [
    { path: '/', label: '课程中心' },
    { path: '/admin/courses', label: '课程管理' },
    { path: '/admin/students', label: '学员管理' },
  ]

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'visible' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>选课管理系统</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={onClose}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}

function CourseListPage() {
  const { courses, loading, error, enrollInCourse } = useCourses()

  const handleEnroll = async (courseId: string, studentName: string) => {
    const response = await enrollInCourse(courseId, studentName)
    return response.success === true
  }

  if (loading) return <div className="loading">加载中...</div>
  if (error) return <div className="loading">{error}</div>

  return (
    <div>
      <h2 className="page-title">课程中心</h2>
      <div className="course-grid">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onEnroll={(name) => handleEnroll(course.id, name)}
          />
        ))}
      </div>
    </div>
  )
}

function AdminCoursesPage() {
  const { courses, loading, addCourse } = useCourses()
  const [formData, setFormData] = useState({
    name: '',
    instructor: '',
    date: '',
    startTime: '',
    endTime: '',
    maxStudents: '',
    description: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [conflictCourses, setConflictCourses] = useState<Course[]>([])
  const [pendingCourse, setPendingCourse] = useState<Omit<Course, 'id' | 'enrolledCount'> | null>(
    null,
  )
  const [submitError, setSubmitError] = useState('')

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name || formData.name.length < 2 || formData.name.length > 20) {
      newErrors.name = '课程名必须为2-20个字符'
    }
    if (!formData.instructor || formData.instructor.length < 2 || formData.instructor.length > 10) {
      newErrors.instructor = '讲师名必须为2-10个汉字'
    }
    if (!formData.date) {
      newErrors.date = '请选择上课日期'
    }
    if (!formData.startTime) {
      newErrors.startTime = '请选择开始时间'
    }
    if (!formData.endTime) {
      newErrors.endTime = '请选择结束时间'
    }
    if (
      formData.startTime &&
      formData.endTime &&
      formData.startTime >= formData.endTime
    ) {
      newErrors.endTime = '结束时间必须晚于开始时间'
    }
    const maxNum = parseInt(formData.maxStudents)
    if (!formData.maxStudents || isNaN(maxNum) || maxNum < 1 || maxNum > 30) {
      newErrors.maxStudents = '最大学员数必须为1-30的整数'
    }
    if (formData.description && formData.description.length > 200) {
      newErrors.description = '课程简介不能超过200字'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (force = false) => {
    setSubmitError('')

    if (!validateForm()) {
      return
    }

    const courseData = {
      name: formData.name,
      instructor: formData.instructor,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      maxStudents: parseInt(formData.maxStudents),
      description: formData.description,
    }

    const response = await addCourse({ ...courseData, force })

    if (response.success) {
      setFormData({
        name: '',
        instructor: '',
        date: '',
        startTime: '',
        endTime: '',
        maxStudents: '',
        description: '',
      })
      setShowConflictModal(false)
      setPendingCourse(null)
    } else {
      if (response.message === '存在排课冲突' && response.data && 'conflictCourses' in response.data) {
        const conflictData = response.data as ConflictErrorData
        setConflictCourses(conflictData.conflictCourses)
        setPendingCourse(courseData)
        setShowConflictModal(true)
      } else {
        setSubmitError(response.message || '添加失败')
      }
    }
  }

  const handleConfirmOverride = async () => {
    if (pendingCourse) {
      await addCourse({ ...pendingCourse, force: true })
      setShowConflictModal(false)
      setPendingCourse(null)
      setFormData({
        name: '',
        instructor: '',
        date: '',
        startTime: '',
        endTime: '',
        maxStudents: '',
        description: '',
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div>
      <h2 className="page-title">课程管理</h2>

      <div className="form-section">
        <h3 className="form-title">添加课程</h3>
        <form
          className="course-form"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(false)
          }}
        >
          <div className="form-group">
            <label>课程名 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="请输入课程名（2-20字符）"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>讲师名 *</label>
            <input
              type="text"
              name="instructor"
              value={formData.instructor}
              onChange={handleInputChange}
              placeholder="请输入讲师名（2-10汉字）"
            />
            {errors.instructor && <span className="error-message">{errors.instructor}</span>}
          </div>

          <div className="form-group full-width">
            <label>上课时段 *</label>
            <div className="datetime-row">
              <div>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                />
                {errors.date && <span className="error-message">{errors.date}</span>}
              </div>
              <div>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  step="60"
                />
                {errors.startTime && <span className="error-message">{errors.startTime}</span>}
              </div>
              <div>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  step="60"
                />
                {errors.endTime && <span className="error-message">{errors.endTime}</span>}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>最大学员数 *</label>
            <input
              type="number"
              name="maxStudents"
              value={formData.maxStudents}
              onChange={handleInputChange}
              min="1"
              max="30"
              placeholder="1-30"
            />
            {errors.maxStudents && <span className="error-message">{errors.maxStudents}</span>}
          </div>

          <div className="form-group"></div>

          <div className="form-group full-width">
            <label>课程简介</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="请输入课程简介（200字以内）"
              maxLength={200}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              添加课程
            </button>
          </div>
          {submitError && <div className="form-error">{submitError}</div>}
        </form>
      </div>

      <div className="course-list-section">
        <h3 className="section-title">课程列表</h3>
        {loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <div className="course-grid">
            {courses.map((course) => (
              <div key={course.id} style={{ cursor: 'default' }}>
                <CourseCard course={course} onEnroll={async () => false} />
              </div>
            ))}
          </div>
        )}
      </div>

      <ConflictModal
        isOpen={showConflictModal}
        conflictCourses={conflictCourses}
        newCourseName={pendingCourse?.name || ''}
        onConfirm={handleConfirmOverride}
        onCancel={() => setShowConflictModal(false)}
      />
    </div>
  )
}

function AdminStudentsPage() {
  const { courses, loading: coursesLoading } = useCourses()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const fetchStudents = async (courseId: string) => {
    if (!courseId) {
      setStudents([])
      return
    }
    setLoading(true)
    const response = await loadCourseStudents(courseId)
    if (response.success && response.data) {
      setStudents(response.data)
    }
    setLoading(false)
    setCurrentPage(1)
  }

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const courseId = e.target.value
    setSelectedCourseId(courseId)
    fetchStudents(courseId)
  }

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredStudents.length / pageSize)
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  return (
    <div>
      <h2 className="page-title">学员管理</h2>

      <div className="student-table-section">
        <div className="table-toolbar">
          <div>
            <select
              value={selectedCourseId}
              onChange={handleCourseChange}
              style={{
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                minWidth: '200px',
                cursor: 'pointer',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = ''
                e.target.style.boxShadow = ''
              }}
            >
              <option value="">请选择课程查看学员</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            className="search-input"
            placeholder="搜索学员名..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>

        {coursesLoading && <div className="loading">加载课程列表...</div>}

        {!selectedCourseId ? (
          <div className="loading">请选择课程查看学员列表</div>
        ) : loading ? (
          <div className="loading">加载中...</div>
        ) : (
          <>
            <table className="student-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>学员名</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                      暂无学员数据
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student, index) => (
                    <tr key={student.id}>
                      <td>{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>{student.name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {filteredStudents.length > 0 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  上一页
                </button>
                <span className="pagination-info">
                  第 {currentPage} 页 / 共 {totalPages} 页
                </span>
                <button
                  className="pagination-btn"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-container">
      <button
        className="hamburger-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="菜单"
      >
        ☰
      </button>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<CourseListPage />} />
          <Route path="/admin/courses" element={<AdminCoursesPage />} />
          <Route path="/admin/students" element={<AdminStudentsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
