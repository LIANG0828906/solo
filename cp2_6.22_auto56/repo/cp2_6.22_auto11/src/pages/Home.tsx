import { useState, useEffect, useRef, useCallback } from 'react'
import RecipeCard, { Recipe } from '@/RecipeCard'
import { apiRequest } from '@/store/authStore'
import SearchBox from '@/SearchBox'
import './Home.css'

const TAGS = ['全部', '中餐', '甜点', '低卡', '家常菜', '烘焙', '快手菜', '汤品', '素菜']

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [activeTag, setActiveTag] = useState('全部')
  const [page, setPage] = useState(1)
  const loaderRef = useRef<HTMLDivElement>(null)

  const loadRecipes = useCallback(async (reset = false) => {
    if (loading) return

    setLoading(true)
    try {
      const currentPage = reset ? 1 : page
      const tag = activeTag === '全部' ? undefined : activeTag
      const response = await apiRequest(
        `/api/recipes?page=${currentPage}&limit=12${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`
      )
      const data = await response.json()

      if (reset) {
        setRecipes(data.recipes)
        setPage(2)
      } else {
        setRecipes((prev) => [...prev, ...data.recipes])
        setPage((prev) => prev + 1)
      }
      setHasMore(data.hasMore)
    } catch (err) {
      console.error('加载食谱失败:', err)
    } finally {
      setLoading(false)
    }
  }, [loading, page, activeTag])

  useEffect(() => {
    setRecipes([])
    setPage(1)
    setHasMore(true)
    loadRecipes(true)
  }, [activeTag])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadRecipes()
        }
      },
      { rootMargin: '200px' }
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, loading, loadRecipes])

  const skeletonCards = Array.from({ length: 6 }, (_, i) => (
    <div key={i} className="recipe-skeleton">
      <div className="skeleton skeleton-image" />
      <div className="skeleton-content">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-desc" />
        <div className="skeleton-tags">
          <div className="skeleton skeleton-tag" />
          <div className="skeleton skeleton-tag" />
        </div>
      </div>
    </div>
  ))

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            发现美食<span className="highlight">灵感</span>
          </h1>
          <p className="hero-subtitle">
            输入冰箱里的食材，智能匹配适合你的食谱
          </p>
          <div className="hero-search">
            <SearchBox showIngredientMode placeholder="输入你有的食材，看看能做什么..." />
          </div>
        </div>
        <div className="hero-decoration">
          <span className="food-emoji food-1">🍜</span>
          <span className="food-emoji food-2">🥗</span>
          <span className="food-emoji food-3">🍰</span>
          <span className="food-emoji food-4">🍲</span>
          <span className="food-emoji food-5">🥘</span>
        </div>
      </div>

      <div className="content-section">
        <div className="tags-container">
          <div className="tags-scroll">
            {TAGS.map((tag) => (
              <button
                key={tag}
                className={`tag-pill ${activeTag === tag ? 'active' : ''}`}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="recipes-waterfall">
          {loading && recipes.length === 0 ? (
            <div className="skeleton-grid">{skeletonCards}</div>
          ) : (
            <div className="masonry-grid">
              {recipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  style={{ animationDelay: `${index * 0.05}s` }}
                />
              ))}
            </div>
          )}
        </div>

        {loading && recipes.length > 0 && (
          <div className="loading-more">
            <div className="loading-spinner" />
            <span>加载更多...</span>
          </div>
        )}

        {!hasMore && recipes.length > 0 && (
          <div className="no-more">已经到底啦 ~</div>
        )}

        <div ref={loaderRef} className="infinite-scroll-sentinel" />
      </div>
    </div>
  )
}
