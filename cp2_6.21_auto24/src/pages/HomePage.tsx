import { useEffect, useState } from 'react'
import { useRecipeStore } from '../store/useRecipeStore'
import RecipeCard from '../components/RecipeCard'
import { Recipe } from '../types'

const HomePage = () => {
  const { recipes, favorites, user, fetchRecipes, fetchFavorites } = useRecipeStore()
  const [loading, setLoading] = useState(true)
  const [showFavorites, setShowFavorites] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchRecipes()
      if (user) {
        await fetchFavorites()
      }
      setLoading(false)
    }
    loadData()
  }, [user])

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

          <div
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px',
            }}
          >
            {skeletonCards.map((i) => (
              <div
                key={i}
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
            ))}
          </div>
        ) : recipes.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px',
            }}
          >
            {recipes.map((recipe: Recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
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
      `}</style>
    </div>
  )
}

export default HomePage
