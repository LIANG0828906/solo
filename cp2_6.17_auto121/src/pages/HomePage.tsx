import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import RecipeCard from '../components/RecipeCard'
import CreateModal from '../components/CreateModal'
import { getRecipes, type Recipe } from '../data/recipes'

function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rippleKey, setRippleKey] = useState(0)
  const [animatingRecipes, setAnimatingRecipes] = useState<Recipe[]>([])
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [visibleCount, setVisibleCount] = useState(15)
  const [columnCount, setColumnCount] = useState(3)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setRecipes(getRecipes())
  }, [])

  const getColumnCount = useCallback(() => {
    const width = window.innerWidth
    if (width < 768) return 1
    if (width < 1024) return 2
    return 3
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setColumnCount(getColumnCount())
    }
    setColumnCount(getColumnCount())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [getColumnCount])

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

  useEffect(() => {
    setIsFadingOut(true)
    const timer = setTimeout(() => {
      setAnimatingRecipes(filteredRecipes)
      setIsFadingOut(false)
      setVisibleCount(15)
    }, 300)
    return () => clearTimeout(timer)
  }, [filteredRecipes])

  const displayedRecipes = useMemo(() => {
    return animatingRecipes.slice(0, visibleCount)
  }, [animatingRecipes, visibleCount])

  const masonryColumns = useMemo(() => {
    const columns: Recipe[][] = Array.from({ length: columnCount }, () => [])
    const columnHeights = new Array(columnCount).fill(0)

    displayedRecipes.forEach(recipe => {
      let minIndex = 0
      for (let i = 1; i < columnCount; i++) {
        if (columnHeights[i] < columnHeights[minIndex]) {
          minIndex = i
        }
      }
      columns[minIndex].push(recipe)
      columnHeights[minIndex] += recipe.steps.length * 20 + 280
    })

    return columns
  }, [displayedRecipes, columnCount])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => Math.min(prev + 10, animatingRecipes.length))
        }
      },
      { rootMargin: '200px' }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => observer.disconnect()
  }, [animatingRecipes.length])

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
    }
  }

  const handleFavoriteChange = (id: string, isFavorited: boolean) => {
    const updater = (prev: Recipe[]) =>
      prev.map(r => (r.id === id ? { ...r, isFavorited } : r))
    setRecipes(updater)
    setAnimatingRecipes(updater)
  }

  const handleRecipeCreated = (newRecipe: Recipe) => {
    const updater = (prev: Recipe[]) => [newRecipe, ...prev]
    setRecipes(updater)
    setAnimatingRecipes(updater)
  }

  const handleFabClick = () => {
    setRippleKey(k => k + 1)
    setIsModalOpen(true)
  }

  return (
    <div className="home-container" ref={containerRef}>
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

      {animatingRecipes.length === 0 && !isFadingOut ? (
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
        <>
          <div className="masonry-grid" style={{ display: 'flex', gap: '20px' }}>
            {masonryColumns.map((column, colIndex) => (
              <div key={colIndex} className="masonry-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
                {column.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    visible={!isFadingOut}
                    onFavoriteChange={handleFavoriteChange}
                  />
                ))}
              </div>
            ))}
          </div>
          {visibleCount < animatingRecipes.length && (
            <div ref={sentinelRef} style={{ height: '1px' }} />
          )}
        </>
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
