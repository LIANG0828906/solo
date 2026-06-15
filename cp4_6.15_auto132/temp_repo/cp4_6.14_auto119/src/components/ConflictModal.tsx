import { Course } from '../api'

interface ConflictModalProps {
  isOpen: boolean
  conflictCourses: Course[]
  newCourseName: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConflictModal({
  isOpen,
  conflictCourses,
  newCourseName,
  onConfirm,
  onCancel,
}: ConflictModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">排课冲突警告</h2>
        <p className="modal-subtitle">
          课程 <span className="highlight-course">「{newCourseName}」</span> 与以下课程存在时间冲突：
        </p>
        <div className="conflict-list">
          {conflictCourses.map((course) => (
            <div key={course.id} className="conflict-item">
              <div className="conflict-course-name">{course.name}</div>
              <div className="conflict-course-details">
                <span>讲师：{course.instructor}</span>
                <span>
                  时间：{course.date} {course.startTime}-{course.endTime}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="modal-warning">是否确认添加该课程？</p>
        <div className="modal-actions">
          <button className="modal-btn confirm" onClick={onConfirm}>
            确认覆盖
          </button>
          <button className="modal-btn cancel" onClick={onCancel}>
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
