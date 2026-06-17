import { useEffect, useRef, useState, useCallback } from 'react'
import type { Recipe } from '../types'
import { useRecipeStore } from './store'
import { debounce, createRipple } from '../utils'

interface Suggestion {
  id: string
  name: string
  thumbnail: string
}

function LazyImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const imgRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = imgRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '100px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={imgRef} className={className} style={{ position: 'relative' }}>
      {!loaded && <div className="skeleton" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />}
      {inView && (
        <img
          src={src}
          alt={alt}
          className={className}
          onLoad={() => setLoaded(true)}
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
      )}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="card-skeleton">
      <div className="skeleton card-skeleton-image" />
      <div className="card-skeleton-content">
        <div className="skeleton card-skeleton-title" />
        <div className="skeleton card-skeleton-author" />
        <div className="skeleton card-skeleton-meta" />
      </div>
    </div>
  )
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [animating, setAnimating] = useState(false)
  const isFav = useRecipeStore((s) => s.isFavorite(recipe.id))
  const toggleFavorite = useRecipeStore((s) => s.toggleFavorite)
  const fetchRecipe = useRecipeStore((s) => s.fetchRecipe)
  const setView = useRecipeStore((s) => s.setView)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    createRipple(e)
    setAnimating(true)
    toggleFavorite(recipe.id)
    setTimeout(() => setAnimating(false), 200)
  }

  const handleCardClick = () => {
    fetchRecipe(recipe.id)
    setView('detail')
  }

  return (
    <div className="recipe-card" onClick={handleCardClick}>
      <div className="card-image-wrapper">
        <LazyImage src={recipe.thumbnail} alt={recipe.name} className="card-image" />
        <button
          className="card-favorite-btn ripple-button"
          onClick={handleFavoriteClick}
        >
          <span
            className={`heart-icon ${isFav ? 'favorited' : 'not-favorited'} ${animating ? 'animating' : ''}`}
          >
            {isFav ? '♥' : '♡'}
          </span>
        </button>
      </div>
      <div className="card-content">
        <h3 className="card-title">{recipe.name}</h3>
        <div className="card-author">
          <span>👨‍🍳</span>
          <span>{recipe.author}</span>
        </div>
        <div className="card-meta">
          <div className="card-meta-item">
            <span>⏱</span>
            <span>{recipe.cookingTime}分钟</span>
          </div>
          <div className="card-meta-item">
            <span>📊</span>
            <span>{recipe.difficulty}</span>
          </div>
          <div className="card-meta-item">
            <span>🏷</span>
            <span>{recipe.category}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RecipeList() {
  const recipes = useRecipeStore((s) => s.filteredRecipes)
  const allRecipes = useRecipeStore((s) => s.recipes)
  const loading = useRecipeStore((s) => s.loading)
  const error = useRecipeStore((s) => s.error)
  const fetchRecipes = useRecipeStore((s) => s.fetchRecipes)
  const searchRecipes = useRecipeStore((s) => s.searchRecipes)
  const fetchRecipe = useRecipeStore((s) => s.fetchRecipe)
  const setView = useRecipeStore((s) => s.setView)
  const favoriteIds = useRecipeStore((s) => s.favoriteIds)

  const [searchValue, setSearchValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const debouncedSearch = useCallback(
    debounce(async (keyword: string) => {
      searchRecipes(keyword)
      if (keyword.trim()) {
        try {
          const res = await fetch(
            `/api/recipes/suggest?search=${encodeURIComponent(keyword)}`
          )
          const data = await res.json()
          if (data.success) {
            setSuggestions(data.data)
          }
        } catch {
          setSuggestions([])
        }
      } else {
        setSuggestions([])
      }
    }, 300),
    [searchRecipes]
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    debouncedSearch(value)
  }

  const handleSuggestionClick = (id: string) => {
    fetchRecipe(id)
    setView('detail')
    setFocused(false)
    setSearchValue('')
    setSuggestions([])
  }

  const displayRecipes = recipes.slice(0, 8)

  if (error) {
    return (
      <div className="error-container">
        <p className="error-text">{error}</p>
        <button className="retry-btn ripple-button" onClick={(e) => { createRipple(e); fetchRecipes() }}>
          重试
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="search-container" ref={searchContainerRef}>
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="搜索食谱、作者或分类..."
          value={searchValue}
          onChange={handleSearchChange}
          onFocus={() => setFocused(true)}
        />
        {focused && suggestions.length > 0 && (
          <div className="search-suggestions">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="search-suggestion-item"
                onClick={() => handleSuggestionClick(s.id)}
              >
                <img src={s.thumbnail} alt={s.name} className="suggestion-thumb" />
                <span className="suggestion-name">{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-value">{allRecipes.length}</div>
          <div className="stat-label">食谱总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{favoriteIds.length}</div>
          <div className="stat-label">我的收藏</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{displayRecipes.length}</div>
          <div className="stat-label">当前展示</div>
        </div>
      </div>

      {loading ? (
        <div className="recipe-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : displayRecipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <p className="empty-text">暂无食谱，试试其他关键词</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {displayRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
