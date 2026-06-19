
import React, { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../App'
import { motion, AnimatePresence } from 'framer-motion'
import { io, Socket } from 'socket.io-client'
import SubstitutionPanel from '../components/SubstitutionPanel'

interface Ingredient {
  id: string
  name: string
  amount: string
}

interface Step {
  order: number
  description: string
}

interface Comment {
  id: string
  recipeId: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  timestamp: number
}

interface Recipe {
  id: string
  title: string
  authorId: string
  authorName: string
  authorAvatar: string
  coverColor: string
  tags: string[]
  ingredients: Ingredient[]
  steps: Step[]
  comments: Comment[]
  averageRating: number
  ratings: { userId: string; value: 1 | 2 | 3 | 4 | 5 }[]
}

interface RecipeDetailProps {
  recipeId: string | null
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipeId }) => {
  const { navigateToHome, toggleFavorite, favorites, currentUser } = useAppStore()

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [commentInput, setCommentInput] = useState<string>('')
  const [substitutionOpen, setSubstitutionOpen] = useState<boolean>(false)
  const [selectedIngredient, setSelectedIngredient] = useState<string>('')
  const [highlightedIngredients, setHighlightedIngredients] = useState<Set<string>>(new Set())
  const [userRating, setUserRating] = useState<number>(0)
  const [ratingCount, setRatingCount] = useState<number>(0)

  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!recipeId) {
      setLoading(false)
      return
    }

    setLoading(true)
    fetch(`/api/recipes/${recipeId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.code === 0) {
          const data: Recipe = res.data
          setRecipe({
            ...data,
            ingredients: data.ingredients.map((i) => ({ ...i })),
          })
          const myRating = data.ratings.find((r) => r.userId === currentUser.id)
          setUserRating(myRating ? myRating.value : 0)
          setRatingCount(data.ratings.length)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))

    const socket = io({ path: '/socket.io' })
    socketRef.current = socket

    socket.on('comment:new', (payload: { recipeId: string; comment: Comment }) => {
      if (payload.recipeId === recipeId) {
        setRecipe((prev) => {
          if (!prev) return prev
          return { ...prev, comments: [...prev.comments, payload.comment] }
        })
      }
    })

    socket.on('comment:delete', (payload: { recipeId: string; commentId: string }) => {
      if (payload.recipeId === recipeId) {
        setRecipe((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            comments: prev.comments.filter((c) => c.id !== payload.commentId),
          }
        })
      }
    })

    socket.on(
      'rating:update',
      (payload: { recipeId: string; averageRating: number; ratingCount: number }) => {
        if (payload.recipeId === recipeId) {
          setRecipe((prev) => {
            if (!prev) return prev
            return { ...prev, averageRating: payload.averageRating }
          })
          setRatingCount(payload.ratingCount)
        }
      }
    )

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [recipeId, currentUser.id])

  const addHighlight = (ingredientId: string) => {
    setHighlightedIngredients((prev) => {
      const next = new Set(prev)
      next.add(ingredientId)
      return next
    })
    setTimeout(() => {
      setHighlightedIngredients((prev) => {
        const next = new Set(prev)
        next.delete(ingredientId)
        return next
      })
    }, 3000)
  }

  const handleRating = (star: 1 | 2 | 3 | 4 | 5) => {
    if (!recipe || !socketRef.current) return
    setUserRating(star)
    socketRef.current.emit('recipe:rating', {
      recipeId: recipe.id,
      userId: currentUser.id,
      value: star,
    })
  }

  const handleSubmitComment = () => {
    const content = commentInput.trim()
    if (!content || !recipe || !socketRef.current) return
    socketRef.current.emit('recipe:comment', {
      recipeId: recipe.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content,
    })
    setCommentInput('')
  }

  const handleDeleteComment = (commentId: string) => {
    if (!recipe || !socketRef.current) return
    if (!window.confirm('确定删除这条评论吗？')) return
    socketRef.current.emit('recipe:deleteComment', {
      recipeId: recipe.id,
      commentId,
      userId: currentUser.id,
    })
  }

  const handleOpenSubstitution = (ingredientName: string) => {
    setSelectedIngredient(ingredientName)
    setSubstitutionOpen(true)
  }

  const handleSubstitution = (originalName: string, replacement: string) => {
    if (!recipe) return
    setRecipe((prev) => {
      if (!prev) return prev
      const newIngredients = prev.ingredients.map((i) => {
        if (i.name === originalName) {
          addHighlight(i.id)
          return { ...i, name: replacement }
        }
        return i
      })
      return { ...prev, ingredients: newIngredients }
    })
  }

  const formatTime = (ts: number): string => {
    const diff = Date.now() - ts
    const sec = Math.floor(diff / 1000)
    if (sec < 60) return '刚刚'
    const min = Math.floor(sec / 60)
    if (min < 60) return `${min}分钟前`
    const hour = Math.floor(min / 60)
    if (hour < 24) return `${hour}小时前`
    const day = Math.floor(hour / 24)
    if (day < 30) return `${day}天前`
    const mon = Math.floor(day / 30)
    if (mon < 12) return `${mon}个月前`
    const year = Math.floor(mon / 12)
    return `${year}年前`
  }

  const isFavorited = recipeId ? favorites.includes(recipeId) : false

  const tagColors: Record<string, string> = {
    家常菜: '#FF8A65',
    烘焙: '#AB47BC',
    甜品: '#FFD54F',
    汤羹: '#4DB6AC',
    快手菜: '#7986CB',
  }

  const ratingToShow = hoverRating > 0 ? hoverRating : userRating

  return (
    <>
      <style>{`
        .detail-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #E65100;
          font-size: 14px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 4px 0;
          margin-bottom: 16px;
          transition: opacity 0.2s;
        }
        .detail-back-btn:hover {
          text-decoration: underline;
        }
        .detail-cover {
          width: 100%;
          height: 220px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          margin-bottom: 24px;
          overflow: hidden;
        }
        .detail-cover::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 100%);
        }
        .detail-title {
          color: white;
          font-size: 32px;
          font-weight: bold;
          text-shadow: 0 2px 8px rgba(0,0,0,0.2);
          z-index: 1;
          text-align: center;
          padding: 0 24px;
        }
        .detail-author {
          color: white;
          font-size: 14px;
          margin-top: 8px;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 6px;
          text-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .detail-fav-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.9);
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .detail-layout {
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }
        .detail-left {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .detail-right {
          width: 320px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex-shrink: 0;
        }
        .detail-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .detail-card-title {
          font-size: 18px;
          font-weight: bold;
          color: #E65100;
          margin-bottom: 16px;
        }
        .ingredient-item {
          display: flex;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #F5F5F5;
          gap: 12px;
        }
        .ingredient-item:last-child {
          border-bottom: none;
        }
        .ingredient-name {
          flex: 1;
          font-size: 15px;
          color: #333;
          transition: color 0.3s, font-weight 0.3s;
        }
        .ingredient-name.highlighted {
          color: #4CAF50;
          font-weight: 600;
        }
        .ingredient-amount {
          color: #999;
          font-size: 14px;
        }
        .ingredient-sub-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          transition: transform 0.3s ease;
        }
        .ingredient-sub-btn:hover {
          transform: rotate(180deg);
        }
        .step-item {
          display: flex;
          gap: 14px;
          padding: 12px 0;
        }
        .step-order {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #E65100;
          color: white;
          font-weight: bold;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .step-desc {
          flex: 1;
          font-size: 15px;
          line-height: 1.7;
          color: #444;
          padding-top: 4px;
        }
        .stars-row {
          display: flex;
          gap: 6px;
          margin-bottom: 12px;
        }
        .star {
          font-size: 28px;
          cursor: pointer;
          transition: transform 0.2s, color 0.2s;
          user-select: none;
          line-height: 1;
        }
        .star:hover {
          transform: scale(1.15);
        }
        .star.grey {
          color: #CCC;
        }
        .star.orange {
          color: #FF9800;
        }
        .avg-rating {
          font-size: 14px;
          color: #666;
        }
        .comment-input-box {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        .comment-textarea {
          flex: 1;
          border: 1px solid #E0E0E0;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          resize: none;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s;
          min-height: 72px;
        }
        .comment-textarea:focus {
          border-color: #E65100;
        }
        .comment-send-btn {
          background: #E65100;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0 20px;
          font-size: 14px;
          cursor: pointer;
          font-weight: 500;
          align-self: flex-end;
          height: 40px;
          transition: background 0.2s, transform 0.2s;
        }
        .comment-send-btn:hover {
          background: #BF360C;
        }
        .comment-send-btn:active {
          transform: scale(0.96);
        }
        .comment-send-btn:disabled {
          background: #CCC;
          cursor: not-allowed;
        }
        .comment-item {
          padding: 14px 0;
          border-bottom: 1px solid #F5F5F5;
        }
        .comment-item:last-child {
          border-bottom: none;
        }
        .comment-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .comment-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #FFF3E0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .comment-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }
        .comment-time {
          margin-left: auto;
          font-size: 12px;
          color: #999;
        }
        .comment-content {
          font-size: 14px;
          color: #555;
          line-height: 1.6;
          padding-left: 40px;
        }
        .comment-delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          padding: 2px 6px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .comment-delete-btn:hover {
          background: #FFEBEE;
        }
        .no-comments {
          text-align: center;
          padding: 24px;
          color: #999;
          font-size: 14px;
        }
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .tag-chip {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          color: white;
        }
        .tips-card {
          background: #FFF8E1;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #FFE082;
        }
        .tips-title {
          font-weight: 600;
          color: #F57F17;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .tips-text {
          font-size: 13px;
          color: #6D4C41;
          line-height: 1.7;
        }
        .empty-state {
          text-align: center;
          padding: 80px 24px;
          color: #999;
          font-size: 16px;
        }
        .skeleton-cover {
          height: 220px;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        .skeleton-card {
          height: 200px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .skeleton-card-sm {
          height: 140px;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .detail-layout {
            flex-direction: column;
          }
          .detail-right {
            width: 100%;
            order: 2;
          }
          .detail-left {
            order: 1;
          }
          .detail-title {
            font-size: 24px;
          }
          .detail-cover {
            height: 180px;
          }
        }
      `}</style>

      {!recipeId ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
          未找到食谱
        </div>
      ) : (
        <>
          <button className="detail-back-btn" onClick={navigateToHome}>
            ← 返回食谱列表
          </button>

          {loading ? (
            <div>
              <div className="skeleton skeleton-cover"></div>
              <div className="skeleton skeleton-card"></div>
              <div className="skeleton skeleton-card"></div>
              <div className="skeleton skeleton-card-sm"></div>
            </div>
          ) : recipe ? (
            <>
              <div className="detail-cover" style={{ backgroundColor: recipe.coverColor }}>
                <motion.button
                  className="detail-fav-btn"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleFavorite(recipe.id)}
                  aria-label="收藏"
                >
                  {isFavorited ? '❤️' : '🤍'}
                </motion.button>
                <h1 className="detail-title">{recipe.title}</h1>
                <div className="detail-author">
                  <span>{recipe.authorAvatar}</span>
                  <span>by {recipe.authorName}</span>
                </div>
              </div>

              <div className="detail-layout">
                <div className="detail-left">
                  <div className="detail-card">
                    <h2 className="detail-card-title">📋 用料</h2>
                    {recipe.ingredients.map((ing) => (
                      <div key={ing.id} className="ingredient-item">
                        <span
                          className={`ingredient-name ${
                            highlightedIngredients.has(ing.id) ? 'highlighted' : ''
                          }`}
                        >
                          {ing.name}
                        </span>
                        <span className="ingredient-amount">{ing.amount}</span>
                        <button
                          className="ingredient-sub-btn"
                          onClick={() => handleOpenSubstitution(ing.name)}
                          title="替换食材"
                        >
                          🔁
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="detail-card">
                    <h2 className="detail-card-title">👨‍🍳 烹饪步骤</h2>
                    {recipe.steps.map((step) => (
                      <div key={step.order} className="step-item">
                        <div className="step-order">{step.order}</div>
                        <div className="step-desc">{step.description}</div>
                      </div>
                    ))}
                  </div>

                  <div className="detail-card">
                    <h2 className="detail-card-title">⭐ 我的评分</h2>
                    <div className="stars-row">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className={`star ${n <= ratingToShow ? 'orange' : 'grey'}`}
                          onClick={() => handleRating(n as 1 | 2 | 3 | 4 | 5)}
                          onMouseEnter={() => setHoverRating(n)}
                          onMouseLeave={() => setHoverRating(0)}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div className="avg-rating">
                      当前均分: {recipe.averageRating.toFixed(1)} / 5 ({ratingCount}人评)
                    </div>
                  </div>

                  <div className="detail-card">
                    <h2 className="detail-card-title">
                      💬 评论 ({recipe.comments.length})
                    </h2>
                    <div className="comment-input-box">
                      <textarea
                        className="comment-textarea"
                        placeholder="分享你的烹饪心得..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            handleSubmitComment()
                          }
                        }}
                      />
                      <button
                        className="comment-send-btn"
                        onClick={handleSubmitComment}
                        disabled={!commentInput.trim()}
                      >
                        发送
                      </button>
                    </div>

                    {recipe.comments.length === 0 ? (
                      <div className="no-comments">
                        还没有评论，快来抢沙发吧~
                      </div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {recipe.comments.map((c) => (
                          <motion.div
                            key={c.id}
                            className="comment-item"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                          >
                            <div className="comment-header">
                              <div className="comment-avatar">{c.userAvatar}</div>
                              <span className="comment-name">{c.userName}</span>
                              <span className="comment-time">{formatTime(c.timestamp)}</span>
                              {c.userId === currentUser.id && (
                                <button
                                  className="comment-delete-btn"
                                  onClick={() => handleDeleteComment(c.id)}
                                  title="删除评论"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                            <div className="comment-content">{c.content}</div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </div>

                <div className="detail-right">
                  <div className="detail-card">
                    <h2 className="detail-card-title">🏷️ 标签</h2>
                    <div className="tags-list">
                      {recipe.tags.map((tag) => (
                        <span
                          key={tag}
                          className="tag-chip"
                          style={{ backgroundColor: tagColors[tag] || '#90A4AE' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="tips-card">
                    <div className="tips-title">💡 小提示</div>
                    <div className="tips-text">
                      点击食材旁的 🔁 按钮可以替换食材哦！<br />
                      替换后会高亮显示，3秒后恢复。<br />
                      别忘了给食谱打个分~
                    </div>
                  </div>

                  <div className="detail-card">
                    <h2 className="detail-card-title">📊 食谱信息</h2>
                    <div style={{ fontSize: 14, color: '#555', lineHeight: 2 }}>
                      <div>食材数量: {recipe.ingredients.length} 种</div>
                      <div>烹饪步骤: {recipe.steps.length} 步</div>
                      <div>作者: {recipe.authorName}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
              加载失败或食谱不存在
            </div>
          )}

          <SubstitutionPanel
            isOpen={substitutionOpen}
            ingredientName={selectedIngredient}
            currentIngredients={recipe?.ingredients || []}
            onSelect={handleSubstitution}
            onClose={() => setSubstitutionOpen(false)}
          />
        </>
      )}
    </>
  )
}

export default RecipeDetail
