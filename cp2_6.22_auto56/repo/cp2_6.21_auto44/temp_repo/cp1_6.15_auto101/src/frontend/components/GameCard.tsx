import React from 'react'
import { Game } from '../api'

interface GameCardProps {
  game: Game
  onClick: () => void
  onTagClick: (tag: string) => void
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.5

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`star ${i <= fullStars ? 'full' : i === fullStars + 1 && hasHalf ? 'half' : 'empty'}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick, onTagClick }) => {
  const displayTags = game.tags.slice(0, 3)

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation()
    onTagClick(tag)
  }

  return (
    <div className="game-card" onClick={onClick}>
      <div className="game-card-thumbnail">
        <img src={game.thumbnail} alt={game.title} />
        <div className="game-card-title-overlay">
          <h3 className="game-card-title">{game.title}</h3>
        </div>
      </div>
      <div className="game-card-info">
        <div className="game-card-developer">{game.developer}</div>
        <div className="game-card-tags">
          {displayTags.map((tag, index) => (
            <span
              key={tag}
              className={`tag tag-${index % 5}`}
              onClick={(e) => handleTagClick(e, tag)}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="game-card-footer">
          <StarRating rating={game.averageRating} />
          <span className="review-count">({game.reviewCount})</span>
        </div>
      </div>
    </div>
  )
}

export default GameCard
