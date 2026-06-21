import React from 'react'
import { Clock, Star } from 'lucide-react'
import { MatchedRecipe } from '../../shared/types'
import './RecipeCard.css'

interface RecipeCardProps {
  recipe: MatchedRecipe
  onClick: () => void
  index: number
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick, index }) => {
  const allIngredients = recipe.ingredients

  const renderStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        className={`star ${i < difficulty ? 'filled' : 'empty'}`}
      />
    ))
  }

  return (
    <div
      className="recipe-card"
      onClick={onClick}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div
        className="recipe-image"
        style={{ background: recipe.imageGradient }}
      >
        <div className="match-badge">
          {Math.round(recipe.matchRate * 100)}% 匹配
        </div>
      </div>

      <div className="recipe-content">
        <h3 className="recipe-name">{recipe.name}</h3>

        <div className="recipe-ingredients">
          {allIngredients.map((ingredient, i) => {
            const isMatched = recipe.matchedIngredients.some(
              m => m.toLowerCase() === ingredient.toLowerCase()
            )
            return (
              <span
                key={i}
                className={`ingredient-tag ${isMatched ? 'matched' : 'missing'}`}
              >
                {ingredient}
              </span>
            )
          })}
        </div>

        <div className="recipe-meta">
          <div className="duration">
            <Clock size={14} />
            <span>{recipe.duration}分钟</span>
          </div>
          <div className="difficulty">
            {renderStars(recipe.difficulty)}
          </div>
        </div>
      </div>
    </div>
  )
}
