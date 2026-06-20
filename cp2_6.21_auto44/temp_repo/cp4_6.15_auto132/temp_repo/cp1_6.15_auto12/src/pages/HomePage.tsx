import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchRecipes } from '../api'
import type { Recipe } from '../types'
import RecipeCard from '../components/RecipeCard'

const CATEGORIES = ['全部', '川菜', '快手菜', '甜品']

interface HomePageProps {
  navigate: (path: string) => void
}

export default function HomePage({ navigate }: HomePageProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [category, setCategory] = useState('全部')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)

  const loadRecipes = useCallback(async (cat: string, pg: number, append: boolean) => {
    try {
      setLoading(true)
      const queryCat = cat === '全部' ? undefined : cat
      const res = await fetchRecipes(queryCat, pg, 12)
      if (append) {
        setRecipes(prev => [...prev, ...res.data])
      } else {
        setRecipes(res.data)
      }
      setHasMore(res.data.length >= 12)
    } catch (e) {
      console.error('加载菜谱失败:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    setHasMore(true)
    loadRecipes(category, 1, false)
  }, [category, loadRecipes])

  useEffect(() => {
    if (!loaderRef.current || !hasMore) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          const next = page + 1
          setPage(next)
          loadRecipes(category, next, true)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [page, loading, hasMore, category, loadRecipes])

  return (
    <div className="home-page">
      <style>{homeCSS}</style>
      <div className="home-hero">
        <h1 className="home-hero-title">家的味道，从这里开始</h1>
        <p className="home-hero-sub">和家人们一起记录每一道拿手好菜</p>
      </div>
      <div className="home-filter-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`home-filter-btn ${category === cat ? 'home-filter-btn-active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="home-grid">
        {recipes.map((recipe, idx) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            index={idx}
            onClick={() => navigate(`/recipe/${recipe.id}`)}
          />
        ))}
      </div>
      {loading && (
        <div className="home-loading">
          <div className="home-spinner" />
          <span className="home-loading-text">加载中...</span>
        </div>
      )}
      <div ref={loaderRef} style={{ height: 1 }} />
      {!hasMore && recipes.length > 0 && (
        <p className="home-no-more">— 已经到底了 —</p>
      )}
    </div>
  )
}

const homeCSS = `
  .home-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px 48px;
  }
  @media (max-width: 768px) {
    .home-page {
      padding: 0 16px 32px;
    }
  }

  .home-hero {
    text-align: center;
    padding: 48px 0 36px;
  }
  @media (max-width: 768px) {
    .home-hero {
      padding: 32px 0 24px;
    }
  }
  .home-hero-title {
    font-size: 36px;
    font-weight: 700;
    color: #4A3728;
    margin-bottom: 8px;
    font-family: 'Noto Serif SC', serif;
  }
  @media (max-width: 768px) {
    .home-hero-title { font-size: 28px; }
  }
  .home-hero-sub {
    font-size: 16px;
    color: #8B7355;
  }

  .home-filter-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }
  .home-filter-btn {
    padding: 8px 24px;
    border-radius: 24px;
    border: 1.5px solid #D4A574;
    background: transparent;
    color: #8B7355;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.25s ease;
    font-family: 'Noto Sans SC', sans-serif;
  }
  .home-filter-btn:hover {
    background: rgba(212, 165, 116, 0.1);
  }
  .home-filter-btn-active {
    background: #D4A574;
    color: #FFFFFF;
    border-color: #D4A574;
  }

  .home-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  @media (max-width: 1024px) {
    .home-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 768px) {
    .home-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }

  .home-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 32px 0;
  }
  .home-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #F5E6D3;
    border-top-color: #D4A574;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  .home-loading-text {
    color: #8B7355;
    font-size: 14px;
  }
  .home-no-more {
    text-align: center;
    color: #BFA882;
    font-size: 14px;
    padding: 24px 0;
  }
`
