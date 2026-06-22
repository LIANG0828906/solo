import { useState } from 'react'
import { useRecipeStore } from '../RecipeModule/store'
import { createRipple } from '../utils'

interface CollectionPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function CollectionPanel({ isOpen, onClose }: CollectionPanelProps) {
  const recipes = useRecipeStore((s) => s.recipes)
  const favoriteIds = useRecipeStore((s) => s.favoriteIds)
  const toggleFavorite = useRecipeStore((s) => s.toggleFavorite)
  const fetchRecipe = useRecipeStore((s) => s.fetchRecipe)
  const setView = useRecipeStore((s) => s.setView)
  const exportShoppingFromFavorites = useRecipeStore((s) => s.exportShoppingFromFavorites)

  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())

  const favoriteRecipes = recipes.filter((r) => favoriteIds.includes(r.id))

  const handleRemove = (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation()
    createRipple(e)
    setRemovingIds((prev) => new Set(prev).add(recipeId))
    setTimeout(() => {
      toggleFavorite(recipeId)
      setRemovingIds((prev) => {
        const next = new Set(prev)
        next.delete(recipeId)
        return next
      })
    }, 200)
  }

  const handleRecipeClick = (recipeId: string) => {
    fetchRecipe(recipeId)
    setView('detail')
    onClose()
  }

  const handleExport = (e: React.MouseEvent) => {
    createRipple(e)
    exportShoppingFromFavorites(favoriteRecipes)
    onClose()
  }

  return (
    <>
      <div
        className={`drawer-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <div className={`drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2 className="drawer-title">我的收藏 ({favoriteRecipes.length})</h2>
          <button
            className="drawer-close ripple-button"
            onClick={(e) => {
              createRipple(e)
              onClose()
            }}
          >
            ✕
          </button>
        </div>

        <div className="drawer-content">
          {favoriteRecipes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💔</div>
              <p className="empty-text">还没有收藏的食谱</p>
            </div>
          ) : (
            favoriteRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className={`collection-item ${removingIds.has(recipe.id) ? 'removing' : ''}`}
              >
                <img
                  src={recipe.thumbnail}
                  alt={recipe.name}
                  className="collection-thumb"
                  onClick={() => handleRecipeClick(recipe.id)}
                />
                <div className="collection-info">
                  <div
                    className="collection-name"
                    onClick={() => handleRecipeClick(recipe.id)}
                  >
                    {recipe.name}
                  </div>
                  <div className="collection-author">{recipe.author}</div>
                </div>
                <button
                  className="collection-remove ripple-button"
                  onClick={(e) => handleRemove(e, recipe.id)}
                  title="取消收藏"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <div className="drawer-footer">
          <button
            className="export-btn ripple-button"
            disabled={favoriteRecipes.length === 0}
            onClick={handleExport}
          >
            🛒 导出购物清单
          </button>
        </div>
      </div>
    </>
  )
}
