import { useEffect, useState, useCallback, useRef } from 'react'
import { useRecipeStore } from '../store/useRecipeStore'
import RecipeCard from '../components/RecipeCard'
import { Recipe } from '../types'
import axios from 'axios'

const HomePage = () => {
  const { recipes, favorites, user, setRecipes, fetchFavorites } = useRecipeStore()
  const { searchKeyword, filters } = useRecipeStore()
  const [loading, setLoading] = useState(true)
  const [showFavorites, setShowFavorites] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const searchRecipes = useCallback(async (keyword: string) => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = {}
      if (keyword) params.q = keyword
      if (filters.tag) params.tag = filters.tag
      if (filters.cook_time) params.cook_time = filters.cook_time
      if (filters.author) params.author = filters.author
      if (user?.id) params.user_id = user.id

      const response = await axios.get<Recipe[]>('/api/recipes/search', { params })
      setRecipes(response.data)
    } catch (error) {
      console.error('Failed to search recipes:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, user, setRecipes])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      if (searchKeyword || filters.tag || filters.cook_time || filters.author) {
        await searchRecipes(searchKeyword)
      } else {
        try {
          const params: Record<string, number> = {}
          if (user?.id) params.user_id = user.id
          const response = await axios.get<Recipe[]>('/api/recipes', { params })
          setRecipes(response.data)
        } catch (error) {
          console.error('Failed to fetch recipes:', error)
        } finally {
          setLoading(false)
        }
      }
      if (user) {
        await fetchFavorites()
      }
      setLoading(false)
    }
    loadData()
  }, [user, searchKeyword, filters.tag, filters.cook_time, filters.author, searchRecipes, setRecipes, fetchFavorites])

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    const timer = setTimeout(() => {
      if (searchKeyword || filters.tag || filters.cook_time) {
        searchRecipes(searchKeyword)
      }
    }, 300)
    setSearchTimeout(timer)
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [searchKeyword, filters.tag, filters.cook_time, filters.author])

  const skeletonCards = Array.from({ length: 8 }, (_, i) => i)

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div
        style={{
          marginBottom: '32px',
        }}
      >
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#3e2723',
            marginBottom: '8px',
          }}
        >
          发现美食
        </h1>
        <p style={{ color: '#8d6e63', fontSize: '16px' }}>
          探索来自世界各地的精选食谱
        </p>
      </div>

      {user && favorites.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#3e2723',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              ⭐ 我的收藏
            </h2>
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              style={{
                background: 'none',
                border: 'none',
                color: '#8d6e63',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {showFavorites ? '收起' : '查看全部 →'}
            </button>
          </div>

          <div className="favorites-scroll"
            style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollBehavior: 'smooth',
            }}
          >
            {(showFavorites ? favorites : favorites.slice(0, 5)).map((recipe) => (
              <div
                key={recipe.id}
                style={{
                  flex: '0 0 240px',
                  minWidth: '240px',
                }}
              >
                <RecipeCard recipe={recipe} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#3e2723',
            marginBottom: '16px',
          }}
        >
          🔥 热门食谱
        </h2>

        {loading ? (
          <div className="masonry-grid">
            {skeletonCards.map((i) => (
              <div
                key={i}
                className="masonry-item"
              >
                <div
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                >
                  <div
                    style={{
                      height: '180px',
                      backgroundColor: '#f5f0e1',
                    }}
                  />
                  <div style={{ padding: '16px' }}>
                    <div
                      style={{
                        height: '16px',
                        backgroundColor: '#f5f0e1',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        width: '70%',
                      }}
                    />
                    <div
                      style={{
                        height: '12px',
                        backgroundColor: '#f5f0e1',
                        borderRadius: '4px',
                        width: '40%',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : recipes.length > 0 ? (
          <div className="masonry-grid">
            {recipes.map((recipe: Recipe) => (
              <div key={recipe.id} className="masonry-item">
                <RecipeCard recipe={recipe} />
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: '#8d6e63',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🍽️</div>
            <p style={{ fontSize: '18px' }}>暂无食谱</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>
              试试调整搜索条件或发布第一个食谱吧！
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .masonry-grid {
          column-count: 4;
          column-gap: 20px;
        }

        @media (max-width: 1100px) {
          .masonry-grid {
            column-count: 3;
          }
        }

        @media (max-width: 768px) {
          .masonry-grid {
            column-count: 2;
          }
        }

        @media (max-width: 480px) {
          .masonry-grid {
            column-count: 1;
          }
        }

        .masonry-item {
          break-inside: avoid;
          margin-bottom: 20px;
        }

        .favorites-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding-bottom: 8px;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        .favorites-scroll::-webkit-scrollbar {
          height: 6px;
        }

        .favorites-scroll::-webkit-scrollbar-track {
          background: #f5f0e1;
          border-radius: 3px;
        }

        .favorites-scroll::-webkit-scrollbar-thumb {
          background: #d7ccc8;
          border-radius: 3px;
        }

        .favorites-scroll::-webkit-scrollbar-thumb:hover {
          background: #8d6e63;
        }
      `}</style>
    </div>
  )
}

export default HomePage
