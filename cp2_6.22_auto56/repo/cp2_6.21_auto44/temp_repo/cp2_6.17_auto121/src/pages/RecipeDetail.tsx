import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getRecipeById, toggleFavorite, getRelatedRecipes, type Recipe } from '../data/recipes'

const CARD_WIDTH = 200
const CARD_GAP = 16

function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | undefined>(undefined)
  const [recommendations, setRecommendations] = useState<Recipe[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [activeDot, setActiveDot] = useState(0)
  const [totalDots, setTotalDots] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isLockedRef = useRef(false)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!id) return
    const found = getRecipeById(id)
    setRecipe(found)

    if (found) {
      setRecommendations(getRelatedRecipes(found, 4))
    }
  }, [id])

  useEffect(() => {
    const updateDots = () => {
      if (!scrollRef.current || recommendations.length === 0) {
        setTotalDots(0)
        setActiveDot(0)
        return
      }
      const containerWidth = scrollRef.current.clientWidth
      const itemTotalWidth = CARD_WIDTH + CARD_GAP
      const visibleCount = Math.max(1, Math.floor((containerWidth + CARD_GAP) / itemTotalWidth))
      const pages = Math.max(1, Math.ceil(recommendations.length / visibleCount))
      setTotalDots(pages)
      setActiveDot(prev => Math.min(prev, pages - 1))
    }

    updateDots()
    window.addEventListener('resize', updateDots)
    return () => window.removeEventListener('resize', updateDots)
  }, [recommendations.length])

  const handleFavoriteClick = () => {
    if (!recipe || isLockedRef.current || isAnimating) return

    isLockedRef.current = true
    setIsAnimating(true)
    const newState = toggleFavorite(recipe.id)
    setRecipe({ ...recipe, isFavorited: newState })

    setTimeout(() => {
      setIsAnimating(false)
      isLockedRef.current = false
    }, 150)
  }

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return
      const { scrollLeft, clientWidth } = scrollRef.current
      const itemTotalWidth = CARD_WIDTH + CARD_GAP
      const visibleCount = Math.max(1, Math.floor((clientWidth + CARD_GAP) / itemTotalWidth))
      const index = Math.round(scrollLeft / (itemTotalWidth * visibleCount))
      setActiveDot(index)
    }, 100)
  }, [])

  const scrollToIndex = (pageIndex: number) => {
    if (!scrollRef.current) return
    const containerWidth = scrollRef.current.clientWidth
    const itemTotalWidth = CARD_WIDTH + CARD_GAP
    const visibleCount = Math.max(1, Math.floor((containerWidth + CARD_GAP) / itemTotalWidth))
    const targetScroll = pageIndex * itemTotalWidth * visibleCount
    scrollRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    })
    setActiveDot(pageIndex)
  }

  if (!recipe) {
    return (
      <div className="detail-container">
        <div className="detail-content">
          <button className="detail-back" onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            返回首页
          </button>
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>菜谱不存在</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-container">
      <img
        src={recipe.cover}
        alt={recipe.name}
        className="detail-cover"
      />

      <div className="detail-content">
        <button className="detail-back" onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回首页
        </button>

        <h1 className="detail-title">{recipe.name}</h1>
        <p className="detail-author">by {recipe.author}</p>

        <div className="detail-section">
          <h2 className="detail-section-title">简介</h2>
          <p className="detail-description">{recipe.description}</p>
        </div>

        <div className="detail-section">
          <h2 className="detail-section-title">所需材料</h2>
          <div className="ingredients-list">
            {recipe.ingredients.map((ingredient, index) => (
              <div key={index} className="ingredient-item">
                {ingredient}
              </div>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <h2 className="detail-section-title">制作步骤</h2>
          <div className="steps-list">
            {recipe.steps.map((step, index) => (
              <div key={index} className="step-item">
                <span className="step-number">{index + 1}.</span>
                {step}
              </div>
            ))}
          </div>
        </div>

        <button
          className={`detail-favorite-btn ${isAnimating ? 'animating' : ''}`}
          onClick={handleFavoriteClick}
          disabled={isLockedRef.current}
        >
          <svg viewBox="0 0 24 24" fill={recipe.isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {recipe.isFavorited ? '已收藏' : '收藏菜谱'}
        </button>
      </div>

      {recommendations.length > 0 && (
        <div className="recommend-section">
          <h2 className="recommend-title">你可能还喜欢</h2>
          <div className="recommend-wrapper">
            <div
              ref={scrollRef}
              className="recommend-scroll"
              onScroll={handleScroll}
            >
              {recommendations.map(rec => (
                <Link
                  key={rec.id}
                  to={`/recipe/${rec.id}`}
                  className="recommend-card recommend-card-compact"
                >
                  <img src={rec.cover} alt={rec.name} loading="lazy" className="recommend-card-img-compact" />
                  <div className="recommend-card-info">
                    <div className="recommend-card-name recommend-card-name-compact">{rec.name}</div>
                    <div className="recommend-card-author">{rec.author}</div>
                  </div>
                </Link>
              ))}
            </div>
            {totalDots > 1 && (
              <div className="recommend-dots">
                {Array.from({ length: totalDots }, (_, i) => (
                  <button
                    key={i}
                    className={`recommend-dot ${activeDot === i ? 'active' : ''}`}
                    onClick={() => scrollToIndex(i)}
                    aria-label={`滚动到第 ${i + 1} 页推荐`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default RecipeDetail
