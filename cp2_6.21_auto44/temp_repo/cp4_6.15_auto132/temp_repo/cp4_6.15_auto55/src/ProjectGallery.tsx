import { useMemo, useCallback } from 'react'
import { useStore } from '@/store'
import ProjectCard from '@/components/ProjectCard'
import { Search, X, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { Difficulty } from '@/types'

export function ProjectGallery() {
  const { projects, materials, favorites, addFavorite, expandedProjectId, setExpandedProjectId } = useStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | null>(null)

  const getMatchedMaterials = useCallback(
    (requiredTypes: string[]) => {
      return materials.filter(
        (m) => m.status === 'available' && requiredTypes.includes(m.materialType)
      )
    },
    [materials]
  )

  const filteredProjects = useMemo(() => {
    let result = projects

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.requiredMaterialTypes.some((t) => t.toLowerCase().includes(q))
      )
    }

    if (difficultyFilter) {
      result = result.filter((p) => p.difficulty === difficultyFilter)
    }

    return result
  }, [projects, searchQuery, difficultyFilter])

  const handleFavorite = useCallback(
    (id: string) => {
      addFavorite(id, 'project')
    },
    [addFavorite]
  )

  const handleToggleExpand = useCallback(
    (id: string) => {
      setExpandedProjectId(expandedProjectId === id ? null : id)
    },
    [expandedProjectId, setExpandedProjectId]
  )

  const isFavorited = useCallback(
    (id: string) => favorites.some((f) => f.itemId === id),
    [favorites]
  )

  const highMatchCount = filteredProjects.filter((p) => p.matchScore > 70).length

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
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索项目名称或材料类型..."
                className="w-full pl-10 pr-4 py-2.5 rounded-card bg-white/80 border border-white/60 focus:outline-none focus:ring-2 focus:ring-forest/30 text-sm transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Sparkles className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <button
              onClick={() => setDifficultyFilter(null)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                difficultyFilter === null
                  ? 'bg-forest text-white'
                  : 'bg-white/70 text-dark hover:bg-white'
              }`}
            >
              全部
            </button>
            {(['新手', '进阶', '专家'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficultyFilter(d === difficultyFilter ? null : d)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  d === difficultyFilter
                    ? d === '新手'
                      ? 'bg-green-600 text-white'
                      : d === '进阶'
                        ? 'bg-blue-600 text-white'
                        : 'bg-red-600 text-white'
                    : 'bg-white/70 text-dark hover:bg-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            共 <span className="font-medium text-dark">{filteredProjects.length}</span> 个项目灵感
            {highMatchCount > 0 && (
              <span className="ml-2 text-wood font-medium">
                · {highMatchCount} 个高匹配度项目
              </span>
            )}
          </p>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Search className="w-12 h-12 mb-4" />
            <p className="text-lg font-medium">暂无匹配的项目灵感</p>
            <p className="text-sm mt-1">试试调整筛选条件或发布新项目</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <ProjectCard
                  project={project}
                  matchedMaterials={getMatchedMaterials(project.requiredMaterialTypes)}
                  isFavorited={isFavorited(project.id)}
                  isExpanded={expandedProjectId === project.id}
                  onFavorite={handleFavorite}
                  onToggleExpand={handleToggleExpand}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
