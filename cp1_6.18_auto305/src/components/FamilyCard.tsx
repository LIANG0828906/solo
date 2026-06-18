import { cn, formatRelativeTime } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { getTheme } from '@/utils/theme'
import type { Family } from '@/types'

interface FamilyCardProps {
  family: Family
  onClick: () => void
  index: number
}

export default function FamilyCard({ family, onClick, index }: FamilyCardProps) {
  const { ref, isIntersecting } = useIntersectionObserver({ once: true, threshold: 0.1 })
  const theme = getTheme(family.theme)

  const gradientStyle = {
    background: `linear-gradient(135deg, ${theme.bgColors[0]} 0%, ${theme.bgColors[1]} 50%, ${theme.bgColors[2]} 100%)`,
  }

  const displayMembers = family.members.slice(0, 4)
  const extraCount = family.members.length - 4

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={cn(
        'rounded-card shadow-card p-5 cursor-pointer',
        'transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
        isIntersecting ? 'animate-slide-up' : 'opacity-0 translate-y-8'
      )}
      style={{
        ...gradientStyle,
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-text-primary">{family.name}</h3>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {family.members.length}
        </div>
      </div>

      <div className="flex -space-x-2 mb-4">
        {displayMembers.map((member, idx) => (
          <div
            key={member.id}
            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: member.avatarColor, zIndex: 4 - idx }}
            title={member.name}
          >
            {member.name.charAt(0)}
          </div>
        ))}
        {extraCount > 0 && (
          <div
            className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-white text-xs font-medium"
            style={{ zIndex: 0 }}
          >
            +{extraCount}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-text-secondary">
        <span>最后记录：</span>
        <span>
          {family.lastRecordAt ? formatRelativeTime(family.lastRecordAt) : '暂无记录'}
        </span>
      </div>
    </div>
  )
}
