import React, { useState, useEffect, useRef } from 'react'
import { Game, Review, getGameById, getReviewsByGameId, addReview } from '../api'

interface DetailPageProps {
  gameId: string
  onBack: () => void
  currentUserId: string
}

const AVAILABLE_TAGS = ['游戏玩法', '美术风格', '音效设计', '剧情故事', '技术实现']

const StarRatingInteractive: React.FC<{
  rating: number
  onChange?: (rating: number) => void
  interactive?: boolean
}> = ({ rating, onChange, interactive = false }) => {
  const [hoverRating, setHoverRating] = useState(0)

  const displayRating = hoverRating || rating

  return (
    <div className="star-rating-interactive">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`star ${i <= displayRating ? 'full' : 'empty'} ${interactive ? 'interactive' : ''}`}
          onClick={() => interactive && onChange && onChange(i)}
          onMouseEnter={() => interactive && setHoverRating(i)}
          onMouseLeave={() => interactive && setHoverRating(0)}
        >
          ★
        </span>
      ))}
    </div>
  )
}

const DetailPage: React.FC<DetailPageProps> = ({ gameId, onBack, currentUserId }) => {
  const [game, setGame] = useState<Game | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [reviewContent, setReviewContent] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newReviewId, setNewReviewId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const reviewsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const data = await getGameById(gameId)
        setGame(data)
      } catch (error) {
        console.error('Failed to fetch game:', error)
      }
    }
    fetchGame()
  }, [gameId])

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await getReviewsByGameId(gameId)
        setReviews(data)
      } catch (error) {
        console.error('Failed to fetch reviews:', error)
      }
    }
    fetchReviews()
  }, [gameId])

  const handlePrevSlide = () => {
    if (isAnimating || !game || game.screenshots.length <= 1) return
    setIsAnimating(true)
    setSlideDirection('right')
    const prevIndex = currentSlide === 0 ? game.screenshots.length - 1 : currentSlide - 1
    setTimeout(() => {
      setCurrentSlide(prevIndex)
      setSlideDirection(null)
      setIsAnimating(false)
    }, 400)
  }

  const handleNextSlide = () => {
    if (isAnimating || !game || game.screenshots.length <= 1) return
    setIsAnimating(true)
    setSlideDirection('left')
    const nextIndex = (currentSlide + 1) % game.screenshots.length
    setTimeout(() => {
      setCurrentSlide(nextIndex)
      setSlideDirection(null)
      setIsAnimating(false)
    }, 400)
  }

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleSubmitReview = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!reviewContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    const size = Math.max(rect.width, rect.height)
    ripple.style.width = ripple.style.height = size + 'px'
    ripple.style.left = e.clientX - rect.left - size / 2 + 'px'
    ripple.style.top = e.clientY - rect.top - size / 2 + 'px'
    button.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)

    try {
      const newReview = await addReview(gameId, {
        userId: currentUserId,
        content: reviewContent,
        rating: reviewRating,
        tags: selectedTags,
      })

      setReviews([newReview, ...reviews])
      setNewReviewId(newReview.id)
      setReviewContent('')
      setReviewRating(5)
      setSelectedTags([])

      setTimeout(() => {
        setNewReviewId(null)
      }, 300)

      if (game) {
        const updatedGame = await getGameById(gameId)
        setGame(updatedGame)
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!game) {
    return (
      <div className="detail-page">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={onBack}>
        ← 返回画廊
      </button>

      <div className="detail-header">
        <h1 className="detail-title">{game.title}</h1>
        <p className="detail-developer">开发者：{game.developer}</p>
        <div className="detail-rating">
          <StarRatingInteractive rating={game.averageRating} />
          <span className="rating-text">
            {game.averageRating.toFixed(1)} ({game.reviewCount} 条评价)
          </span>
        </div>
      </div>

      <div className="carousel-container">
        <div className="carousel">
          {game.screenshots.map((screenshot, index) => (
            <div
              key={index}
              className={`carousel-slide ${
                index === currentSlide
                  ? 'active'
                  : slideDirection === 'left'
                  ? 'slide-out-left'
                  : 'slide-out-right'
              }`}
              style={{
                transform:
                  index === currentSlide
                    ? 'translateX(0)'
                    : index < currentSlide
                    ? 'translateX(-100%)'
                    : 'translateX(100%)',
              }}
            >
              <img src={screenshot} alt={`${game.title} 截图 ${index + 1}`} />
            </div>
          ))}
        </div>
        {game.screenshots.length > 1 && (
          <>
            <button className="carousel-btn prev" onClick={handlePrevSlide}>
              ‹
            </button>
            <button className="carousel-btn next" onClick={handleNextSlide}>
              ›
            </button>
            <div className="carousel-dots">
              {game.screenshots.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="detail-tags">
        {game.tags.map((tag, index) => (
          <span key={tag} className={`tag tag-${index % 5}`}>
            {tag}
          </span>
        ))}
      </div>

      <div className="detail-description">
        <h3>游戏简介</h3>
        <p>{game.description}</p>
      </div>

      <div className="prototype-section">
        <h3>可玩原型</h3>
        <div className="iframe-container">
          <iframe
            src={game.htmlPrototype}
            title="游戏原型"
            sandbox="allow-scripts allow-forms"
            className="game-iframe"
          />
        </div>
      </div>

      <div className="reviews-section">
        <h3>评价与反馈 ({reviews.length})</h3>

        <div className="review-form">
          <h4>发表评价</h4>
          <div className="rating-input">
            <span className="rating-label">评分：</span>
            <StarRatingInteractive
              rating={reviewRating}
              onChange={setReviewRating}
              interactive
            />
          </div>
          <div className="tag-input">
            <span className="tag-label">标签（可选5个）：</span>
            <div className="tag-options">
              {AVAILABLE_TAGS.map((tag, index) => (
                <button
                  key={tag}
                  className={`tag-option ${
                    selectedTags.includes(tag) ? 'selected' : ''
                  } tag-${index % 5}`}
                  onClick={() => handleTagToggle(tag)}
                  type="button"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="text-input-wrapper">
            <textarea
              className="review-textarea"
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value.slice(0, 280))}
              placeholder="分享你的评价和建议..."
              maxLength={280}
              rows={4}
            />
            <span className={`char-count ${reviewContent.length >= 280 ? 'warning' : ''}`}>
              {reviewContent.length}/280
            </span>
          </div>
          <button
            className="submit-review-btn"
            onClick={handleSubmitReview}
            disabled={!reviewContent.trim() || isSubmitting}
          >
            {isSubmitting ? '提交中...' : '提交评价'}
          </button>
        </div>

        <div className="reviews-list">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`review-item ${
                newReviewId === review.id ? 'fade-in' : ''
              }`}
              ref={review.id === reviews[0]?.id ? reviewsEndRef : null}
            >
              <div className="review-header">
                <span className="review-author">{review.userName}</span>
                <StarRatingInteractive rating={review.rating} />
                <span className="review-date">
                  {new Date(review.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <div className="review-tags">
                {review.tags.map((tag, index) => (
                  <span key={tag} className={`tag-small tag-${index % 5}`}>
                    {tag}
                  </span>
                ))}
              </div>
              <p className="review-content">{review.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DetailPage
