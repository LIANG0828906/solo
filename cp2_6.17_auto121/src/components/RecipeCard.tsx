import { useState } from 'react'
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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isAnimating) return
    
    setIsAnimating(true)
    const newState = toggleFavorite(recipe.id)
    setIsFavorited(newState)
    
    if (onFavoriteChange) {
      onFavoriteChange(recipe.id, newState)
    }
    
    setTimeout(() => {
      setIsAnimating(false)
    }, 150)
  }

  return (
    <div className="masonry-item">
      <Link 
        to={`/recipe/${recipe.id}`}
        className={`recipe-card ${visible ? 'fade-in' : 'fade-out'}`}
      >
        <img 
          src={recipe.cover} 
          alt={recipe.name}
          className="recipe-cover"
          loading="lazy"
        />
        <div className="recipe-info">
          <div className="recipe-text">
            <h3 className="recipe-name">{recipe.name}</h3>
            <p className="recipe-author">{recipe.author}</p>
          </div>
          <button
            className={`favorite-btn ${isFavorited ? 'favorited' : ''} ${isAnimating ? 'animating' : ''}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorited ? '取消收藏' : '收藏'}
          >
            <svg viewBox="0 0 24 24" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        </div>
      </Link>
    </div>
  )
}

export default RecipeCard
