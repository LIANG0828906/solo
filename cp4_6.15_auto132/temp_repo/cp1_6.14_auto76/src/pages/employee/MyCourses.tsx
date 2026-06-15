import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import CourseCard from '../../components/CourseCard'
import type { Course, Employee } from '../../utils/types'

interface Props {
  employee: Employee
}

export default function MyCourses({ employee }: Props) {
  const [courses, setCourses] = useState<Course[]>([])
  const [empData, setEmpData] = useState<Employee>(employee)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [coursesData, employeesData] = await Promise.all([
        api.get('/courses') as any,
        api.get('/employees') as any
      ])
      setCourses(Array.isArray(coursesData) ? coursesData : [])
      if (Array.isArray(employeesData)) {
        const found = employeesData.find((e: any) => e.id === employee.id)
        if (found) setEmpData(found)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    try {
      const updated = await api.post(`/employees/${empData.id}/enroll`, { courseId }) as any
      setEmpData(updated)
    } catch (e) {
      console.error(e)
    }
  }

  const handleStartQuiz = (courseId: string) => {
    navigate(`/employee/quiz/${courseId}`)
  }

  const handleCompleteChapter = async (courseId: string, chapterId: string) => {
    try {
      const enrollment = empData.enrollments.find(e => e.courseId === courseId)
      if (!enrollment) return
      const course = courses.find(c => c.id === courseId)
      if (!course) return

      const newCompleted = [...enrollment.completedChapters]
      if (!newCompleted.includes(chapterId)) {
        newCompleted.push(chapterId)
      }
      const newProgress = Math.round((newCompleted.length / course.outline.length) * 100)

      const updated = await api.post(`/employees/${empData.id}/progress`, {
        courseId,
        chapterId,
        progress: newProgress
      }) as any
      setEmpData(updated)
    } catch (e) {
      console.error(e)
    }
  }

  const getEnrollment = (courseId: string) => {
    return empData.enrollments.find(e => e.courseId === courseId)
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
        <h1 className="page-title"><i className="fa fa-list" /> 课程中心</h1>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <i className="fa fa-book" />
          <p className="empty-state-text">暂无可用课程</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course, i) => {
            const enrollment = getEnrollment(course.id)
            const isEnrolled = !!enrollment
            const progress = enrollment?.progress ?? 0

            return (
              <div key={course.id} style={{ animationDelay: `${i * 0.1}s` }}>
                <CourseCard
                  course={course}
                  onEnroll={handleEnroll}
                  onStartQuiz={handleStartQuiz}
                  isEnrolled={isEnrolled}
                  progress={progress}
                  showEnroll
                >
                  {isEnrolled && progress < 100 && (
                    <div style={{ marginTop: 8 }}>
                      <p style={{ fontSize: 12, color: '#666', marginBottom: 8, fontWeight: 600 }}>
                        <i className="fa fa-tasks" /> 章节完成情况：
                      </p>
                      {course.outline.map(chapter => {
                        const completed = enrollment.completedChapters.includes(chapter.id)
                        const prevChapterCompleted = chapter.order === 1 ||
                          enrollment.completedChapters.includes(
                            course.outline.find(c => c.order === chapter.order - 1)?.id ?? ''
                          )
                        return (
                          <div
                            key={chapter.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '6px 8px',
                              marginBottom: 4,
                              borderRadius: 6,
                              background: completed ? 'rgba(17,153,142,0.1)' : 'rgba(0,0,0,0.02)',
                              cursor: prevChapterCompleted && !completed ? 'pointer' : 'default',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => {
                              if (prevChapterCompleted && !completed) {
                                handleCompleteChapter(course.id, chapter.id)
                              }
                            }}
                          >
                            <i
                              className={`fa ${completed ? 'fa-check-circle' : prevChapterCompleted ? 'fa-circle-o' : 'fa-lock'}`}
                              style={{
                                color: completed ? '#11998e' : prevChapterCompleted ? '#667eea' : '#ccc',
                                fontSize: 14
                              }}
                            />
                            <span style={{
                              fontSize: 12,
                              color: completed ? '#11998e' : prevChapterCompleted ? '#333' : '#aaa',
                              flex: 1
                            }}>
                              {chapter.title}
                            </span>
                            {prevChapterCompleted && !completed && (
                              <span style={{
                                fontSize: 10,
                                color: '#667eea',
                                background: 'rgba(102,126,234,0.1)',
                                padding: '2px 8px',
                                borderRadius: 10
                              }}>
                                点击完成
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CourseCard>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
