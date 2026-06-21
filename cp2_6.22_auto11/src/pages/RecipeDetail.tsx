import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import RecipeCard, { Recipe } from '@/RecipeCard'
import { useAuthStore, apiRequest } from '@/store/authStore'
import './RecipeDetail.css'

interface Comment {
  id: number
  recipeId: number
  userId: number
  username: string
  avatar?: string
  content: string
  rating: number
  createdAt: string
}

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [newRating, setNewRating] = useState(5)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      loadRecipeData()
    }
  }, [id])

  const loadRecipeData = async () => {
    setLoading(true)
    try {
      const [recipeRes, commentsRes, relatedRes] = await Promise.all([
        apiRequest(`/api/recipes/${id}`),
        apiRequest(`/api/recipes/${id}/comments`),
        apiRequest(`/api/recipes/${id}/related?limit=6`),
      ])

      const recipeData = await recipeRes.json()
      const commentsData = await commentsRes.json()
      const relatedData = await relatedRes.json()

      setRecipe(recipeData)
      setComments(commentsData.comments || [])
      setRelatedRecipes(relatedData.recipes || [])

      if (isAuthenticated) {
        const favRes = await apiRequest(`/api/favorites/${id}/check`)
        if (favRes.ok) {
          const favData = await favRes.json()
          setIsFavorited(favData.favorited)
        }
      }
    } catch (err) {
      console.error('加载食谱详情失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      if (isFavorited) {
        await apiRequest(`/api/favorites/${id}`, { method: 'DELETE' })
        setIsFavorited(false)
      } else {
        await apiRequest(`/api/favorites/${id}`, { method: 'POST' })
        setIsFavorited(true)
      }
    } catch (err) {
      console.error('收藏操作失败:', err)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const response = await apiRequest(`/api/recipes/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          content: newComment,
          rating: newRating,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments([data.comment, ...comments])
        setNewComment('')
        setNewRating(5)
      }
    } catch (err) {
      console.error('发表评论失败:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => {
    const stars = []

    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating
      stars.push(
        <span
          key={i}
          className={`star ${filled ? 'star-full' : 'star-empty'} ${interactive ? 'interactive' : ''}`}
          onClick={() => interactive && onChange && onChange(i)}
          onMouseEnter={() => interactive && onChange && onChange(i)}
        >
          ★
        </span>
      )
    }

    return <div className="stars">{stars}</div>
  }

  if (loading) {
    return (
      <div className="recipe-detail-page loading-page">
        <div className="detail-skeleton">
          <div className="skeleton skeleton-hero" />
          <div className="skeleton-content-wrapper">
            <div className="skeleton skeleton-title-lg" />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text" />
          </div>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="recipe-detail-page">
        <div className="not-found">
          <p>食谱不存在</p>
          <Link to="/" className="back-link">返回首页</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="recipe-detail-page">
      <div className="recipe-hero">
        <img src={recipe.image} alt={recipe.title} className="hero-image" />
        <div className="hero-overlay">
          <div className="hero-content-wrapper">
            <h1 className="recipe-title-lg">{recipe.title}</h1>
            <p className="recipe-desc">{recipe.description}</p>
            <div className="recipe-meta">
              <div className="author-info">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(recipe.authorName)}`}
                  alt={recipe.authorName}
                  className="author-avatar-lg"
                />
                <span className="author-name-lg">{recipe.authorName}</span>
              </div>
              <div className="rating-info">
                {renderStars(recipe.rating)}
                <span className="rating-text">
                  {recipe.rating} ({recipe.ratingCount} 评分)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-main">
          <div className="action-bar">
            <button
              className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
              onClick={handleToggleFavorite}
            >
              <span className="heart-icon">{isFavorited ? '❤️' : '🤍'}</span>
              <span>{isFavorited ? '已收藏' : '收藏'}</span>
            </button>
            <div className="action-tags">
              {recipe.tags.map((tag) => (
                <span key={tag} className="detail-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="ingredients-section">
            <h2 className="section-title">
              <span className="title-icon">🥗</span>
              食材清单
            </h2>
            <div className="ingredients-grid">
              {recipe.ingredients.map((ing, index) => (
                <div key={index} className="ingredient-item">
                  <span className="ingredient-dot" />
                  <span className="ingredient-name">{ing.name}</span>
                  <span className="ingredient-amount">{ing.amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="steps-section">
            <h2 className="section-title">
              <span className="title-icon">📝</span>
              制作步骤
            </h2>
            <div className="steps-list">
              {recipe.steps.map((step) => (
                <div key={step.order} className="step-item">
                  <div className="step-number">{step.order}</div>
                  <div className="step-content">
                    <p>{step.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="comments-section">
            <h2 className="section-title">
              <span className="title-icon">💬</span>
              用户评价 ({comments.length})
            </h2>

            {isAuthenticated && (
              <form className="comment-form" onSubmit={handleSubmitComment}>
                <div className="comment-header">
                  <img
                    src={user?.avatar}
                    alt={user?.username}
                    className="comment-avatar"
                  />
                  <div className="rating-input">
                    <span className="rating-label">评分：</span>
                    {renderStars(newRating, true, setNewRating)}
                  </div>
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="分享你的烹饪心得..."
                  className="comment-input"
                  rows={3}
                />
                <div className="comment-actions">
                  <button
                    type="submit"
                    className="submit-comment-btn"
                    disabled={submitting || !newComment.trim()}
                  >
                    {submitting ? '发布中...' : '发表评价'}
                  </button>
                </div>
              </form>
            )}

            {!isAuthenticated && (
              <div className="login-prompt">
                <p>登录后可以发表评价哦~</p>
                <Link to="/login" className="login-link">
                  去登录
                </Link>
              </div>
            )}

            <div className="comments-list">
              {comments.length === 0 ? (
                <div className="no-comments">暂无评价，来抢沙发吧~</div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(comment.username)}`}
                      alt={comment.username}
                      className="comment-avatar"
                    />
                    <div className="comment-body">
                      <div className="comment-meta">
                        <span className="comment-author">{comment.username}</span>
                        {comment.rating > 0 && renderStars(comment.rating)}
                        <span className="comment-time">
                          {new Date(comment.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <p className="comment-text">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="related-section">
            <h3 className="sidebar-title">相关推荐</h3>
            <div className="related-recipes">
              {relatedRecipes.slice(0, 4).map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
