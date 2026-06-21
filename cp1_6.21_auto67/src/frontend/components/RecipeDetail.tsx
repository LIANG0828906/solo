import React from 'react'
import { X, Clock, ChefHat } from 'lucide-react'
import { MatchedRecipe } from '../../shared/types'
import './RecipeDetail.css'

interface RecipeDetailProps {
  recipe: MatchedRecipe | null
  onClose: () => void
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, onClose }) => {
  if (!recipe) return null

  return (
    <>
      <div className="detail-overlay" onClick={onClose} />
      <div className="detail-panel">
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>

        <div
          className="detail-header"
          style={{ background: recipe.imageGradient }}
        >
          <h2 className="detail-title">{recipe.name}</h2>
          <div className="detail-badges">
            <span className="badge">
              <Clock size={14} />
              {recipe.duration}分钟
            </span>
            <span className="badge">
              <ChefHat size={14} />
              难度 {recipe.difficulty}/5
            </span>
            <span className="badge match">
              匹配度 {Math.round(recipe.matchRate * 100)}%
            </span>
          </div>
        </div>

        <div className="detail-content">
          <div className="ingredients-section">
            <h3>所需食材</h3>
            <div className="ingredients-list">
              {recipe.ingredients.map((ingredient, i) => {
                const isMatched = recipe.matchedIngredients.some(
                  m => m.toLowerCase() === ingredient.toLowerCase()
                )
                return (
                  <span
                    key={i}
                    className={`ingredient-tag ${isMatched ? 'matched' : 'missing'}`}
                  >
                    {ingredient} {isMatched ? '✓' : '✗'}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="steps-section">
            <h3>烹饪步骤</h3>
            <div className="steps-list">
              {recipe.steps.map((step, index) => (
                <div key={index} className="step-item">
                  <div className="step-number">{index + 1}</div>
                  <p className="step-text">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
