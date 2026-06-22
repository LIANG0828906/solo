import { useState } from 'react'

interface Props {
  likes: number
  dislikes: number
  recipeId: string
  onLikeChange?: (likes: number, dislikes: number) => void
  size?: 'sm' | 'md'
}

export default function LikeDislike({ likes: initialLikes, dislikes: initialDislikes, size = 'md' }: Props) {
  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [showHeart, setShowHeart] = useState(false)
  const [rotating, setRotating] = useState(false)

  const isSmall = size === 'sm'
  const btnWidth = isSmall ? '64px' : '80px'
  const btnHeight = isSmall ? '28px' : '36px'
  const iconSize = isSmall ? '14' : '16'

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (liked) return
    setShowHeart(true)
    setTimeout(() => setShowHeart(false), 500)
    if (disliked) {
      setDisliked(false)
      setDislikes(prev => prev - 1)
    }
    setLiked(true)
    setLikes(prev => prev + 1)
  }

  const handleDislike = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disliked) return
    setRotating(true)
    setTimeout(() => setRotating(false), 500)
    if (liked) {
      setLiked(false)
      setLikes(prev => prev - 1)
    }
    setDisliked(true)
    setDislikes(prev => prev + 1)
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={handleLike}
        style={{
          width: btnWidth,
          height: btnHeight,
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          backgroundColor: liked ? '#fef2f2' : '#fff',
          color: liked ? '#ef4444' : '#64748b',
          fontSize: isSmall ? '12px' : '13px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          transition: 'all 0.2s',
          position: 'relative',
          overflow: 'visible'
        }}
      >
        <span style={{ position: 'relative' }}>
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={liked ? '#ef4444' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          {showHeart && (
            <span
              style={{
                position: 'absolute',
                top: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#ef4444',
                fontSize: isSmall ? '12px' : '14px',
                animation: 'float-heart 0.5s ease-out forwards',
                pointerEvents: 'none'
              }}
            >
              ♥
            </span>
          )}
        </span>
        {likes}
      </button>
      <button
        onClick={handleDislike}
        style={{
          width: btnWidth,
          height: btnHeight,
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          backgroundColor: disliked ? '#f1f5f9' : '#fff',
          color: disliked ? '#64748b' : '#64748b',
          fontSize: isSmall ? '12px' : '13px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          transition: 'all 0.2s'
        }}
      >
        <span style={{ display: 'inline-block', animation: rotating ? 'rotate-once 0.5s ease-out' : 'none' }}>
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </span>
        {dislikes}
      </button>
    </div>
  )
}
