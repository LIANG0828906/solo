import { useState, useEffect, useMemo, useRef } from 'react'
import { useIdeaStore, getSortedIdeas, type Idea, type Category } from './ideaStore'

const categoryColors: Record<Category, { bg: string; text: string }> = {
  技术: { bg: 'rgba(74, 144, 217, 0.2)', text: '#4A90D9' },
  设计: { bg: 'rgba(155, 89, 182, 0.2)', text: '#9B59B6' },
  运营: { bg: 'rgba(230, 126, 34, 0.2)', text: '#E67E22' },
  市场: { bg: 'rgba(26, 188, 156, 0.2)', text: '#1ABC9C' },
}

function IdeaCard({
  idea,
  index,
  isAnimating,
}: {
  idea: Idea
  index: number
  isAnimating: boolean
}) {
  const toggleVote = useIdeaStore((state) => state.toggleVote)
  const toggleFavorite = useIdeaStore((state) => state.toggleFavorite)
  const [rippleActive, setRippleActive] = useState(false)
  const [voteAnimating, setVoteAnimating] = useState(false)

  const handleVote = (e: React.MouseEvent) => {
    e.stopPropagation()
    setVoteAnimating(true)
    setTimeout(() => setVoteAnimating(false), 200)
    toggleVote(idea.id)
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!idea.favorited) {
      setRippleActive(true)
      setTimeout(() => setRippleActive(false), 500)
    }
    toggleFavorite(idea.id)
  }

  const summary =
    idea.description.length > 30
      ? idea.description.slice(0, 30) + '...'
      : idea.description

  const catStyle = categoryColors[idea.category]

  return (
    <div
      className={`idea-card ${isAnimating ? 'card-enter' : ''}`}
      style={{
        animationDelay: `${Math.min(index * 100, 900)}ms`,
      }}
    >
      <div className="card-header">
        <span
          className="category-tag"
          style={{ backgroundColor: catStyle.bg, color: catStyle.text }}
        >
          {idea.category}
        </span>
        <button
          className={`favorite-btn ${idea.favorited ? 'favorited' : ''}`}
          onClick={handleFavorite}
          aria-label={idea.favorited ? '取消收藏' : '收藏'}
        >
          {rippleActive && <span className="ripple-effect" />}
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill={idea.favorited ? '#FFD700' : 'none'}
            stroke={idea.favorited ? '#FFD700' : 'currentColor'}
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="favorite-count">{idea.favoriteCount}</span>
        </button>
      </div>

      <h3 className="card-title">{idea.title}</h3>
      <p className="card-summary">{summary}</p>

      <div className="card-footer">
        <button
          className={`vote-btn ${idea.voted ? 'voted' : ''} ${voteAnimating ? 'vote-bounce' : ''}`}
          onClick={handleVote}
          aria-label={idea.voted ? '取消投票' : '投票'}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 4l-8 8h5v8h6v-8h5z" />
          </svg>
        </button>
        <span className={`vote-count ${idea.voted ? 'voted' : ''}`}>{idea.votes}</span>
      </div>
    </div>
  )
}

function SortBar({
  sortBy,
  onSortChange,
}: {
  sortBy: 'votes' | 'time'
  onSortChange: (sort: 'votes' | 'time') => void
}) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSort = (sort: 'votes' | 'time') => {
    if (sort === sortBy) return
    setIsTransitioning(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      onSortChange(sort)
      setTimeout(() => setIsTransitioning(false), 50)
    }, 150)
  }

  return (
    <div className="sort-bar">
      <div className="sort-tabs">
        <button
          className={`sort-tab ${sortBy === 'votes' ? 'active' : ''}`}
          onClick={() => handleSort('votes')}
        >
          🏆 热门排行
        </button>
        <button
          className={`sort-tab ${sortBy === 'time' ? 'active' : ''}`}
          onClick={() => handleSort('time')}
        >
          🕐 最新提交
        </button>
      </div>
      {isTransitioning && <div className="sort-transition-overlay" />}
    </div>
  )
}

function FavoritesSidebar() {
  const ideas = useIdeaStore((state) => state.ideas)
  const toggleFavorite = useIdeaStore((state) => state.toggleFavorite)

  const favorites = useMemo(
    () => ideas.filter((i) => i.favorited),
    [ideas]
  )

  return (
    <aside className="favorites-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-icon">⭐</span>
        <h3>我的收藏</h3>
        <span className="favorites-count">{favorites.length}</span>
      </div>
      <div className="favorites-list">
        {favorites.length === 0 ? (
          <p className="empty-favorites">还没有收藏的创意</p>
        ) : (
          favorites.map((idea) => (
            <div key={idea.id} className="favorite-item">
              <div className="favorite-info">
                <span className="favorite-title">{idea.title}</span>
                <span className="favorite-votes">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M12 4l-8 8h5v8h6v-8h5z" />
                  </svg>
                  {idea.votes}
                </span>
              </div>
              <button
                className="remove-favorite"
                onClick={() => toggleFavorite(idea.id)}
                aria-label="移除收藏"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}

export default function IdeaList() {
  const ideas = useIdeaStore((state) => state.ideas)
  const sortBy = useIdeaStore((state) => state.sortBy)
  const setSortBy = useIdeaStore((state) => state.setSortBy)
  const [initialAnim, setInitialAnim] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setInitialAnim(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  const sortedIdeas = useMemo(() => getSortedIdeas(ideas, sortBy), [ideas, sortBy])

  return (
    <div className="main-layout">
      <div className="content-area">
        <SortBar sortBy={sortBy} onSortChange={setSortBy} />
        <div className={`ideas-grid ${sortBy === 'time' ? 'sorting-time' : 'sorting-votes'}`}>
          {sortedIdeas.map((idea, index) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              index={index}
              isAnimating={initialAnim}
            />
          ))}
        </div>
      </div>
      <FavoritesSidebar />
    </div>
  )
}
