import { Leaf, Plus } from 'lucide-react'
import type { Plant } from '@/plantManager/core/plantModel'
import { cn } from '@/shared/utils'
import PlantCard from './PlantCard'

interface PlantListProps {
  plants: Plant[]
  onPlantClick?: (id: string) => void
  highlightedId?: string
  newPlantId?: string
}

export default function PlantList({ plants, onPlantClick, highlightedId, newPlantId }: PlantListProps) {
  if (plants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Leaf size={36} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">还没有植物</h3>
        <p className="text-sm text-gray-400 mb-4 text-center">添加你的第一盆植物，开始养护之旅吧</p>
        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          添加植物
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid gap-4',
        'grid-cols-1 max-[480px]:grid-cols-1',
        'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      )}
    >
      {plants.map((plant) => (
        <PlantCard
          key={plant.id}
          plant={plant}
          onClick={() => onPlantClick?.(plant.id)}
          isHighlighted={plant.id === highlightedId}
          isNew={plant.id === newPlantId}
        />
      ))}
    </div>
  )
}
