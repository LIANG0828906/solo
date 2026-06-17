import { useEffect, useState } from 'react'
import { useRecipeStore } from './store'
import { createRipple } from '../utils'

export default function RecipeDetail() {
  const recipe = useRecipeStore((s) => s.currentRecipe)
  const loading = useRecipeStore((s) => s.loading)
  const error = useRecipeStore((s) => s.error)
  const setView = useRecipeStore((s) => s.setView)
  const isFavorite = useRecipeStore((s) => s.isFavorite)
  const toggleFavorite = useRecipeStore((s) => s.toggleFavorite)
  const addRecipeToShopping = useRecipeStore((s) => s.addRecipeToShopping)
  const currentStep = useRecipeStore((s) => s.currentStep)
  const setCurrentStep = useRecipeStore((s) => s.setCurrentStep)
  const fetchRecipe = useRecipeStore((s) => s.fetchRecipe)

  const [imageIndex, setImageIndex] = useState(0)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())
  const [heartAnimating, setHeartAnimating] = useState(false)

  useEffect(() => {
    setImageIndex(0)
    setCheckedIngredients(new Set())
  }, [recipe?.id])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="detail-container">
        <div className="error-container">
          <p className="error-text">{error}</p>
          <button
            className="retry-btn ripple-button"
            onClick={(e) => {
              createRipple(e)
              if (recipe) fetchRecipe(recipe.id)
            }}
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="detail-container">
        <p>食谱不存在</p>
      </div>
    )
  }

  const fav = isFavorite(recipe.id)

  const handlePrevImage = (e: React.MouseEvent) => {
    createRipple(e)
    setImageIndex((i) => (i - 1 + recipe.images.length) % recipe.images.length)
  }

  const handleNextImage = (e: React.MouseEvent) => {
    createRipple(e)
    setImageIndex((i) => (i + 1) % recipe.images.length)
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    createRipple(e)
    setHeartAnimating(true)
    toggleFavorite(recipe.id)
    setTimeout(() => setHeartAnimating(false), 300)
  }

  const handleAddToShopping = (e: React.MouseEvent) => {
    createRipple(e)
    addRecipeToShopping(recipe)
  }

  const handleBack = (e: React.MouseEvent) => {
    createRipple(e)
    setView('list')
  }

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }

  return (
    <div className="detail-container">
      <button
        className="back-btn ripple-button"
        onClick={handleBack}
      >
        ← 返回列表
      </button>

      <div className="carousel">
        {recipe.images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`${recipe.name} ${idx + 1}`}
            className="carousel-image"
            style={{ opacity: idx === imageIndex ? 1 : 0 }}
          />
        ))}
        {recipe.images.length > 1 && (
          <>
            <button
              className="carousel-btn prev ripple-button"
              onClick={handlePrevImage}
            >
              ‹
            </button>
            <button
              className="carousel-btn next ripple-button"
              onClick={handleNextImage}
            >
              ›
            </button>
            <div className="carousel-dots">
              {recipe.images.map((_, idx) => (
                <div
                  key={idx}
                  className={`carousel-dot ${idx === imageIndex ? 'active' : ''}`}
                  onClick={() => setImageIndex(idx)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="detail-header">
        <h1 className="detail-title">{recipe.name}</h1>
        <div className="detail-author">
          <img src={recipe.authorAvatar} alt={recipe.author} className="detail-avatar" />
          <span>{recipe.author}</span>
        </div>
        <div className="detail-tags">
          <span className="detail-tag">🏷 {recipe.category}</span>
          <span className="detail-tag">⏱ {recipe.cookingTime}分钟</span>
          <span className="detail-tag">📊 {recipe.difficulty}</span>
        </div>
        <p className="detail-description">{recipe.description}</p>

        <div className="detail-actions">
          <button
            className={`action-btn ripple-button ${fav ? 'favorite' : 'not-favorite'}`}
            onClick={handleToggleFavorite}
            style={{
              background: fav ? '#e74c3c' : 'white',
              color: fav ? 'white' : '#1a1a2e',
              border: fav ? 'none' : '1px solid #d1d5db',
              transition: 'background 0.3s ease, color 0.3s ease',
            }}
          >
            <span
              className={`heart-icon ${fav ? 'favorited' : 'not-favorited'} ${heartAnimating ? 'animating' : ''}`}
            >
              {fav ? '♥' : '♡'}
            </span>
            {fav ? '已收藏' : '收藏食谱'}
          </button>
          <button
            className="action-btn primary ripple-button"
            onClick={handleAddToShopping}
          >
            🛒 加入购物清单
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="ingredients-panel">
          <h2 className="section-title">🥗 食材清单</h2>
          {recipe.ingredients.map((ing, idx) => (
            <div
              key={idx}
              className={`ingredient-item ${checkedIngredients.has(idx) ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                className="ingredient-check"
                checked={checkedIngredients.has(idx)}
                onChange={() => toggleIngredient(idx)}
              />
              <span className="ingredient-name">{ing.name}</span>
              <span className="ingredient-amount">
                {ing.amount} {ing.unit}
              </span>
            </div>
          ))}
        </div>

        <div className="steps-panel">
          <h2 className="section-title">👨‍🍳 烹饪步骤</h2>
          {recipe.steps.map((step, idx) => (
            <div
              key={idx}
              className={`step-item ${idx === currentStep ? 'active' : ''}`}
              onClick={() => setCurrentStep(idx)}
            >
              <div className="step-number">{idx + 1}</div>
              <div className="step-content">
                <p className="step-text">{step}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
