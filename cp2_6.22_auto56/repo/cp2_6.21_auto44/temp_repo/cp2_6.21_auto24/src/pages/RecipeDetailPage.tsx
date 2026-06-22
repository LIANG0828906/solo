import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { Recipe } from '../types'
import { useRecipeStore } from '../store/useRecipeStore'

const RecipeDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useRecipeStore()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    fetchRecipe()
  }, [id, user])

  const fetchRecipe = async () => {
    try {
      setLoading(true)
      const params: Record<string, number> = {}
      if (user?.id) params.user_id = user.id

      const response = await axios.get<Recipe>(`/api/recipes/${id}`, { params })
      setRecipe(response.data)
      setLiked(response.data.is_liked)
      setFavorited(response.data.is_favorited)
      setLikeCount(response.data.likes)
    } catch (error) {
      console.error('Failed to fetch recipe:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!user) {
      alert('请先登录')
      return
    }
    try {
      const response = await axios.post(`/api/recipes/${id}/like`, null, {
        params: { user_id: user.id },
      })
      setLiked(response.data.liked)
      setLikeCount(response.data.likes)
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const handleFavorite = async () => {
    if (!user) {
      alert('请先登录')
      return
    }
    try {
      const response = await axios.post(`/api/recipes/${id}/favorite`, null, {
        params: { user_id: user.id },
      })
      setFavorited(response.data.favorited)
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个食谱吗？')) return
    try {
      await axios.delete(`/api/recipes/${id}`)
      navigate('/')
    } catch (error) {
      console.error('Failed to delete recipe:', error)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            height: '400px',
            backgroundColor: '#f5f0e1',
            borderRadius: '16px',
            animation: 'pulse 1.5s ease-in-out infinite',
            marginBottom: '24px',
          }}
        />
        <div
          style={{
            height: '32px',
            backgroundColor: '#f5f0e1',
            borderRadius: '8px',
            width: '60%',
            marginBottom: '16px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            height: '16px',
            backgroundColor: '#f5f0e1',
            borderRadius: '4px',
            width: '40%',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', color: '#8d6e63' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>😕</div>
        <p>食谱不存在</p>
        <Link to="/" style={{ color: '#ff7043' }}>
          返回首页
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 20px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: '#8d6e63',
          fontSize: '14px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        ← 返回
      </button>

      <div
        style={{
          position: 'relative',
          height: '400px',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #ff9a56, #ff6b6b)',
        }}
      >
        {recipe.cover_image && (
          <img
            src={recipe.cover_image}
            alt={recipe.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '40px 24px 24px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            color: '#fff',
          }}
        >
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            {recipe.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                {recipe.author_name.charAt(0).toUpperCase()}
              </div>
              <span>{recipe.author_name}</span>
            </div>
            <span>⏱️ {recipe.cook_time}分钟</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        {recipe.tags.map((tag) => (
          <span
            key={tag}
            style={{
              padding: '6px 16px',
              backgroundColor: '#efebe9',
              color: '#5d4037',
              borderRadius: '20px',
              fontSize: '13px',
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
        }}
      >
        <button
          onClick={handleLike}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '24px',
            backgroundColor: liked ? '#ffebee' : '#f5f5f5',
            color: liked ? '#f44336' : '#666',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <span style={{ fontSize: '18px' }}>{liked ? '❤️' : '🤍'}</span>
          <span>{likeCount}</span>
        </button>

        <button
          onClick={handleFavorite}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '24px',
            backgroundColor: favorited ? '#fff8e1' : '#f5f5f5',
            color: favorited ? '#ff9800' : '#666',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <span style={{ fontSize: '18px' }}>{favorited ? '⭐' : '☆'}</span>
          <span>{favorited ? '已收藏' : '收藏'}</span>
        </button>

        {user && user.id === recipe.author_id && (
          <>
            <Link
              to={`/edit/${recipe.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '24px',
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              ✏️ 编辑
            </Link>
            <button
              onClick={handleDelete}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '24px',
                backgroundColor: '#ffebee',
                color: '#d32f2f',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              🗑️ 删除
            </button>
          </>
        )}
      </div>

      {recipe.description && (
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#3e2723',
              marginBottom: '12px',
            }}
          >
            简介
          </h2>
          <p style={{ color: '#5d4037', lineHeight: 1.8 }}>{recipe.description}</p>
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#3e2723',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          🥗 食材清单
        </h2>
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            {recipe.ingredients.map((ing, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: '#fafafa',
                  borderRadius: '8px',
                  borderLeft: '3px solid #ff7043',
                }}
              >
                <span style={{ color: '#3e2723', fontWeight: 500 }}>
                  {ing.name}
                </span>
                <span style={{ color: '#8d6e63' }}>{ing.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#3e2723',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          👨‍🍳 制作步骤
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {recipe.steps.map((step, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '16px',
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  flex: '0 0 36px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff7043, #f4511e)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                {index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#3e2723', lineHeight: 1.8 }}>
                  {step.description}
                </p>
                {step.image && (
                  <img
                    src={step.image}
                    alt={`步骤${index + 1}`}
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      maxWidth: '300px',
                      borderRadius: '8px',
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RecipeDetailPage
