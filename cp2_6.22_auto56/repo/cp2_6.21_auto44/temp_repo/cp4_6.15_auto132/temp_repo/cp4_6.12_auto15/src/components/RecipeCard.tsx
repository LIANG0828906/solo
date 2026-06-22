import { Link } from 'react-router-dom'
import { Thermometer, Clock, Percent } from 'react-feather'
import type { Recipe } from '@/types'

interface RecipeCardProps {
  recipe: Recipe
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}'${secs.toString().padStart(2, '0')}"`
  }

  return (
    <Link to={`/recipes/${recipe.id}/edit`} className="coffee-card recipe-card">
      <div className="recipe-card-header">
        <h3 className="coffee-card-name">{recipe.name}</h3>
        <p className="coffee-card-origin">{recipe.beanOrigin}</p>
      </div>
      <div className="recipe-card-stats">
        <div className="recipe-stat">
          <Thermometer size={16} />
          <div>
            <span className="recipe-stat-label">入豆温</span>
            <span className="recipe-stat-value">{recipe.chargeTemp}°C</span>
          </div>
        </div>
        <div className="recipe-stat">
          <Clock size={16} />
          <div>
            <span className="recipe-stat-label">一爆时间</span>
            <span className="recipe-stat-value">{formatTime(recipe.firstCrackTime)}</span>
          </div>
        </div>
        <div className="recipe-stat">
          <Thermometer size={16} />
          <div>
            <span className="recipe-stat-label">出豆温</span>
            <span className="recipe-stat-value">{recipe.dropTemp}°C</span>
          </div>
        </div>
        <div className="recipe-stat">
          <Percent size={16} />
          <div>
            <span className="recipe-stat-label">出豆率</span>
            <span className="recipe-stat-value">{recipe.yieldRate}%</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
