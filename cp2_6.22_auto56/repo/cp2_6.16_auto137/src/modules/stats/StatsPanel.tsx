import { useMemo } from 'react'
import { Users, CheckCircle, Star, TrendingUp, BookOpen } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { StudentManager } from '@/modules/student/StudentManager'
import { TaskManager } from '@/modules/task/TaskManager'

export const StatsPanel = () => {
  const courses = useStore(state => state.courses)
  const attendances = useStore(state => state.attendances)
  const submissions = useStore(state => state.submissions)
  const students = useStore(state => state.students)

  const overallStats = useMemo(() => {
    const totalPresent = attendances.filter(a => a.status === 'present').length
    const totalMarked = attendances.filter(a => a.status !== 'unmarked').length
    const attendanceRate = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 0

    const completedSubmissions = submissions.filter(s => s.content.length > 0).length
    const totalTasks = courses.reduce((sum, c) => {
      const courseStudents = students.filter(s => s.courseId === c.id).length
      const courseTasks = courses.filter(t => t.id === c.id).length
      return sum + courseStudents * courseTasks
    }, 0)
    const completionRate = totalTasks > 0 ? Math.round((completedSubmissions / totalTasks) * 100) : 0

    const scoredSubmissions = submissions.filter(s => s.score > 0)
    const avgScore = scoredSubmissions.length > 0
      ? Math.round((scoredSubmissions.reduce((sum, s) => sum + s.score, 0) / scoredSubmissions.length) * 10) / 10
      : 0

    return {
      totalStudents: students.length,
      totalCourses: courses.length,
      attendanceRate,
      completionRate,
      avgScore,
    }
  }, [courses, attendances, submissions, students])

  const courseStats = useMemo(() => {
    return courses.map((course) => {
      const attendanceRate = students.filter(s => s.courseId === course.id).length > 0
        ? Math.round(students.filter(s => s.courseId === course.id).reduce((sum, s) => {
            return sum + StudentManager.getAttendanceRate(s.id, course.id)
          }, 0) / Math.max(students.filter(s => s.courseId === course.id).length, 1))
        : 0

      return {
        ...course,
        studentCount: students.filter(s => s.courseId === course.id).length,
        attendanceRate,
        completionRate: TaskManager.getCompletionRate(course.id),
        avgScore: TaskManager.getAverageScore(course.id),
      }
    })
  }, [courses, students])

  const maxBarValue = 100

  const StatCard = ({ icon: Icon, label, value, unit, color, gradient }: {
    icon: typeof Users
    label: string
    value: number | string
    unit?: string
    color: string
    gradient: string
  }) => (
    <div className="p-6 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
      style={{ background: 'var(--card-bg)', border: '2px solid var(--card-border)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: gradient }}>
          <Icon className="text-white" size={24} />
        </div>
        <span className="text-3xl font-bold" style={{ color }}>{value}{unit}</span>
      </div>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  )

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 animate-fade-in">
      <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
        统计面板
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="总学生数"
          value={overallStats.totalStudents}
          color="#667eea"
          gradient="linear-gradient(135deg, #667eea, #764ba2)"
        />
        <StatCard
          icon={BookOpen}
          label="总课程数"
          value={overallStats.totalCourses}
          color="#f093fb"
          gradient="linear-gradient(135deg, #f093fb, #f5576c)"
        />
        <StatCard
          icon={CheckCircle}
          label="平均出勤率"
          value={overallStats.attendanceRate}
          unit="%"
          color="#4CAF50"
          gradient="linear-gradient(135deg, #4CAF50, #66BB6A)"
        />
        <StatCard
          icon={Star}
          label="平均评分"
          value={overallStats.avgScore}
          color="#FFC107"
          gradient="linear-gradient(135deg, #FFC107, #FF9800)"
        />
      </div>

      <div className="p-6 rounded-2xl mb-6" style={{ background: 'var(--card-bg)', border: '2px solid var(--card-border)' }}>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-purple-500" size={24} />
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            各课程数据对比
          </h2>
        </div>

        <div className="space-y-6">
          {courseStats.map((course, index) => (
            <div key={course.id} className="animate-float-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg" style={{ background: course.coverColor }} />
                  <span className="font-medium">{course.name}</span>
                  <span className="text-xs text-gray-400">({course.studentCount}名学生)</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16">出勤率</span>
                  <div className="flex-1 h-6 rounded-full overflow-hidden relative" style={{ background: 'var(--bg-primary)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${(course.attendanceRate / maxBarValue) * 100}%`,
                        background: 'linear-gradient(90deg, #4CAF50, #66BB6A)',
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600">
                      {course.attendanceRate}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16">完成率</span>
                  <div className="flex-1 h-6 rounded-full overflow-hidden relative" style={{ background: 'var(--bg-primary)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${(course.completionRate / maxBarValue) * 100}%`,
                        background: 'linear-gradient(90deg, #667eea, #764ba2)',
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600">
                      {course.completionRate}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16">平均分</span>
                  <div className="flex-1 h-6 rounded-full overflow-hidden relative" style={{ background: 'var(--bg-primary)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${(course.avgScore / 5) * 100}%`,
                        background: 'linear-gradient(90deg, #FFC107, #FF9800)',
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600">
                      {course.avgScore} / 5
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl" style={{ background: 'var(--card-bg)', border: '2px solid var(--card-border)' }}>
          <h3 className="font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>任务完成率分布</h3>
          <div className="space-y-3">
            {['已完成', '进行中', '未开始'].map((status, idx) => {
              const colors = ['#4CAF50', '#FFC107', '#9E9E9E']
              const counts = [
                submissions.filter(s => s.score > 0).length,
                submissions.filter(s => s.content && s.score === 0).length,
                Math.max(0, courses.length * 5 - submissions.length),
              ]
              const total = counts.reduce((a, b) => a + b, 0) || 1
              const percent = Math.round((counts[idx] / total) * 100)

              return (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: colors[idx] }} />
                  <span className="text-sm flex-1">{status}</span>
                  <span className="text-sm font-medium text-gray-600">{counts[idx]}</span>
                  <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, background: colors[idx] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-6 rounded-2xl" style={{ background: 'var(--card-bg)', border: '2px solid var(--card-border)' }}>
          <h3 className="font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>评分分布</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = submissions.filter(s => s.score === star).length
              const total = submissions.filter(s => s.score > 0).length || 1
              const percent = Math.round((count / total) * 100)

              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm w-12">{star} 星</span>
                  <div className="flex-1 h-6 rounded-full overflow-hidden relative" style={{ background: 'var(--bg-primary)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        background: 'linear-gradient(90deg, #FFC107, #FF9800)',
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600">
                      {count} 人
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
