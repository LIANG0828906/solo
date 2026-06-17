import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Recipe } from '../data/recipes'
import { toggleFavorite } from '../data/recipes'

interface RecipeCardProps {
  recipe: Recipe
  onFavoriteChange?: (id: string, isFavorited: boolean) => void
  visible?: boolean
}

function RecipeCard({ recipe, onFavoriteChange, visible = true }: RecipeCardProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [isFavorited, setIsFavorited] = useState(recipe.isFavorited)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const isLockedRef = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsFavorited(recipe.isFavorited)
  }, [recipe.isFavorited])

  useEffect(() => {
    const node = cardRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '100px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLockedRef.current || isAnimating) return

    isLockedRef.current = true
    setIsAnimating(true)

    const newState = toggleFavorite(recipe.id)
    setIsFavorited(newState)

    if (onFavoriteChange) {
      onFavoriteChange(recipe.id, newState)
    }

    setTimeout(() => {
      setIsAnimating(false)
      isLockedRef.current = false
    }, 150)
  }

  const handleDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div className="masonry-item" ref={cardRef}>
      <Link
        to={`/recipe/${recipe.id}`}
        className={`recipe-card ${visible ? 'fade-in' : 'fade-out'}`}
      >
        <div className="recipe-cover-wrapper" style={{ width: '100%', height: '180px', borderRadius: '8px', backgroundColor: '#3A3A4F', overflow: 'hidden' }}>
          {isInView && (
            <img
              src={recipe.cover}
              alt={recipe.name}
              className={`recipe-cover ${imageLoaded ? 'img-loaded' : 'img-loading'}`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
        <div className="recipe-info">
          <div className="recipe-text">
            <h3 className="recipe-name">{recipe.name}</h3>
            <p className="recipe-author">{recipe.author}</p>
          </div>
          <button
            className={`favorite-btn ${isFavorited ? 'favorited' : ''} ${isAnimating ? 'animating' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorited ? '取消收藏' : '收藏'}
            disabled={isLockedRef.current}
          >
            <svg viewBox="0 0 24 24" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>
        <div className="recipe-card-footer" style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <Link
            to={`/recipe/${recipe.id}`}
            className="view-detail-link"
            onClick={handleDetailClick}
          >
            查看详情 →
          </Link>
        </div>
      </Link>
    </div>
  )
}

export default RecipeCard
