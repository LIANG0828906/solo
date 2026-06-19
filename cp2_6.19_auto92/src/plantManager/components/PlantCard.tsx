import { Clover, Leaf, Flower2, Sprout } from 'lucide-react'
import type { Plant } from '@/plantManager/core/plantModel'
import { cn, addDays } from '@/shared/utils'

interface PlantCardProps {
  plant: Plant
  onClick?: () => void
  isHighlighted?: boolean
  isNew?: boolean
}

const categoryIcons = {
  succulent: Clover,
  foliage: Leaf,
  flowering: Flower2,
  other: Sprout,
}

const categoryColors = {
  succulent: 'text-emerald-500',
  foliage: 'text-green-500',
  flowering: 'text-pink-500',
  other: 'text-amber-500',
}

export default function PlantCard({ plant, onClick, isHighlighted, isNew }: PlantCardProps) {
  const lastWatering = plant.lastWateringDate ?? plant.purchaseDate
  const nextWateringDate = addDays(lastWatering, plant.wateringCycle)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  nextWateringDate.setHours(0, 0, 0, 0)

  const diffDays = Math.ceil((nextWateringDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = diffDays < 0
  const overdueDays = Math.abs(diffDays)

  const Icon = categoryIcons[plant.category as keyof typeof categoryIcons] ?? Sprout
  const iconColor = categoryColors[plant.category as keyof typeof categoryColors] ?? 'text-gray-500'

  const getWateringText = () => {
    if (isOverdue) {
      return `已逾期${overdueDays}天`
    }
    if (diffDays === 0) {
      return '今天需要浇水'
    }
    if (diffDays === 1) {
      return '明天需要浇水'
    }
    return `下次浇水：${diffDays}天后`
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-white rounded-xl shadow-md cursor-pointer',
        'aspect-[3/2] flex items-center justify-center p-4',
        'transition-all duration-250 ease-out',
        'hover:-translate-y-1 hover:shadow-lg',
        isNew && 'animate-scale-in',
        isHighlighted && 'animate-highlight-flash ring-2 ring-dashed ring-amber-400'
      )}
    >
      {isOverdue && (
        <div className="absolute top-3 right-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse-dot" />
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className={cn('flex-shrink-0 p-3 rounded-full bg-gray-50', iconColor)}>
          <Icon size={28} strokeWidth={1.5} />
        </div>

        <div className="flex flex-col justify-center min-w-0">
          <h3 className="font-semibold text-gray-800 truncate text-base">{plant.name}</h3>
          <p
            className={cn(
              'text-sm mt-1 truncate',
              isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'
            )}
          >
            {getWateringText()}
          </p>
        </div>
      </div>
    </div>
  )
}
