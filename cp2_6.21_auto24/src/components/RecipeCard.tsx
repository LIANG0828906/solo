import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Recipe } from '../types'

interface RecipeCardProps {
  recipe: Recipe
}

const RecipeCard = ({ recipe }: RecipeCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const gradientColors = [
    'linear-gradient(135deg, #ff9a56, #ff6b6b)',
    'linear-gradient(135deg, #a8e6cf, #88d8b0)',
    'linear-gradient(135deg, #ffd93d, #ff9a56)',
    'linear-gradient(135deg, #c9b1ff, #a18cd1)',
    'linear-gradient(135deg, #8ec5fc, #6eb6ff)',
    'linear-gradient(135deg, #fbc2eb, #a6c1ee)',
  ]

  const gradient = gradientColors[recipe.id % gradientColors.length]

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      style={{ display: 'block' }}
    >
      <div
        ref={cardRef}
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          cursor: 'pointer',
          height: '100%',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}
      >
        <div
          style={{
            position: 'relative',
            height: '60%',
            minHeight: '180px',
            background: gradient,
            overflow: 'hidden',
          }}
        >
          {isVisible && recipe.cover_image && (
            <img
              src={recipe.cover_image}
              alt={recipe.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.3s',
              }}
              onLoad={() => setImageLoaded(true)}
            />
          )}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              display: 'flex',
              gap: '6px',
              flexWrap: 'wrap',
            }}
          >
            {recipe.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '4px 10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: '#5d4037',
                  fontWeight: 500,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '12px',
            }}
          >
            <span>⏱️</span>
            <span>{recipe.cook_time}分钟</span>
          </div>
        </div>

        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #8d6e63',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#3e2723',
              marginBottom: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {recipe.title}
          </h3>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              color: '#8d6e63',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#d7ccc8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#5d4037',
                }}
              >
                {recipe.author_name.charAt(0).toUpperCase()}
              </div>
              <span>{recipe.author_name}</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ color: recipe.is_liked ? '#ff5252' : '#999' }}>
                {recipe.is_liked ? '❤️' : '🤍'}
              </span>
              <span>{recipe.likes}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default RecipeCard
