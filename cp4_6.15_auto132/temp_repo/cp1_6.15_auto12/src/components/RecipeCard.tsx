import { useEffect, useState } from 'react'
import type { Recipe } from '../types'

interface RecipeCardProps {
  recipe: Recipe
  onClick: () => void
  index: number
}

export default function RecipeCard({ recipe, onClick, index }: RecipeCardProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), index * 80)
    return () => clearTimeout(t)
  }, [index])

  return (
    <div
      onClick={onClick}
      className={`recipe-card ${show ? 'recipe-card-visible' : ''}`}
    >
      <style>{cardCSS}</style>
      <div className="recipe-card-image-wrap">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="recipe-card-image"
          loading="lazy"
        />
        <div className="recipe-card-tags">
          {recipe.tags.slice(0, 3).map(tag => (
            <span key={tag} className="recipe-card-tag">{tag}</span>
          ))}
        </div>
      </div>
      <div className="recipe-card-content">
        <h3 className="recipe-card-title">{recipe.title}</h3>
        <p className="recipe-card-desc">{recipe.description}</p>
        <div className="recipe-card-meta">
          <div className="recipe-card-author">
            <img src={recipe.author.avatar} alt={recipe.author.name} className="recipe-card-avatar" />
            <span className="recipe-card-author-name">{recipe.author.name}</span>
          </div>
          <div className="recipe-card-rating">
            <span className="recipe-card-star">★</span>
            <span>{recipe.rating}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const cardCSS = `
  .recipe-card {
    background: #FFFFFF;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(74, 55, 40, 0.08);
    cursor: pointer;
    opacity: 0;
    transform: translateY(24px);
    animation-name: recipeCardFadeIn;
    animation-duration: 0.6s;
    animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
    animation-fill-mode: forwards;
    animation-play-state: paused;
    transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                box-shadow 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
  .recipe-card-visible {
    animation-play-state: running;
  }
  @keyframes recipeCardFadeIn {
    from {
      opacity: 0;
      transform: translateY(24px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .recipe-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 40px rgba(74, 55, 40, 0.18);
  }
  .recipe-card:hover .recipe-card-image {
    transform: scale(1.05);
  }
  .recipe-card-image-wrap {
    position: relative;
    width: 100%;
    padding-top: 65%;
    overflow: hidden;
  }
  .recipe-card-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }
  .recipe-card-tags {
    position: absolute;
    bottom: 8px;
    left: 8px;
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .recipe-card-tag {
    padding: 2px 10px;
    border-radius: 12px;
    background: rgba(107, 142, 35, 0.85);
    color: #FFFFFF;
    font-size: 12px;
    font-weight: 500;
  }
  .recipe-card-content {
    padding: 14px 16px 16px;
  }
  .recipe-card-title {
    font-size: 17px;
    font-weight: 600;
    color: #4A3728;
    margin-bottom: 6px;
    line-height: 1.4;
    font-family: 'Noto Serif SC', serif;
  }
  .recipe-card-desc {
    font-size: 13px;
    color: #8B7355;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 12px;
  }
  .recipe-card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .recipe-card-author {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .recipe-card-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid #F5E6D3;
  }
  .recipe-card-author-name {
    font-size: 13px;
    color: #8B7355;
  }
  .recipe-card-rating {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 500;
    color: #4A3728;
  }
  .recipe-card-star {
    color: #E74C3C;
    font-size: 14px;
  }
  @media (max-width: 768px) {
    .recipe-card {
      width: 100%;
    }
  }
`
