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
    <div style={styles.container}>
      <style>{homeCSS}</style>
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>家的味道，从这里开始</h1>
        <p style={styles.heroSub}>和家人们一起记录每一道拿手好菜</p>
      </div>
      <div style={styles.filterBar}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            style={{
              ...styles.filterBtn,
              ...(category === cat ? styles.filterBtnActive : {}),
            }}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="recipe-grid" style={styles.grid}>
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
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <span style={styles.loadingText}>加载中...</span>
        </div>
      )}
      <div ref={loaderRef} style={{ height: 1 }} />
      {!hasMore && recipes.length > 0 && (
        <p style={styles.noMore}>— 已经到底了 —</p>
      )}
    </div>
  )
}

const homeCSS = `
  .recipe-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  @media (max-width: 1024px) {
    .recipe-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 768px) {
    .recipe-grid { grid-template-columns: 1fr; gap: 16px; }
  }
`

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px 48px',
  },
  hero: {
    textAlign: 'center',
    padding: '48px 0 36px',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 700,
    color: '#4A3728',
    marginBottom: 8,
    fontFamily: "'Noto Serif SC', serif",
  },
  heroSub: {
    fontSize: 16,
    color: '#8B7355',
  },
  filterBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 28,
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '8px 24px',
    borderRadius: 24,
    border: '1.5px solid #D4A574',
    background: 'transparent',
    color: '#8B7355',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    fontFamily: "'Noto Sans SC', sans-serif",
  },
  filterBtnActive: {
    background: '#D4A574',
    color: '#FFFFFF',
    borderColor: '#D4A574',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: '32px 0',
  },
  spinner: {
    width: 24,
    height: 24,
    border: '3px solid #F5E6D3',
    borderTopColor: '#D4A574',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: '#8B7355',
    fontSize: 14,
  },
  noMore: {
    textAlign: 'center',
    color: '#BFA882',
    fontSize: 14,
    padding: '24px 0',
  },
}
