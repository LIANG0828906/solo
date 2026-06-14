import { useState, useEffect, useRef } from 'react'
import type { Recipe } from '../types'

interface RecipeCardProps {
  recipe: Recipe
  onClick: () => void
  index: number
}

export default function RecipeCard({ recipe, onClick, index }: RecipeCardProps) {
  const [visible, setVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 80)
    return () => clearTimeout(timer)
  }, [index])

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      style={{
        ...styles.card,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
      }}
      className="recipe-card"
    >
      <style>{cardHoverCSS}</style>
      <div style={styles.imageWrap}>
        <img
          src={recipe.image}
          alt={recipe.title}
          style={styles.image}
          loading="lazy"
        />
        <div style={styles.tags}>
          {recipe.tags.slice(0, 3).map(tag => (
            <span key={tag} style={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>
      <div style={styles.content}>
        <h3 style={styles.title}>{recipe.title}</h3>
        <p style={styles.desc}>{recipe.description}</p>
        <div style={styles.meta}>
          <div style={styles.author}>
            <img src={recipe.author.avatar} alt={recipe.author.name} style={styles.avatar} />
            <span style={styles.authorName}>{recipe.author.name}</span>
          </div>
          <div style={styles.rating}>
            <span style={styles.star}>★</span>
            <span>{recipe.rating}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const cardHoverCSS = `
  .recipe-card {
    transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                box-shadow 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                opacity 0.5s ease;
    cursor: pointer;
  }
  .recipe-card:hover {
    transform: translateY(-8px) !important;
    box-shadow: 0 16px 40px rgba(74, 55, 40, 0.18) !important;
  }
  .recipe-card:hover .recipe-card-image {
    transform: scale(1.05);
  }
  @media (max-width: 768px) {
    .recipe-card {
      width: 100% !important;
    }
  }
`

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(74, 55, 40, 0.08)',
    transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    paddingTop: '65%',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.4s ease',
    className: 'recipe-card-image',
  } as React.CSSProperties,
  tags: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
  },
  tag: {
    padding: '2px 10px',
    borderRadius: 12,
    background: 'rgba(107, 142, 35, 0.85)',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 500,
  },
  content: {
    padding: '14px 16px 16px',
  },
  title: {
    fontSize: 17,
    fontWeight: 600,
    color: '#4A3728',
    marginBottom: 6,
    lineHeight: 1.4,
  },
  desc: {
    fontSize: 13,
    color: '#8B7355',
    lineHeight: 1.6,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    marginBottom: 12,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    border: '2px solid #F5E6D3',
  },
  authorName: {
    fontSize: 13,
    color: '#8B7355',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 14,
    fontWeight: 500,
    color: '#4A3728',
  },
  star: {
    color: '#E74C3C',
    fontSize: 14,
  },
}
