import { useState, useEffect } from 'react'
import { fetchRecipe, fetchComments, addComment, rateRecipe } from '../api'
import type { Recipe, Comment } from '../types'

interface RecipePageProps {
  recipeId: string
  navigate: (path: string) => void
}

export default function RecipePage({ recipeId, navigate }: RecipePageProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [stepFading, setStepFading] = useState(false)
  const [preparedSet, setPreparedSet] = useState<Set<number>>(new Set())
  const [pulseIdx, setPulseIdx] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  const [shakeComment, setShakeComment] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  const [userRating, setUserRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchRecipe(recipeId).then(setRecipe).catch(console.error)
    fetchComments(recipeId).then(setComments).catch(console.error)
    setCurrentStep(0)
    setPreparedSet(new Set())
    setUserRating(0)
  }, [recipeId])

  const changeStep = (newStep: number) => {
    if (stepFading) return
    if (newStep === currentStep) return
    if (!recipe) return
    if (newStep < 0 || newStep >= recipe.steps.length) return
    setStepFading(true)
    setTimeout(() => {
      setCurrentStep(newStep)
      setStepFading(false)
    }, 250)
  }

  const togglePrepared = (idx: number) => {
    setPreparedSet(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
    setPulseIdx(idx)
    setTimeout(() => setPulseIdx(null), 400)
  }

  const handleRate = async (r: number) => {
    setUserRating(r)
    try {
      await rateRecipe(recipeId, r, 'u1')
      const updated = await fetchRecipe(recipeId)
      setRecipe(updated)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      setShakeComment(true)
      setTimeout(() => setShakeComment(false), 500)
      return
    }
    if (submitting) return
    setSubmitting(true)
    try {
      const newComment = await addComment(recipeId, {
        userId: 'u1',
        userName: '张妈妈',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangmama',
        content: commentText.trim(),
      })
      setComments(prev => [newComment, ...prev])
      setCommentText('')
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  if (!recipe) {
    return (
      <div className="recipe-page-loading">
        <div className="recipe-spinner" />
      </div>
    )
  }

  const step = recipe.steps[currentStep]

  return (
    <div className="recipe-page">
      <style>{recipeCSS}</style>
      <div className="recipe-detail-grid">
        <div className="recipe-main-col">
          <div className="recipe-breadcrumb">
            <span className="recipe-breadcrumb-link" onClick={() => navigate('/')}>首页</span>
            <span className="recipe-breadcrumb-sep"> / </span>
            <span>{recipe.title}</span>
          </div>
          <div className="recipe-image-section">
            <img src={recipe.image} alt={recipe.title} className="recipe-hero-image" />
            <div className="recipe-image-overlay">
              <h1 className="recipe-title">{recipe.title}</h1>
              <div className="recipe-title-meta">
                <img src={recipe.author.avatar} alt={recipe.author.name} className="recipe-author-avatar" />
                <span className="recipe-author-name">{recipe.author.name}</span>
                <span className="recipe-rating-badge">★ {recipe.rating}</span>
              </div>
              <div className="recipe-tag-row">
                {recipe.tags.map(tag => (
                  <span key={tag} className="recipe-tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="recipe-section">
            <h2 className="recipe-section-title">烹饪步骤</h2>
            <div className="recipe-step-progress">
              {recipe.steps.map((_, i) => (
                <div
                  key={i}
                  className={`recipe-progress-dot ${i <= currentStep ? 'recipe-progress-dot-active' : ''}`}
                  onClick={() => changeStep(i)}
                />
              ))}
            </div>
            <div className={`recipe-step-card ${stepFading ? 'recipe-step-fading' : ''}`}>
              <div className="recipe-step-number">{step.step}</div>
              <p className="recipe-step-content">{step.content}</p>
            </div>
            <div className="recipe-step-nav">
              <button
                className={`recipe-step-btn ${currentStep === 0 ? 'recipe-step-btn-disabled' : ''}`}
                onClick={() => changeStep(currentStep - 1)}
                disabled={currentStep === 0}
              >
                ← 上一步
              </button>
              <span className="recipe-step-indicator">{currentStep + 1} / {recipe.steps.length}</span>
              <button
                className={`recipe-step-btn ${currentStep === recipe.steps.length - 1 ? 'recipe-step-btn-disabled' : ''}`}
                onClick={() => changeStep(currentStep + 1)}
                disabled={currentStep === recipe.steps.length - 1}
              >
                下一步 →
              </button>
            </div>
          </div>
        </div>

        <div className="recipe-side-col">
          <div className="recipe-section">
            <h2 className="recipe-section-title">配料清单</h2>
            <div className="recipe-ingredient-list">
              {recipe.ingredients.map((ing, i) => (
                <div
                  key={i}
                  className="recipe-ingredient-item"
                  onClick={() => togglePrepared(i)}
                >
                  <span
                    className={`recipe-ingredient-dot ${preparedSet.has(i) ? 'recipe-ingredient-dot-prepared' : ''} ${pulseIdx === i ? 'recipe-ingredient-dot-pulse' : ''}`}
                  />
                  <span className={`recipe-ingredient-name ${preparedSet.has(i) ? 'recipe-ingredient-name-prepared' : ''}`}>
                    {ing.name}
                  </span>
                  <span className="recipe-ingredient-amount">{ing.amount}</span>
                  {ing.prepared && (
                    <span className="recipe-ingredient-prep">{ing.prepared}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="recipe-section">
            <h2 className="recipe-section-title">评分</h2>
            <div className="recipe-rating-row">
              {[1, 2, 3, 4, 5].map(r => (
                <span
                  key={r}
                  className="recipe-rate-star"
                  style={{ color: r <= (hoverRating || userRating) ? '#E74C3C' : '#DDD0C0' }}
                  onMouseEnter={() => setHoverRating(r)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRate(r)}
                >
                  ★
                </span>
              ))}
              {userRating > 0 && <span className="recipe-rating-text">你评了 {userRating} 分</span>}
            </div>
          </div>

          <div className="recipe-section">
            <h2 className="recipe-section-title">评论 ({comments.length})</h2>
            <div
              className={`recipe-comment-input-wrap ${shakeComment ? 'recipe-comment-shake' : ''}`}
            >
              <textarea
                className="recipe-comment-input"
                placeholder="写下你的评论..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <button
                className="recipe-comment-submit"
                onClick={handleSubmitComment}
                disabled={submitting}
              >
                {submitting ? '...' : '发送'}
              </button>
            </div>
            <div className="recipe-comment-list">
              {comments.map((c, i) => (
                <div
                  key={c.id}
                  className="recipe-comment-item"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <img src={c.userAvatar} alt={c.userName} className="recipe-comment-avatar" />
                  <div className="recipe-comment-body">
                    <div className="recipe-comment-header">
                      <span className="recipe-comment-name">{c.userName}</span>
                      <span className="recipe-comment-time">
                        {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <p className="recipe-comment-content">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const recipeCSS = `
  .recipe-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px 48px;
  }
  .recipe-page-loading {
    display: flex;
    justify-content: center;
    padding: 80px 0;
  }
  .recipe-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #F5E6D3;
    border-top-color: #D4A574;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .recipe-detail-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 32px;
  }
  @media (max-width: 1024px) {
    .recipe-detail-grid {
      grid-template-columns: 1fr;
      gap: 24px;
    }
  }
  @media (max-width: 768px) {
    .recipe-page { padding: 0 16px 32px; }
    .recipe-detail-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }

  .recipe-breadcrumb {
    font-size: 14px;
    color: #8B7355;
    margin-bottom: 16px;
    padding-top: 16px;
  }
  .recipe-breadcrumb-link {
    cursor: pointer;
    color: #D4A574;
  }
  .recipe-breadcrumb-sep { margin: 0 4px; }

  .recipe-image-section {
    position: relative;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 24px;
  }
  .recipe-hero-image {
    width: 100%;
    height: 320px;
    object-fit: cover;
    display: block;
  }
  @media (max-width: 768px) {
    .recipe-hero-image { height: 220px; }
  }
  .recipe-image-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 24px;
    background: linear-gradient(transparent, rgba(74, 55, 40, 0.85));
  }
  .recipe-title {
    font-size: 28px;
    font-weight: 700;
    color: #FFFFFF;
    margin-bottom: 8px;
    font-family: 'Noto Serif SC', serif;
  }
  @media (max-width: 768px) {
    .recipe-title { font-size: 22px; }
  }
  .recipe-title-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .recipe-author-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.5);
  }
  .recipe-author-name {
    font-size: 14px;
    color: rgba(255,255,255,0.9);
  }
  .recipe-rating-badge {
    font-size: 14px;
    color: #FFD700;
    margin-left: 8px;
  }
  .recipe-tag-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .recipe-tag {
    padding: 3px 12px;
    border-radius: 12px;
    background: rgba(107, 142, 35, 0.85);
    color: #FFF;
    font-size: 12px;
  }

  .recipe-section { margin-bottom: 28px; }
  .recipe-section-title {
    font-size: 20px;
    font-weight: 600;
    color: #4A3728;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #F5E6D3;
    font-family: 'Noto Serif SC', serif;
  }

  .recipe-step-progress {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }
  .recipe-progress-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #E8DDD0;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .recipe-progress-dot-active {
    background: #D4A574;
    transform: scale(1.2);
  }

  .recipe-step-card {
    padding: 20px 24px;
    background: #FFFFFF;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(74, 55, 40, 0.06);
    display: flex;
    align-items: flex-start;
    gap: 16px;
    transition: opacity 0.25s ease, transform 0.25s ease;
    opacity: 1;
    transform: translateY(0);
  }
  .recipe-step-fading {
    opacity: 0;
    transform: translateY(10px);
  }
  .recipe-step-number {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #D4A574;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 16px;
    flex-shrink: 0;
  }
  .recipe-step-content {
    font-size: 16px;
    line-height: 1.8;
    color: #4A3728;
    padding-top: 6px;
  }

  .recipe-step-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
  }
  .recipe-step-btn {
    padding: 8px 24px;
    border-radius: 20px;
    border: 1.5px solid #D4A574;
    background: transparent;
    color: #D4A574;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.25s ease;
    font-family: 'Noto Sans SC', sans-serif;
  }
  .recipe-step-btn:hover:not(:disabled) {
    background: #D4A574;
    color: #FFFFFF;
  }
  .recipe-step-btn-disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .recipe-step-indicator {
    font-size: 14px;
    color: #8B7355;
  }

  .recipe-ingredient-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .recipe-ingredient-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .recipe-ingredient-item:hover {
    background: rgba(212, 165, 116, 0.08);
  }
  .recipe-ingredient-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid #D4A574;
    background: transparent;
    flex-shrink: 0;
    transition: all 0.3s ease;
  }
  .recipe-ingredient-dot-prepared {
    background: #6B8E23;
    border-color: #6B8E23;
  }
  .recipe-ingredient-dot-pulse {
    animation: pulse 0.4s ease;
  }
  .recipe-ingredient-name {
    font-size: 14px;
    color: #4A3728;
    flex: 1;
    transition: all 0.3s ease;
  }
  .recipe-ingredient-name-prepared {
    text-decoration: line-through;
    color: #BFA882;
  }
  .recipe-ingredient-amount {
    font-size: 13px;
    color: #8B7355;
    min-width: 50px;
    text-align: right;
  }
  .recipe-ingredient-prep {
    font-size: 12px;
    color: #BFA882;
    font-style: italic;
    max-width: 120px;
  }
  @media (max-width: 768px) {
    .recipe-ingredient-prep { display: none; }
  }

  .recipe-rating-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .recipe-rate-star {
    font-size: 28px;
    cursor: pointer;
    transition: color 0.2s ease, transform 0.2s ease;
  }
  .recipe-rate-star:hover { transform: scale(1.1); }
  .recipe-rating-text {
    font-size: 14px;
    color: #8B7355;
    margin-left: 12px;
  }

  .recipe-comment-input-wrap {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  .recipe-comment-shake {
    animation: shake 0.4s ease;
  }
  .recipe-comment-input {
    flex: 1;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1.5px solid #E8DDD0;
    font-size: 14px;
    font-family: 'Noto Sans SC', sans-serif;
    resize: vertical;
    min-height: 60px;
    outline: none;
    transition: border-color 0.2s ease;
    background: #FFFFFF;
  }
  .recipe-comment-input:focus { border-color: #D4A574; }
  .recipe-comment-submit {
    padding: 10px 20px;
    border-radius: 10px;
    border: none;
    background: #D4A574;
    color: #FFFFFF;
    font-size: 14px;
    cursor: pointer;
    font-weight: 500;
    font-family: 'Noto Sans SC', sans-serif;
    transition: background 0.2s ease;
  }
  .recipe-comment-submit:hover:not(:disabled) { background: #C09060; }
  .recipe-comment-submit:disabled { opacity: 0.6; }

  .recipe-comment-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .recipe-comment-item {
    display: flex;
    gap: 10px;
    padding: 12px;
    border-radius: 10px;
    background: #FFFFFF;
    animation: commentFadeIn 0.4s ease both;
  }
  .recipe-comment-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .recipe-comment-body { flex: 1; }
  .recipe-comment-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  .recipe-comment-name {
    font-size: 14px;
    font-weight: 500;
    color: #4A3728;
  }
  .recipe-comment-time {
    font-size: 12px;
    color: #BFA882;
  }
  .recipe-comment-content {
    font-size: 14px;
    line-height: 1.6;
    color: #6B5744;
  }
`
