import React from 'react'
import { Heart, Clock, ChevronDown, User } from 'lucide-react'
import type { Project, Material } from '@/types'
import RingProgress from '@/components/RingProgress'

interface ProjectCardProps {
  project: Project
  matchedMaterials: Material[]
  isFavorited: boolean
  isExpanded: boolean
  onFavorite: (id: string) => void
  onToggleExpand: (id: string) => void
}

const DIFFICULTY_COLORS: Record<string, string> = {
  '新手': 'bg-green-100 text-green-700',
  '进阶': 'bg-blue-100 text-blue-700',
  '专家': 'bg-red-100 text-red-700',
}

function ProjectCard({ project, matchedMaterials, isFavorited, isExpanded, onFavorite, onToggleExpand }: ProjectCardProps) {
  const isGolden = project.matchScore > 70

  const cardContent = (
    <div className="bg-white rounded-[16px] p-4 cursor-pointer relative">
      <button
        className="absolute top-3 right-3 z-10 p-1"
        onClick={(e) => {
          e.stopPropagation()
          onFavorite(project.id)
        }}
      >
        <Heart
          className="w-5 h-5 transition-colors"
          fill={isFavorited ? '#ef4444' : 'none'}
          stroke={isFavorited ? '#ef4444' : '#9ca3af'}
        />
      </button>

      <div className="flex justify-between items-start">
        <div className="flex-1 pr-8">
          <h3 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', 'Noto Sans SC', serif" }}>
            {project.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[project.difficulty] ?? 'bg-gray-100 text-gray-600'}`}>
              {project.difficulty}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              约{project.estimatedHours}小时
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <RingProgress percentage={project.matchScore} ringColor={isGolden ? '#FFD700' : '#2C5F3B'} />
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {project.requiredMaterialTypes.map((type) => (
          <span key={type} className="text-xs px-2 py-0.5 rounded-full bg-cream text-wood border border-wood/20">
            {type}
          </span>
        ))}
      </div>

      {isExpanded && (
        <div className="animate-fade-in mt-4 pt-3 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-2">匹配余料</p>
          {matchedMaterials.length > 0 ? (
            <div className="space-y-2">
              {matchedMaterials.slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <span className="font-medium text-gray-800">{m.name}</span>
                    <span className="ml-2 text-wood">{m.materialType}</span>
                  </div>
                  <span className="text-gray-400">{m.contact}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">暂无匹配余料</p>
          )}
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
            <User className="w-3.5 h-3.5" />
            <span>{project.publisherName}</span>
            <span className="text-gray-300">|</span>
            <span>{project.contact}</span>
          </div>
        </div>
      )}
    </div>
  )

  const handleToggle = () => onToggleExpand(project.id)

  if (isGolden) {
    return (
      <div className="golden-border" onClick={handleToggle}>
        {cardContent}
      </div>
    )
  }

  return (
    <div className="rounded-[16px] shadow-card card-base" onClick={handleToggle}>
      {cardContent}
    </div>
  )
}

export default React.memo(ProjectCard)
