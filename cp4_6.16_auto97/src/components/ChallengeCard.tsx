import { Trophy, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Challenge } from '@/types'

interface ChallengeCardProps {
  challenge: Challenge
  solvedChallengeIds: string[]
  onClick: () => void
}

const difficultyConfig = {
  easy: { label: '简单', color: 'bg-difficulty-easy text-[#1e1e2e]' },
  medium: { label: '中等', color: 'bg-difficulty-medium text-[#1e1e2e]' },
  hard: { label: '困难', color: 'bg-difficulty-hard text-[#1e1e2e]' },
} as const

export default function ChallengeCard({ challenge, solvedChallengeIds, onClick }: ChallengeCardProps) {
  const { id, title, difficulty, passRate, tags } = challenge
  const isSolved = solvedChallengeIds.includes(id)
  const config = difficultyConfig[difficulty]

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-bg-card rounded-card p-4 cursor-pointer',
        'transition-all duration-200 ease-out',
        'hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:-translate-y-1',
        isSolved && 'ring-1 ring-difficulty-easy/40'
      )}
    >
      <span
        className={cn(
          'absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs font-semibold',
          config.color
        )}
      >
        {config.label}
      </span>

      <div className="flex items-start justify-between mt-7">
        <h3 className="text-text-primary font-semibold text-sm leading-snug pr-2">
          {title}
        </h3>
        {isSolved && (
          <span className="shrink-0 text-difficulty-easy text-xs font-semibold bg-difficulty-easy/10 px-2 py-0.5 rounded-full">
            已完成
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-text-secondary text-xs">
        <Trophy size={14} className="text-accent shrink-0" />
        <span>通过率 {(passRate * 100).toFixed(0)}%</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mt-2">
        <Tag size={12} className="text-text-secondary shrink-0" />
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-text-secondary text-[11px] bg-bg-hover px-1.5 py-0.5 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
