import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Recipe } from '../types'
import { recipeApi } from '../services/api'

interface Props {
  recipe: Recipe
  showMatchLevel?: boolean
}

export default function RecipeCard({ recipe, showMatchLevel }: Props) {
  const [likes, setLikes] = useState(recipe.likes)
  const [dislikes, setDislikes] = useState(recipe.dislikes)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [showHeart, setShowHeart] = useState(false)

  const matchLevelColors = {
    high: '#22c55e',
    medium: '#eab308',
    low: '#94a3b8'
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (liked) return
    setShowHeart(true)
    setTimeout(() => setShowHeart(false), 500)
    setLiked(true)
    setDisliked(false)
    const res = await recipeApi.like(recipe.id)
    if (res.code === 0) {
      setLikes(res.data.likes)
      setDislikes(res.data.dislikes)
    }
  }

  const handleDislike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (disliked) return
    setDisliked(true)
    setLiked(false)
    const res = await recipeApi.dislike(recipe.id)
    if (res.code === 0) {
      setLikes(res.data.likes)
      setDislikes(res.data.dislikes)
    }
  }

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      style={{
        width: '280px',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(249,115,22,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden' }}>
        <img
          src={recipe.coverImage}
          alt={recipe.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'
          }}
        />
        {showMatchLevel && recipe.matchLevel && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: matchLevelColors[recipe.matchLevel],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            {recipe.matchLevel === 'high' ? '!' : recipe.matchLevel === 'medium' ? '·' : '○'}
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            padding: '20px 14px 10px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img
              src={recipe.authorAvatar}
              alt={recipe.author}
              style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1.5px solid #fff' }}
            />
            <span style={{ color: '#fff', fontSize: '12px' }}>{recipe.author}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '14px' }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 700,
          marginBottom: '6px',
          color: '#1e293b',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: '"Noto Serif SC", serif'
        }}>
          {recipe.title}
        </h3>
        <p style={{
          fontSize: '12px',
          color: '#64748b',
          marginBottom: '12px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.5
        }}>
          {recipe.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
          {recipe.ingredients.slice(0, 4).map((ing, idx) => (
            <span
              key={idx}
              style={{
                padding: '2px 8px',
                borderRadius: '8px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontSize: '11px',
                fontWeight: 500
              }}
            >
              {ing.name}
            </span>
          ))}
          {recipe.ingredients.length > 4 && (
            <span style={{ padding: '2px 8px', fontSize: '11px', color: '#94a3b8' }}>
              +{recipe.ingredients.length - 4}
            </span>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '10px'
        }}>
          <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
            <button
              onClick={handleLike}
              style={{
                width: '80px',
                height: '36px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: liked ? '#fef2f2' : '#fff',
                color: liked ? '#ef4444' : '#64748b',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ position: 'relative' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? '#ef4444' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                {showHeart && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      color: '#ef4444',
                      fontSize: '14px',
                      animation: 'float-heart 0.5s ease-out forwards',
                      pointerEvents: 'none'
                    }}
                  >
                    ❤
                  </span>
                )}
              </span>
              {likes}
            </button>
            <button
              onClick={handleDislike}
              style={{
                width: '80px',
                height: '36px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                backgroundColor: disliked ? '#f1f5f9' : '#fff',
                color: disliked ? '#64748b' : '#64748b',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ display: 'inline-block', animation: disliked ? 'rotate-once 0.5s ease-out' : 'none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </span>
              {dislikes}
            </button>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{recipe.createdAt.slice(5, 10)}</span>
        </div>
      </div>
    </Link>
  )
}
