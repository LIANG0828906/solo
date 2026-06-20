import React, { useState, useEffect, useCallback } from 'react'
import { Game, getGames, getAvailableTags } from '../api'
import GameCard from '../components/GameCard'

interface GalleryPageProps {
  searchQuery: string
  onGameClick: (gameId: string) => void
  onTagFilter: (tag: string | null) => void
  selectedTag: string | null
}

const GalleryPage: React.FC<GalleryPageProps> = ({
  searchQuery,
  onGameClick,
  onTagFilter,
  selectedTag,
}) => {
  const [games, setGames] = useState<Game[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('newest')
  const [isAnimating, setIsAnimating] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchGames = useCallback(async () => {
    setIsAnimating(true)
    try {
      const params: { tag?: string; search?: string; sort?: string } = {
        sort: sortBy,
      }
      if (selectedTag) params.tag = selectedTag
      if (searchQuery) params.search = searchQuery

      const data = await getGames(params)
      setTimeout(() => {
        setGames(data)
        setIsAnimating(false)
        setLoading(false)
      }, 250)
    } catch (error) {
      console.error('Failed to fetch games:', error)
      setLoading(false)
    }
  }, [selectedTag, searchQuery, sortBy])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await getAvailableTags()
        setAvailableTags(tags)
      } catch (error) {
        console.error('Failed to fetch tags:', error)
      }
    }
    fetchTags()
  }, [])

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      onTagFilter(null)
    } else {
      onTagFilter(tag)
    }
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
  }

  const showNoResults = !loading && games.length === 0

  return (
    <div className="gallery-page">
      <div className="filter-bar">
        <div className="tag-filters">
          <button
            className={`tag-filter-btn ${!selectedTag ? 'active' : ''}`}
            onClick={() => onTagFilter(null)}
          >
            全部
          </button>
          {availableTags.map((tag, index) => (
            <button
              key={tag}
              className={`tag-filter-btn ${selectedTag === tag ? 'active' : ''} tag-btn-${index % 5}`}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="sort-controls">
          <span className="sort-label">排序：</span>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="newest">最新发布</option>
            <option value="rating">评分最高</option>
          </select>
        </div>
      </div>

      {showNoResults && (
        <div className="no-results shake">
          <p>🔍 没有找到相关作品</p>
          <p className="no-results-sub">试试其他关键词或标签吧</p>
        </div>
      )}

      <div className={`games-grid ${isAnimating ? 'fade-transition' : ''}`}>
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onClick={() => onGameClick(game.id)}
            onTagClick={handleTagClick}
          />
        ))}
      </div>
    </div>
  )
}

export default GalleryPage
