import { useState } from 'react'
import { Course } from '../api'

interface CourseCardProps {
  course: Course
  onEnroll: (studentName: string) => Promise<boolean>
}

export function CourseCard({ course, onEnroll }: CourseCardProps) {
  const [studentName, setStudentName] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const isFull = course.enrolledCount >= course.maxStudents
  const remaining = course.maxStudents - course.enrolledCount

  const handleEnrollClick = () => {
    if (isFull) return
    setShowInput(true)
  }

  const handleConfirmEnroll = async () => {
    if (!studentName.trim() || isEnrolling) return

    setIsEnrolling(true)
    const success = await onEnroll(studentName.trim())
    setIsEnrolling(false)

    if (success) {
      setShowInput(false)
      setStudentName('')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    }
  }

  const handleCancel = () => {
    setShowInput(false)
    setStudentName('')
  }

  return (
    <div className="course-card">
      <div className="course-card-header">
        <h3 className="course-name">{course.name}</h3>
        <span className="course-instructor">{course.instructor} 老师</span>
      </div>
      <div className="course-info">
        <div className="info-row">
          <span className="info-label">时间</span>
          <span className="info-value">
            {course.date} {course.startTime}-{course.endTime}
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">名额</span>
          <span className={`info-value ${remaining === 0 ? 'full' : ''}`}>
            剩余 {remaining} / {course.maxStudents}
          </span>
        </div>
        {course.description && (
          <div className="info-row description-row">
            <span className="info-label">简介</span>
            <span className="info-value description">{course.description}</span>
          </div>
        )}
      </div>

      {showInput ? (
        <div className="enroll-input-wrapper">
          <input
            type="text"
            className="enroll-input"
            placeholder="请输入学员名"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirmEnroll()}
            autoFocus
          />
          <div className="enroll-actions">
            <button className="confirm-btn" onClick={handleConfirmEnroll} disabled={isEnrolling}>
              确认
            </button>
            <button className="cancel-btn" onClick={handleCancel} disabled={isEnrolling}>
              取消
            </button>
          </div>
        </div>
      ) : (
        <button
          className={`enroll-btn ${isFull ? 'disabled' : ''}`}
          onClick={handleEnrollClick}
          disabled={isFull}
        >
          {isFull ? '已满' : '选课'}
        </button>
      )}

      {showToast && <div className="toast">选课成功</div>}
    </div>
  )
}
