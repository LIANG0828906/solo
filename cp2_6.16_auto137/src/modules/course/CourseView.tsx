import { useNavigate } from 'react-router-dom'
import { Clock, Users, ChevronRight } from 'lucide-react'
import type { Course } from '@/types'
import { StudentManager } from '@/modules/student/StudentManager'

interface CourseViewProps {
  course: Course
  index: number
}

export const CourseView = ({ course, index }: CourseViewProps) => {
  const navigate = useNavigate()
  const students = StudentManager.getByCourseId(course.id)

  const handleClick = () => {
    navigate(`/course/${course.id}`, { state: { direction: 'right' } })
  }

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer rounded-2xl p-6 h-56 relative overflow-hidden transition-all duration-200 ease-out hover:-translate-y-2.5 hover:shadow-2xl animate-float-up"
      style={{
        background: `linear-gradient(135deg, ${course.coverColor} 0%, ${course.coverColor}dd 100%)`,
        animationDelay: `${index * 0.1}s`,
        border: '2px solid rgba(255,255,255,0.2)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 h-full flex flex-col justify-between text-white">
        <div>
          <h3
            className="text-2xl font-bold mb-2 group-hover:scale-105 transition-transform duration-200"
            style={{ fontFamily: 'Playfair Display, serif', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
          >
            {course.name}
          </h3>
          <p className="text-sm text-white/80 line-clamp-2 mb-4">
            {course.description}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-white/90">
            <Clock size={16} />
            <span>{course.scheduleTime}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/90">
              <Users size={16} />
              <span>{students.length} 名学生</span>
            </div>
            <div
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 group-hover:translate-x-1 transition-all duration-200"
            >
              <ChevronRight size={20} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
