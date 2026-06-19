import { Leaf, Plus } from 'lucide-react'
import type { Plant } from '@/plantManager/core/plantModel'
import { cn } from '@/shared/utils'
import PlantCard from './PlantCard'

interface PlantListProps {
  plants: Plant[]
  onPlantClick?: (id: string) => void
  highlightedId?: string
  newPlantId?: string
  groupByCategory?: boolean
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  succulent: { label: '多肉植物', icon: '🌵' },
  foliage: { label: '观叶植物', icon: '🌿' },
  flowering: { label: '开花植物', icon: '🌸' },
  other: { label: '其他植物', icon: '🌱' },
}

const CATEGORY_ORDER = ['succulent', 'foliage', 'flowering', 'other']

function renderPlantGrid(
  plants: Plant[],
  onPlantClick?: (id: string) => void,
  highlightedId?: string,
  newPlantId?: string
) {
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

export default function PlantList({ plants, onPlantClick, highlightedId, newPlantId, groupByCategory }: PlantListProps) {
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

  if (!groupByCategory) {
    return renderPlantGrid(plants, onPlantClick, highlightedId, newPlantId)
  }

  const grouped: Record<string, Plant[]> = {}
  for (const plant of plants) {
    const key = CATEGORY_META[plant.category] ? plant.category : 'other'
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(plant)
  }

  const categoriesToShow = CATEGORY_ORDER.filter((cat) => grouped[cat] && grouped[cat].length > 0)

  return (
    <div className="space-y-8">
      {categoriesToShow.map((category) => {
        const meta = CATEGORY_META[category]
        const categoryPlants = grouped[category]
        return (
          <div key={category}>
            <div className="flex items-center gap-2 pb-2 mb-4 border-b-2 border-gray-100 mt-0 first:mt-0">
              <span className="text-2xl">{meta.icon}</span>
              <h3 className="text-base font-bold text-gray-800">
                {meta.label}
              </h3>
              <span className="text-xs text-gray-400 font-normal">
                ({categoryPlants.length} 盆)
              </span>
            </div>
            {renderPlantGrid(categoryPlants, onPlantClick, highlightedId, newPlantId)}
          </div>
        )
      })}
    </div>
  )
}
