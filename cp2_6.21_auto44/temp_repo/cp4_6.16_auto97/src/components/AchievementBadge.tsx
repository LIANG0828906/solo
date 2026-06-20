import { cn } from '@/lib/utils'
import type { Achievement } from '@/types'

interface AchievementBadgeProps {
  achievement: Achievement
  isAnimating: boolean
}

export default function AchievementBadge({ achievement, isAnimating }: AchievementBadgeProps) {
  const { name, description, icon, unlocked } = achievement

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1 p-3 rounded-content transition-colors',
        unlocked
          ? 'bg-bg-card text-text-primary animate-glow-spin'
          : 'bg-[#45475a] text-[#6c7086]'
      )}
    >
      <span
        className={cn(
          'text-2xl',
          unlocked ? '' : 'grayscale opacity-50',
          isAnimating && 'achievement-icon-anim'
        )}
      >
        {icon}
      </span>
      <span className="text-xs font-semibold text-center leading-tight">{name}</span>
      <span className="text-[10px] text-center leading-tight opacity-70">{description}</span>
    </div>
  )
}
