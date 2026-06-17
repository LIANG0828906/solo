import { useState, useEffect, useMemo } from 'react'
import RecipeCard from '../components/RecipeCard'
import CreateModal from '../components/CreateModal'
import { getRecipes, type Recipe } from '../data/recipes'

function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rippleKey, setRippleKey] = useState(0)

  useEffect(() => {
    setRecipes(getRecipes())
  }, [])

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes
    const query = searchQuery.toLowerCase().trim()
    return recipes.filter(
      r =>
        r.name.toLowerCase().includes(query) ||
        r.author.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.ingredients.some(i => i.toLowerCase().includes(query))
    )
  }, [recipes, searchQuery])

  const visibleMap = useMemo(() => {
    const map = new Map<string, boolean>()
    filteredRecipes.forEach(r => map.set(r.id, true))
    return map
  }, [filteredRecipes])

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
    }
  }

  const handleFavoriteChange = (id: string, isFavorited: boolean) => {
    setRecipes(prev =>
      prev.map(r => (r.id === id ? { ...r, isFavorited } : r))
    )
  }

  const handleRecipeCreated = (newRecipe: Recipe) => {
    setRecipes(prev => [newRecipe, ...prev])
  }

  const handleFabClick = () => {
    setRippleKey(k => k + 1)
    setIsModalOpen(true)
  }

  return (
    <div className="home-container">
      <h1 className="app-title">RecipeForge</h1>
      <p className="app-subtitle">你的个人食谱管家</p>

      <div className="search-container">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="搜索菜谱、食材或作者..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <button className="search-btn" aria-label="搜索">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
          </svg>
          <p>没有找到匹配的菜谱</p>
        </div>
      ) : (
        <div className="masonry-grid">
          {recipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              visible={visibleMap.get(recipe.id) ?? false}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      )}

      <button className="fab" onClick={handleFabClick} aria-label="创建新菜谱">
        <span key={rippleKey} className="ripple" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <CreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRecipeCreated={handleRecipeCreated}
      />
    </div>
  )
}

export default HomePage
