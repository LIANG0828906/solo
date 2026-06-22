import { useNavigate } from 'react-router-dom'
import { Monitor, Smartphone, Tv, Clock } from 'lucide-react'
import { differenceInDays, format } from 'date-fns'
import type { Project } from '../types'

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

const platformIcons: Record<string, React.ReactNode> = {
  PC: <Monitor size={14} />,
  Mobile: <Smartphone size={14} />,
  Console: <Tv size={14} />,
}

const platformLabels: Record<string, string> = {
  PC: 'PC',
  Mobile: '手机',
  Console: '主机',
}

export default function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate()
  const hue = hashString(project.name) % 360
  const gradientFrom = `hsl(${hue}, 60%, 20%)`
  const gradientTo = `hsl(${(hue + 45) % 360}, 70%, 30%)`
  const shapeColor = `hsl(${(hue + 90) % 360}, 50%, 50%)`
  const shapeColor2 = `hsl(${(hue + 180) % 360}, 40%, 45%)`

  const daysLeft = differenceInDays(new Date(project.releaseDate), new Date())
  const isPast = daysLeft < 0

  let countdownClass = 'bg-gradient-to-r from-primary-from to-primary-to text-white'
  if (!isPast) {
    if (daysLeft < 7) {
      countdownClass = 'bg-red-500/20 text-red-400'
    } else if (daysLeft < 30) {
      countdownClass = 'bg-yellow-500/20 text-yellow-400'
    }
  }

  const engineLabel = project.engine === 'Custom' && project.customEngine
    ? project.customEngine
    : project.engine

  return (
    <div
      className="glass rounded-2xl overflow-hidden card-hover cursor-pointer"
      onClick={() => navigate(`/project/${project.id}`)}
    >
      <div className="relative h-[140px]" style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}>
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 200 140" preserveAspectRatio="none">
          <polygon points="20,120 60,30 100,120" fill={shapeColor} />
          <polygon points="100,10 140,100 60,100" fill={shapeColor2} opacity="0.6" />
          <polygon points="130,130 170,50 200,130" fill={shapeColor} opacity="0.5" />
          <polygon points="150,0 190,80 110,80" fill={shapeColor2} opacity="0.3" />
          <polygon points="0,0 30,0 0,40" fill={shapeColor} opacity="0.4" />
        </svg>
        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/40 backdrop-blur-sm text-text-primary border border-white/10">
          {engineLabel}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-display text-base font-semibold gradient-text">
          {project.name}
        </h3>
        <p className="text-xs text-text-secondary line-clamp-2 mt-1">
          {project.description}
        </p>

        <div className="flex gap-1.5 mt-3">
          {project.platforms.map((p) => (
            <span key={p} className="flex items-center gap-1 text-[11px] text-text-secondary">
              {platformIcons[p]}
              {platformLabels[p]}
            </span>
          ))}
        </div>

        <div className="flex justify-between items-center mt-3">
          <span className="flex items-center gap-1 text-xs text-text-secondary">
            <Clock size={12} />
            {format(new Date(project.releaseDate), 'yyyy/MM/dd')}
          </span>

          {!isPast && (
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${countdownClass}`}>
              距发布 {daysLeft}天
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
