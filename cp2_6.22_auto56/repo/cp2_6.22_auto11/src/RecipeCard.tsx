import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './RecipeCard.css'

export interface Recipe {
  id: number
  title: string
  description: string
  image: string
  ingredients: { name: string; amount: string }[]
  steps: { order: number; content: string }[]
  tags: string[]
  authorId: number
  authorName: string
  rating: number
  ratingCount: number
  createdAt: string
  matchScore?: number
  matchedIngredients?: string[]
  missingIngredients?: string[]
}

interface RecipeCardProps {
  recipe: Recipe
  style?: React.CSSProperties
}

export default function RecipeCard({ recipe, style }: RecipeCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '100px' }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.5

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="star star-full">
            ★
          </span>
        )
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <span key={i} className="star star-half">
            ★
          </span>
        )
      } else {
        stars.push(
          <span key={i} className="star star-empty">
            ★
          </span>
        )
      }
    }

    return <div className="stars">{stars}</div>
  }

  return (
    <div
      ref={cardRef}
      className={`recipe-card ${isVisible ? 'fade-in' : ''}`}
      style={style}
    >
      <Link to={`/recipe/${recipe.id}`} className="recipe-card-link">
        <div className="recipe-image-container">
          {!imageLoaded && <div className="recipe-image-skeleton skeleton" />}
          {isVisible && (
            <img
              src={recipe.image}
              alt={recipe.title}
              className={`recipe-image ${imageLoaded ? 'loaded' : ''}`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          )}
          {recipe.matchScore !== undefined && (
            <div className="match-score-badge">
              匹配度 {recipe.matchScore}%
            </div>
          )}
        </div>

        <div className="recipe-content">
          <h3 className="recipe-title">{recipe.title}</h3>
          <p className="recipe-description">{recipe.description}</p>

          <div className="recipe-tags">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="recipe-tag">
                {tag}
              </span>
            ))}
          </div>

          <div className="recipe-footer">
            <div className="recipe-author">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(recipe.authorName)}`}
                alt={recipe.authorName}
                className="author-avatar"
              />
              <span className="author-name">{recipe.authorName}</span>
            </div>

            <div className="recipe-rating">
              {renderStars(recipe.rating)}
              <span className="rating-count">({recipe.ratingCount})</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
