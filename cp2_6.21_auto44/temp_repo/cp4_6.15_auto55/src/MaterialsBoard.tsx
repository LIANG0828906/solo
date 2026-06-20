import { useState, useMemo, useCallback } from 'react'
import { useStore } from '@/store'
import {
  MATERIAL_TYPES,
  CONDITION_EMOJIS,
  calculateColorSimilarity,
  toHexColor,
} from '@/types'
import type { MaterialType, HexColor } from '@/types'
import MaterialCard from '@/components/MaterialCard'
import { ColorThemePicker } from '@/ColorThemePicker'
import { Search, SlidersHorizontal, X, Palette } from 'lucide-react'

export function MaterialsBoard() {
  const {
    materials,
    filters,
    updateFilters,
    favorites,
    setConfirmDialog,
    addFavorite,
    materialOrder,
    reorderMaterials,
  } = useStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const materialOrderIndexMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    materialOrder.forEach((id, index) => {
      map[id] = index
    })
    return map
  }, [materialOrder])

  const searchedMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materials
    const q = searchQuery.toLowerCase()
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.materialType.toLowerCase().includes(q) ||
        m.dimensions.toLowerCase().includes(q)
    )
  }, [materials, searchQuery])

  const typeFilteredMaterials = useMemo(() => {
    if (!filters.materialType) return searchedMaterials
    return searchedMaterials.filter((m) => m.materialType === filters.materialType)
  }, [searchedMaterials, filters.materialType])

  const colorFilteredMaterials = useMemo(() => {
    if (!filters.color) return typeFilteredMaterials
    const targetColor = toHexColor(filters.color)
    return typeFilteredMaterials.filter((m) => {
      return calculateColorSimilarity(m.color, targetColor) >= 40
    })
  }, [typeFilteredMaterials, filters.color])

  const conditionFilteredMaterials = useMemo(() => {
    const [min, max] = filters.conditionRange
    if (min <= 1 && max >= 5) return colorFilteredMaterials
    return colorFilteredMaterials.filter(
      (m) => m.condition >= min && m.condition <= max
    )
  }, [colorFilteredMaterials, filters.conditionRange])

  const filteredMaterials = useMemo(() => {
    return [...conditionFilteredMaterials].sort((a, b) => {
      const indexA = materialOrderIndexMap[a.id]
      const indexB = materialOrderIndexMap[b.id]
      if (indexA === undefined) return 1
      if (indexB === undefined) return -1
      return indexA - indexB
    })
  }, [conditionFilteredMaterials, materialOrderIndexMap])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const handleToggleColorPicker = useCallback(() => {
    setShowColorPicker((prev) => !prev)
  }, [])

  const handleCloseColorPicker = useCallback(() => {
    setShowColorPicker(false)
  }, [])

  const handleMaterialTypeFilter = useCallback(
    (type: MaterialType | null) => {
      updateFilters({ materialType: type })
    },
    [updateFilters]
  )

  const handleMinConditionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFilters({
        conditionRange: [Number(e.target.value), filters.conditionRange[1]],
      })
    },
    [updateFilters, filters.conditionRange]
  )

  const handleMaxConditionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFilters({
        conditionRange: [filters.conditionRange[0], Number(e.target.value)],
      })
    },
    [updateFilters, filters.conditionRange]
  )

  const handleMarkTaken = useCallback(
    (id: string) => {
      const material = materials.find((m) => m.id === id)
      if (material) {
        setConfirmDialog({
          show: true,
          materialId: id,
          message: `确认将「${material.name}」标记为已取走？`,
        })
      }
    },
    [materials, setConfirmDialog]
  )

  const handleFavorite = useCallback(
    (id: string) => {
      addFavorite(id, 'material')
    },
    [addFavorite]
  )

  const handleShare = useCallback((_id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
    }
  }, [])

  const isFavorited = useCallback(
    (id: string) => favorites.some((f) => f.itemId === id),
    [favorites]
  )

  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, id: string) => {
      setDraggedId(id)
      e.dataTransfer.setData('text/plain', id)
      e.dataTransfer.effectAllowed = 'move'
    },
    []
  )

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>, id: string) => {
      e.preventDefault()
      if (draggedId && draggedId !== id) {
        setDragOverId(id)
      }
    },
    [draggedId]
  )

  const onDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>, id: string) => {
      e.preventDefault()
      if (dragOverId === id) {
        setDragOverId(null)
      }
    },
    [dragOverId]
  )

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, dropId: string) => {
      e.preventDefault()
      const dragId = e.dataTransfer.getData('text/plain')
      if (dragId && dropId && dragId !== dropId) {
        reorderMaterials({ dragId, dropId })
      }
      setDraggedId(null)
      setDragOverId(null)
    },
    [reorderMaterials]
  )

  const onDragEnd = useCallback(() => {
    setDraggedId(null)
    setDragOverId(null)
  }, [])

  const activeType = filters.materialType

  return (
    <div className="w-full">
      <div className="sticky top-[72px] z-20 bg-sky-light/80 backdrop-blur-sm py-4 -mx-2 px-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="搜索余料名称、类型、尺寸..."
                className="w-full pl-10 pr-4 py-2.5 rounded-card bg-white/80 border border-white/60 focus:outline-none focus:ring-2 focus:ring-forest/30 text-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={handleToggleColorPicker}
              className={`btn-hover flex items-center gap-2 px-4 py-2.5 rounded-card text-sm font-medium transition-all ${
                filters.color
                  ? 'bg-forest text-white'
                  : 'bg-white/80 text-dark border border-white/60'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span className="hidden md:inline">颜色</span>
              {filters.color && (
                <span
                  className="w-4 h-4 rounded-full border border-white/50"
                  style={{ backgroundColor: filters.color }}
                />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <SlidersHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <button
              onClick={() => handleMaterialTypeFilter(null)}
              className={`filter-tab flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeType === null
                  ? 'bg-forest text-white active'
                  : 'bg-white/70 text-dark hover:bg-white'
              }`}
            >
              全部
            </button>
            {MATERIAL_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleMaterialTypeFilter(type === activeType ? null : type)}
                className={`filter-tab flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  type === activeType
                    ? 'bg-forest text-white active'
                    : 'bg-white/70 text-dark hover:bg-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>新旧程度:</span>
            <input
              type="range"
              min="1"
              max="5"
              value={filters.conditionRange[0]}
              onChange={handleMinConditionChange}
              className="w-20 accent-forest"
            />
            <span>{CONDITION_EMOJIS[filters.conditionRange[0] - 1]}</span>
            <span>~</span>
            <input
              type="range"
              min="1"
              max="5"
              value={filters.conditionRange[1]}
              onChange={handleMaxConditionChange}
              className="w-20 accent-forest"
            />
            <span>{CONDITION_EMOJIS[filters.conditionRange[1] - 1]}</span>
          </div>
        </div>

        {showColorPicker && (
          <div className="mt-3 animate-fade-in">
            <ColorThemePicker onClose={handleCloseColorPicker} />
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            共 <span className="font-medium text-dark">{filteredMaterials.length}</span> 件余料
          </p>
        </div>

        {filteredMaterials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Search className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">暂无匹配的余料</p>
            <p className="text-sm mt-1">试试调整筛选条件</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMaterials.map((material, index) => (
              <div
                key={material.id}
                draggable={true}
                onDragStart={(e) => onDragStart(e, material.id)}
                onDragOver={onDragOver}
                onDragEnter={(e) => onDragEnter(e, material.id)}
                onDragLeave={(e) => onDragLeave(e, material.id)}
                onDrop={(e) => onDrop(e, material.id)}
                onDragEnd={onDragEnd}
                className={`animate-fade-in transition-all duration-200 ${
                  draggedId === material.id ? 'opacity-50' : ''
                } ${
                  dragOverId === material.id && draggedId !== material.id
                    ? 'ring-2 ring-forest rounded-card'
                    : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <MaterialCard
                  material={material}
                  onMarkTaken={handleMarkTaken}
                  onFavorite={handleFavorite}
                  onShare={handleShare}
                  isFavorited={isFavorited(material.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
