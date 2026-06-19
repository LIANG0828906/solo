import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getCommunityMemes, toggleFavorite } from '../utils/exportImage'
import '../styles/community.css'

interface MemeItem {
  id: string
  imageUrl: string
  thumbnailUrl: string
  creatorName: string
  createdAt: string
  likes: number
  isFavorite: boolean
}

interface CommunityProps {
  showFavoritesOnly?: boolean
}

const Community: React.FC<CommunityProps> = ({ showFavoritesOnly = false }) => {
  const [memes, setMemes] = useState<MemeItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(12)
  const [loadedItems, setLoadedItems] = useState<Set<string>>(new Set())
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMemes()
  }, [showFavoritesOnly])

  const loadMemes = () => {
    let allMemes = getCommunityMemes() as MemeItem[]

    if (showFavoritesOnly) {
      allMemes = allMemes.filter((m) => m.isFavorite)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      allMemes = allMemes.filter(
        (m) =>
          m.creatorName.toLowerCase().includes(query)
      )
    }

    setMemes(allMemes)
    setVisibleCount(12)
    setLoadedItems(new Set())
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMemes()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, showFavoritesOnly])

  const handleFavoriteClick = (e: React.MouseEvent, memeId: string) => {
    e.stopPropagation()
    const updated = toggleFavorite(memeId) as MemeItem[]
    if (showFavoritesOnly) {
      setMemes(updated.filter((m) => m.isFavorite))
    } else {
      setMemes(updated)
    }
  }

  const handleImageLoad = (memeId: string) => {
    setLoadedItems((prev) => new Set(prev).add(memeId))
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  const visibleMemes = memes.slice(0, visibleCount)

  const handleLoadMore = useCallback(() => {
    if (visibleCount < memes.length) {
      setVisibleCount((prev) => prev + 8)
    }
  }, [visibleCount, memes.length])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [handleLoadMore])

  const leftColumn = visibleMemes.filter((_, i) => i % 2 === 0)
  const rightColumn = visibleMemes.filter((_, i) => i % 2 === 1)

  return (
    <div className="community-page">
      <div className="community-header">
        <h1 className="community-title">
          {showFavoritesOnly ? '我的收藏' : '表情社区'}
        </h1>
        <div className="search-bar">
          <input
            type="text"
            placeholder="搜索创作者..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      {visibleMemes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-emoji">{showFavoritesOnly ? '💔' : '🎨'}</span>
          <p className="empty-text">
            {showFavoritesOnly ? '还没有收藏的表情包' : '还没有表情包，快来创作吧！'}
          </p>
        </div>
      ) : (
        <div className="meme-waterfall">
          <div className="waterfall-column">
            {leftColumn.map((meme, index) => (
              <MemeCard
                key={meme.id}
                meme={meme}
                isLoaded={loadedItems.has(meme.id)}
                delay={index * 0.08}
                onLoad={() => handleImageLoad(meme.id)}
                onFavorite={(e) => handleFavoriteClick(e, meme.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
          <div className="waterfall-column">
            {rightColumn.map((meme, index) => (
              <MemeCard
                key={meme.id}
                meme={meme}
                isLoaded={loadedItems.has(meme.id)}
                delay={index * 0.08 + 0.04}
                onLoad={() => handleImageLoad(meme.id)}
                onFavorite={(e) => handleFavoriteClick(e, meme.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        </div>
      )}

      {visibleCount < memes.length && (
        <div ref={observerRef} className="load-more">
          <div className="loading-spinner" />
          <span>加载更多...</span>
        </div>
      )}
    </div>
  )
}

interface MemeCardProps {
  meme: MemeItem
  isLoaded: boolean
  delay: number
  onLoad: () => void
  onFavorite: (e: React.MouseEvent) => void
  formatDate: (dateStr: string) => string
}

const MemeCard: React.FC<MemeCardProps> = ({
  meme,
  isLoaded,
  delay,
  onLoad,
  onFavorite,
  formatDate,
}) => {
  return (
    <div
      className={`meme-card ${isLoaded ? 'loaded' : ''}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="meme-image-wrapper">
        <img
          src={meme.thumbnailUrl}
          alt="表情包"
          className="meme-image"
          onLoad={onLoad}
          loading="lazy"
        />
        <button
          className={`favorite-btn ${meme.isFavorite ? 'favorited' : ''}`}
          onClick={onFavorite}
          title={meme.isFavorite ? '取消收藏' : '收藏'}
        >
          {meme.isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
      <div className="meme-info">
        <div className="creator-info">
          <div className="creator-avatar">
            {meme.creatorName.charAt(0).toUpperCase()}
          </div>
          <div className="creator-details">
            <span className="creator-name">{meme.creatorName}</span>
            <span className="create-time">{formatDate(meme.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Community
