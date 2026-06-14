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
  const [stepTransition, setStepTransition] = useState(false)
  const [preparedSet, setPreparedSet] = useState<Set<number>>(new Set())
  const [pulseIdx, setPulseIdx] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  const [shakeComment, setShakeComment] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  const [userRating, setUserRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [commentAnimating, setCommentAnimating] = useState(false)

  useEffect(() => {
    fetchRecipe(recipeId).then(setRecipe).catch(console.error)
    fetchComments(recipeId).then(setComments).catch(console.error)
    setCurrentStep(0)
    setPreparedSet(new Set())
    setUserRating(0)
  }, [recipeId])

  const goToStep = (dir: 'next' | 'prev') => {
    if (!recipe) return
    setStepTransition(true)
    setTimeout(() => {
      setCurrentStep(prev => {
        if (dir === 'next') return Math.min(prev + 1, recipe.steps.length - 1)
        return Math.max(prev - 1, 0)
      })
      setStepTransition(false)
    }, 200)
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
      setCommentAnimating(true)
      setTimeout(() => setCommentAnimating(false), 500)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  if (!recipe) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
      </div>
    )
  }

  const step = recipe.steps[currentStep]

  return (
    <div style={styles.container}>
      <style>{recipeCSS}</style>
      <div className="recipe-detail-grid" style={styles.detailGrid}>
        <div style={styles.mainCol}>
          <div style={styles.breadcrumb}>
            <span style={styles.breadcrumbLink} onClick={() => navigate('/')}>首页</span>
            <span style={styles.breadcrumbSep}>/</span>
            <span>{recipe.title}</span>
          </div>
          <div style={styles.imageSection}>
            <img src={recipe.image} alt={recipe.title} style={styles.heroImage} />
            <div style={styles.imageOverlay}>
              <h1 style={styles.recipeTitle}>{recipe.title}</h1>
              <div style={styles.titleMeta}>
                <img src={recipe.author.avatar} alt={recipe.author.name} style={styles.authorAvatar} />
                <span style={styles.authorName}>{recipe.author.name}</span>
                <span style={styles.ratingBadge}>
                  <span style={styles.starIcon}>★</span> {recipe.rating}
                </span>
              </div>
              <div style={styles.tagRow}>
                {recipe.tags.map(tag => (
                  <span key={tag} style={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>烹饪步骤</h2>
            <div style={styles.stepProgress}>
              {recipe.steps.map((_, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.progressDot,
                    ...(i <= currentStep ? styles.progressDotActive : {}),
                  }}
                  onClick={() => { setStepTransition(true); setTimeout(() => { setCurrentStep(i); setStepTransition(false) }, 200) }}
                />
              ))}
            </div>
            <div
              style={{
                ...styles.stepCard,
                opacity: stepTransition ? 0 : 1,
                transform: stepTransition ? 'translateY(10px)' : 'translateY(0)',
              }}
            >
              <div style={styles.stepNumber}>{step.step}</div>
              <p style={styles.stepContent}>{step.content}</p>
            </div>
            <div style={styles.stepNav}>
              <button
                style={{ ...styles.stepBtn, ...(currentStep === 0 ? styles.stepBtnDisabled : {}) }}
                onClick={() => goToStep('prev')}
                disabled={currentStep === 0}
              >
                ← 上一步
              </button>
              <span style={styles.stepIndicator}>{currentStep + 1} / {recipe.steps.length}</span>
              <button
                style={{ ...styles.stepBtn, ...(currentStep === recipe.steps.length - 1 ? styles.stepBtnDisabled : {}) }}
                onClick={() => goToStep('next')}
                disabled={currentStep === recipe.steps.length - 1}
              >
                下一步 →
              </button>
            </div>
          </div>
        </div>

        <div style={styles.sideCol}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>配料清单</h2>
            <div style={styles.ingredientList}>
              {recipe.ingredients.map((ing, i) => (
                <div
                  key={i}
                  style={styles.ingredientItem}
                  onClick={() => togglePrepared(i)}
                  className="ingredient-item"
                >
                  <span
                    style={{
                      ...styles.ingredientDot,
                      ...(preparedSet.has(i) ? styles.ingredientDotPrepared : {}),
                      ...(pulseIdx === i ? styles.ingredientDotPulse : {}),
                    }}
                  />
                  <span style={{
                    ...styles.ingredientName,
                    ...(preparedSet.has(i) ? styles.ingredientNamePrepared : {}),
                  }}>
                    {ing.name}
                  </span>
                  <span style={styles.ingredientAmount}>{ing.amount}</span>
                  {ing.prepared && (
                    <span style={styles.ingredientPrep}>{ing.prepared}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>评分</h2>
            <div style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map(r => (
                <span
                  key={r}
                  style={{
                    ...styles.rateStar,
                    color: r <= (hoverRating || userRating) ? '#E74C3C' : '#DDD0C0',
                  }}
                  onMouseEnter={() => setHoverRating(r)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => handleRate(r)}
                >
                  ★
                </span>
              ))}
              {userRating > 0 && <span style={styles.ratingText}>你评了 {userRating} 分</span>}
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>评论 ({comments.length})</h2>
            <div
              style={{
                ...styles.commentInputWrap,
                animation: shakeComment ? 'shake 0.4s ease' : 'none',
              }}
            >
              <textarea
                style={styles.commentInput}
                placeholder="写下你的评论..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <button
                style={styles.commentSubmit}
                onClick={handleSubmitComment}
                disabled={submitting}
              >
                {submitting ? '...' : '发送'}
              </button>
            </div>
            <div style={styles.commentList}>
              {comments.map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    ...styles.commentItem,
                    animation: (commentAnimating && i === 0) ? 'commentFadeIn 0.4s ease' : 'commentFadeIn 0.4s ease',
                    animationDelay: `${i * 0.05}s`,
                    animationFillMode: 'both',
                  }}
                >
                  <img src={c.userAvatar} alt={c.userName} style={styles.commentAvatar} />
                  <div style={styles.commentBody}>
                    <div style={styles.commentHeader}>
                      <span style={styles.commentName}>{c.userName}</span>
                      <span style={styles.commentTime}>
                        {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <p style={styles.commentContent}>{c.content}</p>
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
    .recipe-detail-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
  .ingredient-item {
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .ingredient-item:hover {
    background: rgba(212, 165, 116, 0.08);
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px 48px',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: 32,
  },
  mainCol: {},
  sideCol: {},
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: '80px 0',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #F5E6D3',
    borderTopColor: '#D4A574',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  breadcrumb: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 16,
    padding: '16px 0 0',
  },
  breadcrumbLink: {
    cursor: 'pointer',
    color: '#D4A574',
  },
  breadcrumbSep: {
    margin: '0 8px',
  },
  imageSection: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  heroImage: {
    width: '100%',
    height: 320,
    objectFit: 'cover',
    display: 'block',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '24px',
    background: 'linear-gradient(transparent, rgba(74, 55, 40, 0.85))',
  },
  recipeTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: "'Noto Serif SC', serif",
  },
  titleMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.5)',
  },
  authorName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  ratingBadge: {
    fontSize: 14,
    color: '#FFD700',
    marginLeft: 8,
  },
  starIcon: {
    fontSize: 14,
  },
  tagRow: {
    display: 'flex',
    gap: 6,
  },
  tag: {
    padding: '3px 12px',
    borderRadius: 12,
    background: 'rgba(107, 142, 35, 0.85)',
    color: '#FFF',
    fontSize: 12,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: '#4A3728',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: '2px solid #F5E6D3',
    fontFamily: "'Noto Serif SC', serif",
  },
  stepProgress: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: '#E8DDD0',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  progressDotActive: {
    background: '#D4A574',
    transform: 'scale(1.2)',
  },
  stepCard: {
    padding: '20px 24px',
    background: '#FFFFFF',
    borderRadius: 12,
    boxShadow: '0 2px 12px rgba(74, 55, 40, 0.06)',
    transition: 'opacity 0.25s ease, transform 0.25s ease',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: '#D4A574',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: 16,
    flexShrink: 0,
  },
  stepContent: {
    fontSize: 16,
    lineHeight: 1.8,
    color: '#4A3728',
    paddingTop: 6,
  },
  stepNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  stepBtn: {
    padding: '8px 24px',
    borderRadius: 20,
    border: '1.5px solid #D4A574',
    background: 'transparent',
    color: '#D4A574',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    fontFamily: "'Noto Sans SC', sans-serif",
  },
  stepBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  stepIndicator: {
    fontSize: 14,
    color: '#8B7355',
  },
  ingredientList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  ingredientItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
  },
  ingredientDot: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '2px solid #D4A574',
    background: 'transparent',
    flexShrink: 0,
    transition: 'all 0.3s ease',
  },
  ingredientDotPrepared: {
    background: '#6B8E23',
    borderColor: '#6B8E23',
  },
  ingredientDotPulse: {
    animation: 'pulse 0.4s ease',
  },
  ingredientName: {
    fontSize: 14,
    color: '#4A3728',
    flex: 1,
    transition: 'all 0.3s ease',
  },
  ingredientNamePrepared: {
    textDecoration: 'line-through',
    color: '#BFA882',
  },
  ingredientAmount: {
    fontSize: 13,
    color: '#8B7355',
    minWidth: 50,
    textAlign: 'right',
  },
  ingredientPrep: {
    fontSize: 12,
    color: '#BFA882',
    fontStyle: 'italic',
    maxWidth: 120,
  },
  ratingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  rateStar: {
    fontSize: 28,
    cursor: 'pointer',
    transition: 'color 0.2s ease, transform 0.2s ease',
  },
  ratingText: {
    fontSize: 14,
    color: '#8B7355',
    marginLeft: 12,
  },
  commentInputWrap: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1.5px solid #E8DDD0',
    fontSize: 14,
    fontFamily: "'Noto Sans SC', sans-serif",
    resize: 'vertical',
    minHeight: 60,
    outline: 'none',
    transition: 'border-color 0.2s ease',
    background: '#FFFFFF',
  },
  commentSubmit: {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: '#D4A574',
    color: '#FFFFFF',
    fontSize: 14,
    cursor: 'pointer',
    fontWeight: 500,
    fontFamily: "'Noto Sans SC', sans-serif",
    transition: 'background 0.2s ease',
  },
  commentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  commentItem: {
    display: 'flex',
    gap: 10,
    padding: '12px',
    borderRadius: 10,
    background: '#FFFFFF',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    flexShrink: 0,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentName: {
    fontSize: 14,
    fontWeight: 500,
    color: '#4A3728',
  },
  commentTime: {
    fontSize: 12,
    color: '#BFA882',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#6B5744',
  },
}
