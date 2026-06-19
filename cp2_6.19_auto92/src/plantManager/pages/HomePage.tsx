import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, ArrowUpDown, Clock, Grid3X3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PlantList from '@/plantManager/components/PlantList'
import AddPlantModal from '@/plantManager/components/AddPlantModal'
import type { PlantFormData } from '@/plantManager/components/AddPlantModal'
import type { Plant } from '@/plantManager/core/plantModel'
import { getAllPlants, addPlant } from '@/plantManager/core/careLogService'
import { cn } from '@/shared/utils'

type SortType = 'watering-asc' | 'watering-desc' | 'last-care' | 'category'

const sortLabels: Record<SortType, string> = {
  'watering-asc': '浇水周期升序',
  'watering-desc': '浇水周期降序',
  'last-care': '最近养护时间',
  'category': '按种类分组',
}

export default function HomePage() {
  const navigate = useNavigate()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [sortType, setSortType] = useState<SortType>('last-care')
  const [plants, setPlants] = useState<Plant[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [highlightedPlantId, setHighlightedPlantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlants()
  }, [])

  const loadPlants = async () => {
    try {
      const data = await getAllPlants()
      setPlants(data)
    } catch (error) {
      console.error('Failed to load plants:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPlants = useMemo(() => {
    if (!searchKeyword.trim()) {
      return plants
    }
    const keyword = searchKeyword.toLowerCase().trim()
    return plants.filter(
      (plant) =>
        plant.name.toLowerCase().includes(keyword) ||
        plant.category.toLowerCase().includes(keyword)
    )
  }, [plants, searchKeyword])

  const filteredAndSortedPlants = useMemo(() => {
    const result = [...filteredPlants]

    switch (sortType) {
      case 'watering-asc':
        result.sort((a, b) => a.wateringCycle - b.wateringCycle)
        break
      case 'watering-desc':
        result.sort((a, b) => b.wateringCycle - a.wateringCycle)
        break
      case 'last-care':
        result.sort((a, b) => {
          const aDate = a.lastWateringDate ?? a.purchaseDate
          const bDate = b.lastWateringDate ?? b.purchaseDate
          return new Date(bDate).getTime() - new Date(aDate).getTime()
        })
        break
      case 'category':
        result.sort((a, b) => a.category.localeCompare(b.category))
        break
    }

    return result
  }, [filteredPlants, sortType])

  useEffect(() => {
    if (searchKeyword.trim() && filteredPlants.length > 0) {
      const keyword = searchKeyword.toLowerCase().trim()
      const matchedPlant = filteredPlants.find(
        (p) =>
          p.name.toLowerCase() === keyword ||
          p.category.toLowerCase() === keyword
      )
      if (matchedPlant) {
        setHighlightedPlantId(matchedPlant.id)
        const timer = setTimeout(() => setHighlightedPlantId(null), 2000)
        return () => clearTimeout(timer)
      }
    } else {
      setHighlightedPlantId(null)
    }
  }, [searchKeyword, filteredPlants])

  const handlePlantClick = (id: string) => {
    navigate(`/plant/${id}`)
  }

  const handleAddPlant = async (formData: PlantFormData) => {
    try {
      const newPlant = await addPlant(formData)
      setPlants((prev) => [...prev, newPlant])
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to add plant:', error)
    }
  }

  const SortButton = ({ type, icon: Icon }: { type: SortType; icon: typeof Search }) => (
    <button
      onClick={() => setSortType(type)}
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        sortType === type
          ? 'bg-emerald-500 text-white shadow-md'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      )}
      title={sortLabels[type]}
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{sortLabels[type]}</span>
    </button>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">我的植物</h1>
          <p className="text-sm text-gray-500">共 {plants.length} 盆植物</p>
        </header>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索植物名称或种类..."
              className={cn(
                'w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-white text-gray-800',
                'focus:outline-none focus:ring-0 transition-all duration-200',
                'border-gray-200 focus:border-emerald-400 focus:shadow-lg focus:shadow-emerald-100'
              )}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <SortButton type="watering-asc" icon={ArrowUpDown} />
            <SortButton type="watering-desc" icon={ArrowUpDown} />
            <SortButton type="last-care" icon={Clock} />
            <SortButton type="category" icon={Grid3X3} />
          </div>
        </div>

        <div className="transition-all duration-500 ease-out">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <PlantList
              plants={filteredAndSortedPlants}
              onPlantClick={handlePlantClick}
              highlightedId={highlightedPlantId ?? undefined}
              groupByCategory={sortType === 'category'}
            />
          )}
        </div>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className={cn(
          'fixed right-6 bottom-6 w-14 h-14 rounded-full bg-emerald-500 text-white',
          'flex items-center justify-center shadow-lg shadow-emerald-500/30',
          'hover:bg-emerald-600 hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/40',
          'active:scale-95 transition-all duration-200 z-40'
        )}
      >
        <Plus size={28} strokeWidth={2.5} />
      </button>

      <AddPlantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddPlant}
      />
    </div>
  )
}
