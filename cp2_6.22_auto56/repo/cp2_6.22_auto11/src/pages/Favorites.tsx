import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import RecipeCard, { Recipe } from '@/RecipeCard'
import { useAuthStore, apiRequest } from '@/store/authStore'
import './Favorites.css'

export default function Favorites() {
  const { isAuthenticated } = useAuthStore()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites()
    }
  }, [isAuthenticated])

  const loadFavorites = async () => {
    setLoading(true)
    try {
      const response = await apiRequest('/api/favorites')
      if (response.ok) {
        const data = await response.json()
        setRecipes(data.recipes || [])
      }
    } catch (err) {
      console.error('加载收藏失败:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="favorites-page">
        <div className="empty-favorites">
          <div className="empty-icon">❤️</div>
          <h2>登录查看收藏</h2>
          <p>登录后即可查看你收藏的美食食谱</p>
          <Link to="/login" className="login-btn">
            去登录
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <h1 className="page-title">我的收藏</h1>
        <p className="page-subtitle">收藏你喜欢的食谱，随时查看</p>
      </div>

      <div className="favorites-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <span>加载中...</span>
          </div>
        ) : recipes.length > 0 ? (
          <>
            <p className="favorites-count">
              共收藏 <strong>{recipes.length}</strong> 个食谱
            </p>
            <div className="masonry-grid">
              {recipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  style={{ animationDelay: `${index * 0.05}s` }}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="empty-favorites">
            <div className="empty-icon">📭</div>
            <h2>还没有收藏</h2>
            <p>去发现美味的食谱并收藏它们吧</p>
            <Link to="/" className="explore-btn">
              浏览食谱
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
