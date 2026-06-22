import { useState } from 'react'
import { X, Heart, Trash2, Package, FolderOpen } from 'lucide-react'
import { useStore } from '@/store'
import { CONDITION_EMOJIS } from '@/types'

const FavoritesDrawer = () => {
  const favorites = useStore((s) => s.favorites)
  const materials = useStore((s) => s.materials)
  const projects = useStore((s) => s.projects)
  const showFavoritesDrawer = useStore((s) => s.showFavoritesDrawer)
  const setShowFavoritesDrawer = useStore((s) => s.setShowFavoritesDrawer)
  const removeFavorite = useStore((s) => s.removeFavorite)

  const [activeTab, setActiveTab] = useState<'material' | 'project'>('material')

  if (!showFavoritesDrawer) return null

  const materialFavorites = favorites.filter((f) => f.itemType === 'material')
  const projectFavorites = favorites.filter((f) => f.itemType === 'project')

  const favoritedMaterials = materialFavorites
    .map((f) => ({ fav: f, item: materials.find((m) => m.id === f.itemId) }))
    .filter((entry): entry is { fav: typeof entry.fav; item: NonNullable<typeof entry.item> } => entry.item != null)

  const favoritedProjects = projectFavorites
    .map((f) => ({ fav: f, item: projects.find((p) => p.id === f.itemId) }))
    .filter((entry): entry is { fav: typeof entry.fav; item: NonNullable<typeof entry.item> } => entry.item != null)

  const currentList = activeTab === 'material' ? favoritedMaterials : favoritedProjects

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => setShowFavoritesDrawer(false)}
      />

      <div className="fixed right-0 top-0 z-50 flex h-full w-[380px] max-w-full flex-col animate-slide-in-right rounded-l-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-dark">我的收藏</h2>
          <button
            className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            onClick={() => setShowFavoritesDrawer(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'material'
                ? 'border-b-2 border-forest text-forest'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => setActiveTab('material')}
          >
            <Package className="mr-1 inline h-4 w-4" />
            余料收藏
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'project'
                ? 'border-b-2 border-forest text-forest'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            onClick={() => setActiveTab('project')}
          >
            <FolderOpen className="mr-1 inline h-4 w-4" />
            项目收藏
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Heart className="mb-3 h-10 w-10" />
              <p className="text-sm">暂无收藏</p>
            </div>
          ) : activeTab === 'material' ? (
            <div className="space-y-3">
              {favoritedMaterials.map(({ fav, item }) => (
                <div
                  key={fav.id}
                  className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wood/10">
                    <Package className="h-5 w-5 text-wood" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      {item.materialType}
                      <span className="ml-2">{CONDITION_EMOJIS[item.condition - 1]}</span>
                    </p>
                  </div>
                  <button
                    className="shrink-0 rounded-full p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                    onClick={() => removeFavorite(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {favoritedProjects.map(({ fav, item }) => (
                <div
                  key={fav.id}
                  className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest/10">
                    <FolderOpen className="h-5 w-5 text-forest" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-400">
                      {item.difficulty}
                      <span className="ml-2 text-forest">匹配 {item.matchScore}%</span>
                    </p>
                  </div>
                  <button
                    className="shrink-0 rounded-full p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                    onClick={() => removeFavorite(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default FavoritesDrawer
