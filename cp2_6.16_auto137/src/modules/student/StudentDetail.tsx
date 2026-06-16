import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Calendar, Music, User, ChevronLeft, ChevronRight, Clock, MessageSquare } from 'lucide-react'
import { StudentManager } from '@/modules/student/StudentManager'
import { TaskManager } from '@/modules/task/TaskManager'
import { CourseManager } from '@/modules/course/CourseManager'
import { AttendanceBar } from '@/components/AttendanceBar'
import { StarRating } from '@/components/StarRating'

export const StudentDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const student = StudentManager.getById(id || '')
  const course = student ? CourseManager.getByStudentId(student.id) : undefined
  
  const [currentWeek, setCurrentWeek] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)

  const attendanceRate = student && course ? StudentManager.getAttendanceRate(student.id, course.id) : 0
  const avgRating = student && course ? StudentManager.getAverageRating(student.id, course.id) : 0
  const submissions = student ? TaskManager.getSubmissionsByStudentId(student.id) : []
  const practiceRecords = student ? TaskManager.getPracticeRecordsByStudentId(student.id) : []

  const getWeekDates = (weekOffset: number) => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7)
    
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates(currentWeek)

  const getDurationColor = (duration: number) => {
    if (duration >= 120) return '#1565C0'
    if (duration >= 60) return '#42A5F5'
    if (duration >= 30) return '#90CAF9'
    return 'transparent'
  }

  const getDurationForDate = (dateStr: string) => {
    const record = practiceRecords.find(r => r.date === dateStr)
    return record?.duration || 0
  }

  const getSelectedRecord = () => {
    if (!selectedDate || !student) return null
    return practiceRecords.find(r => r.date === selectedDate)
  }

  const changeWeek = (direction: 'prev' | 'next') => {
    setSlideDirection(direction === 'prev' ? 'right' : 'left')
    setTimeout(() => {
      setCurrentWeek(prev => direction === 'prev' ? prev - 1 : prev + 1)
      setSlideDirection(null)
    }, 150)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) changeWeek('next')
      else changeWeek('prev')
    }
  }

  const selectedRecord = getSelectedRecord()

  if (!student || !course) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">学生不存在</p>
      </div>
    )
  }

  return (
    <div className={`h-full overflow-y-auto p-4 md:p-6 ${location.state?.direction === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>返回</span>
      </button>

      <div className="mb-6 p-6 rounded-2xl" style={{ background: 'var(--card-bg)', border: '2px solid var(--card-border)' }}>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: course.coverColor }}
          >
            {student.name[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
              {student.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <User size={14} />
                {student.age}岁
              </span>
              <span className="flex items-center gap-1">
                <Music size={14} />
                {student.instrument}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                入学 {new Date(student.startDate).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{attendanceRate}%</div>
              <div className="text-xs text-gray-500">出勤率</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-500">{avgRating}</div>
              <div className="text-xs text-gray-500">平均评分</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl" style={{ background: 'var(--card-bg)', border: '2px solid var(--card-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                练习日历
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeWeek('prev')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-sm font-medium min-w-[140px] text-center">
                  {weekDates[0].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })} - {weekDates[6].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
                </span>
                <button
                  onClick={() => changeWeek('next')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-end gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded" style={{ background: '#90CAF9' }} />
                30分钟
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded" style={{ background: '#42A5F5' }} />
                60分钟
              </span>
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded" style={{ background: '#1565C0' }} />
                120分钟+
              </span>
            </div>

            <div
              ref={containerRef}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className={`overflow-hidden ${
                slideDirection === 'left' ? 'animate-slide-in-right' : slideDirection === 'right' ? 'animate-slide-in-left' : ''
              }`}
              style={{ willChange: 'transform' }}
            >
              <div className="grid grid-cols-7 gap-2">
                {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                {weekDates.map((date) => {
                  const dateStr = date.toISOString().split('T')[0]
                  const duration = getDurationForDate(dateStr)
                  const isSelected = selectedDate === dateStr
                  const isToday = dateStr === new Date().toISOString().split('T')[0]

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:scale-105 ${
                        isSelected ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                      }`}
                      style={{
                        background: getDurationColor(duration) || 'var(--bg-primary)',
                        border: isToday ? '2px solid #667eea' : 'none',
                      }}
                    >
                      <span className={`text-sm font-medium ${duration >= 30 ? 'text-white' : 'text-gray-700'}`}>
                        {date.getDate()}
                      </span>
                      {duration > 0 && (
                        <span className="text-xs text-white/90 flex items-center gap-0.5">
                          <Clock size={10} />
                          {duration}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedRecord && (
              <div className="mt-4 p-4 rounded-xl animate-fade-in" style={{ background: 'var(--bg-primary)' }}>
                <h4 className="font-semibold mb-2">
                  {new Date(selectedDate!).toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h4>
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <Clock size={14} />
                  <span>练习时长：{selectedRecord.duration}分钟</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="text-gray-500">练习内容：</span>{selectedRecord.exercises}
                </p>
                {selectedRecord.teacherComment && (
                  <p className="text-sm text-gray-700 flex items-start gap-1">
                    <MessageSquare size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
                    <span><span className="text-gray-500">老师评语：</span>{selectedRecord.teacherComment}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl" style={{ background: 'var(--card-bg)', border: '2px solid var(--card-border)' }}>
            <h3 className="font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>出勤统计</h3>
            <AttendanceBar {...StudentManager.getCourseAttendanceStats(course.id)} />
          </div>

          <div className="p-6 rounded-2xl" style={{ background: 'var(--card-bg)', border: '2px solid var(--card-border)' }}>
            <h3 className="font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>任务完成</h3>
            <div className="space-y-3">
              {TaskManager.getByCourseId(course.id).map((task) => {
                const submission = submissions.find(s => s.taskId === task.id)
                const progress = TaskManager.getTaskProgress(task.id, student.id)
                return (
                  <div key={task.id} className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{task.title}</span>
                      <span className="text-xs font-medium" style={{ color: progress === 100 ? '#4CAF50' : '#667eea' }}>
                        {progress}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          background: progress === 100 ? '#4CAF50' : '#667eea',
                        }}
                      />
                    </div>
                    {submission?.score > 0 && (
                      <div className="mt-2">
                        <StarRating value={submission.score} readonly size={12} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
