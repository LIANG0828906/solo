import { motion } from 'framer-motion'
import { Users, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDaysRemaining, getAvatarColor } from '@/utils/helpers'
import type { Project, User } from '@/types'

interface ProjectCardProps {
  project: Project
  members: User[]
  onClick: (projectId: string) => void
  progress?: number
}

export default function ProjectCard({ project, members, onClick, progress = 0 }: ProjectCardProps) {
  const daysRemaining = getDaysRemaining(project.deadline)

  const getDaysLabel = () => {
    if (daysRemaining < 0) return '已逾期'
    if (daysRemaining === 0) return '今天截止'
    return `剩余 ${daysRemaining} 天`
  }

  const getDaysColor = () => {
    if (daysRemaining < 0) return 'bg-red-500'
    if (daysRemaining <= 3) return 'bg-orange-500'
    return 'bg-blue-500'
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, boxShadow: '0 12px 24px -8px rgba(0, 0, 0, 0.15)' }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(project.id)}
      className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
          {project.name}
        </h3>
        <span className={cn(
          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white',
          getDaysColor()
        )}>
          <Calendar className="w-3 h-3" />
          {getDaysLabel()}
        </span>
      </div>

      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
        {project.description}
      </p>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member) => (
              <div
                key={member.id}
                className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: getAvatarColor(member.name) }}
                title={member.name}
              >
                {member.name.charAt(0)}
              </div>
            ))}
            {members.length > 4 && (
              <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                +{members.length - 4}
              </div>
            )}
          </div>
        </div>
        <span className="text-sm font-semibold text-gray-700">{progress}%</span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #FF4757 0%, #2ED573 100%)',
          }}
        />
      </div>
    </motion.div>
  )
}
