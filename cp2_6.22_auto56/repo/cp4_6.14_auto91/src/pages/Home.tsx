import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import type { Recipe } from '../types'
import { recipeApi } from '../services/api'
import RecipeCard from '../components/RecipeCard'

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [hotRecipes, setHotRecipes] = useState<Recipe[]>([])
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([])
  const [publishedRecipes, setPublishedRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchIngredients, setSearchIngredients] = useState<string[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const page = useRef(1)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const columns = 3

  const loadInitial = useCallback(async () => {
    setLoading(true)
    const [res, hot, recent, published] = await Promise.all([
      recipeApi.getList(1, 9),
      recipeApi.getHot(),
      recipeApi.getRecent(),
      recipeApi.getPublished()
    ])
    setRecipes(res.data)
    setHasMore(res.hasMore ?? false)
    page.current = 1
    if (hot.code === 0) setHotRecipes(hot.data)
    if (recent.code === 0) setRecentRecipes(recent.data)
    if (published.code === 0) setPublishedRecipes(published.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  const handleSearch = () => {
    if (searchInput.trim()) {
      setSearchIngredients([searchInput.trim()])
    }
  }

  const addSearchIngredient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      e.preventDefault()
      const val = searchInput.trim()
      if (!searchIngredients.includes(val)) {
        setSearchIngredients(prev => [...prev, val])
      }
      setSearchInput('')
    }
  }

  const removeSearchIngredient = (ing: string) => {
    setSearchIngredients(prev => prev.filter(i => i !== ing))
  }

  useEffect(() => {
    if (searchIngredients.length === 0) {
      setIsSearching(false)
      loadInitial()
      return
    }
    const doSearch = async () => {
      setIsSearching(true)
      setLoading(true)
      const res = await recipeApi.searchByIngredients(searchIngredients)
      if (res.code === 0) {
        setRecipes(res.data)
        setHasMore(false)
      }
      setLoading(false)
    }
    const timer = setTimeout(doSearch, 200)
    return () => clearTimeout(timer)
  }, [searchIngredients, loadInitial])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || isSearching) return
    setLoadingMore(true)
    const next = page.current + 1
    const res = await recipeApi.getList(next, 9)
    if (res.code === 0) {
      setRecipes(prev => [...prev, ...res.data])
      setHasMore(res.hasMore ?? false)
      page.current = next
    }
    setLoadingMore(false)
  }, [loadingMore, hasMore, isSearching])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) loadMore()
      },
      { threshold: 0.1 }
    )
    if (sentinelRef.current) observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [loadMore])

  const columnsArr: Recipe[][] = Array.from({ length: columns }, () => [])
  recipes.forEach((r, i) => columnsArr[i % columns].push(r))

  return (
    <div className="route-transition" style={{ display: 'flex', gap: '24px', padding: '24px 0', minHeight: 'calc(100vh - 140px)' }}>
      <aside style={{
        width: '220px',
        flexShrink: 0,
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #fde68a',
        height: 'fit-content',
        position: 'sticky',
        top: '20px',
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f97316', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🔥</span>热门推荐
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ width: '100%', height: '60px', borderRadius: '8px' }} />
            ))
          ) : (
            hotRecipes.map((r, idx) => (
              <Link key={r.id} to={`/recipe/${r.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', gap: '10px', padding: '6px', borderRadius: '8px', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff7ed'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ position: 'relative' }}>
                  <img src={r.coverImage} alt={r.title} style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' }} />
                  {idx < 3 && (
                    <div style={{
                      position: 'absolute', top: '-4px', left: '-4px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      backgroundColor: idx === 0 ? '#f97316' : idx === 1 ? '#fb923c' : '#fdba74',
                      color: '#fff', fontSize: '10px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>{idx + 1}</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                  <p style={{ fontSize: '11px', color: '#f97316', marginTop: '4px' }}>❤ {r.likes}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          borderRadius: '20px',
          padding: '8px 16px',
          marginBottom: '20px',
          border: '1px solid #e2e8f0'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="输入已有食材，按回车添加，帮你找到合适菜谱..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={addSearchIngredient}
            onBlur={handleSearch}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              padding: '6px 10px',
              fontSize: '14px',
              color: '#334155'
            }}
          />
          {searchInput && (
            <button onClick={handleSearch} style={{
              backgroundColor: '#f97316', color: '#fff', border: 'none',
              padding: '6px 14px', borderRadius: '14px', cursor: 'pointer',
              fontSize: '13px', fontWeight: 500
            }}>搜索</button>
          )}
        </div>

        {searchIngredients.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {searchIngredients.map((ing, idx) => (
              <span
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  backgroundColor: '#e2e8f0',
                  color: '#1e293b',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  animation: 'slide-in-left 0.3s ease-out'
                }}
                onClick={() => removeSearchIngredient(ing)}
              >
                {ing}
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>×</span>
              </span>
            ))}
            <button
              onClick={() => setSearchIngredients([])}
              style={{
                background: 'none', border: 'none', color: '#f97316',
                cursor: 'pointer', fontSize: '13px', fontWeight: 500
              }}
            >
              清空全部
            </button>
          </div>
        )}

        {isSearching && !loading && recipes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍽️</div>
            <p>没有找到匹配的菜谱，试试其他食材？</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          {columnsArr.map((col, colIdx) => (
            <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ width: '280px', height: '340px', borderRadius: '12px' }} />
                ))
              ) : (
                col.map(r => <RecipeCard key={r.id} recipe={r} showMatchLevel={isSearching} />)
              )}
            </div>
          ))}
        </div>

        {loadingMore && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
          </div>
        )}

        <div ref={sentinelRef} style={{ height: '1px' }} />
      </main>

      <aside style={{
        width: '240px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #fde68a',
          position: 'sticky',
          top: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid #fef3c7' }}>
            <img src="https://i.pravatar.cc/100?img=12" alt="用户" style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid #f97316' }} />
            <div>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>美食达人</p>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>已发布 {publishedRecipes.length} 道菜谱</p>
            </div>
          </div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f97316', margin: '14px 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>👀</span>最近浏览
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '6px' }} />
              ))
            ) : (
              recentRecipes.map(r => (
                <Link key={r.id} to={`/recipe/${r.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit',
                  padding: '4px', borderRadius: '6px', transition: 'background 0.2s'
                }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff7ed'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <img src={r.coverImage} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                  <span style={{ fontSize: '12px', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                </Link>
              ))
            )}
          </div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f97316', margin: '14px 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📖</span>我的发布
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ width: '100%', height: '36px', borderRadius: '6px' }} />
              ))
            ) : (
              publishedRecipes.map(r => (
                <Link key={r.id} to={`/recipe/${r.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit',
                  padding: '4px', borderRadius: '6px', transition: 'background 0.2s'
                }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff7ed'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <img src={r.coverImage} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                  <span style={{ fontSize: '12px', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                </Link>
              ))
            )}
          </div>
          <Link to="/publish" style={{
            display: 'block',
            marginTop: '14px',
            textAlign: 'center',
            padding: '10px',
            backgroundColor: '#f97316',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'background 0.2s'
          }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ea580c'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f97316'}
          >
            + 发布新菜谱
          </Link>
        </div>
      </aside>
    </div>
  )
}
