
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../App'

interface Recipe {
  id: string
  title: string
  authorId: string
  authorName: string
  authorAvatar: string
  coverColor: string
  tags: string[]
  averageRating: number
  ratingCount: number
  commentCount: number
  createdAt: number
  ingredientNames: string[]
}

const TAGS = [
  { name: '家常菜', color: '#FF8A65' },
  { name: '烘焙', color: '#AB47BC' },
  { name: '甜品', color: '#FFD54F' },
  { name: '汤羹', color: '#4DB6AC' },
  { name: '快手菜', color: '#7986CB' },
]

const FOOD_EMOJIS = ['🍜', '🍱', '🥘', '🍲', '🥗', '🍛', '🥞', '🍰', '🍪', '🥐', '🍖', '🌮', '🍝', '🍤', '🥟']

interface HomeProps {
  search: string
  setSearch: (s: string) => void
}

function Home({ search, setSearch }: HomeProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [rankingRefreshKey, setRankingRefreshKey] = useState(0)

  const navigateToDetail = useAppStore((s) => s.navigateToDetail)
  const searchTimerRef = useRef<number | null>(null)

  const fetchRecipes = async () => {
    try {
      const res = await fetch('/api/recipes')
      const json = await res.json()
      if (json.code === 0) {
        setRecipes(json.data)
      }
    } catch (e) {
      console.error('Failed to fetch recipes', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipes()
    const interval = window.setInterval(() => {
      fetchRecipes()
      setRankingRefreshKey((k) => k + 1)
    }, 600000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current)
    }
    searchTimerRef.current = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 500)
    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current)
      }
    }
  }, [search])

  const filteredRecipes = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase()
    let result = recipes
    if (keyword) {
      result = result.filter((r) => {
        const matchTitle = r.title.toLowerCase().includes(keyword)
        const matchIngredient = r.ingredientNames.some((n) => n.toLowerCase().includes(keyword))
        return matchTitle || matchIngredient
      })
    }
    if (selectedTags.length > 0) {
      result = result.filter((r) => selectedTags.every((t) => r.tags.includes(t)))
    }
    return result
  }, [recipes, debouncedSearch, selectedTags])

  const topRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => b.averageRating - a.averageRating).slice(0, 5)
  }, [recipes, rankingRefreshKey])

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    )
  }

  const getEmoji = (id: string) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash)
    }
    return FOOD_EMOJIS[Math.abs(hash) % FOOD_EMOJIS.length]
  }

  const rankIcons = ['🥇', '🥈', '🥉']

  return (
    <>
      <style>{`
        .home-layout {
          display: flex;
          gap: 0;
        }

        .home-main {
          flex: 1;
          min-width: 0;
        }

        .home-ranking {
          width: 280px;
          margin-left: 24px;
          flex-shrink: 0;
        }

        .tag-bar {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 4px 2px 12px 2px;
          margin-bottom: 20px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .tag-bar::-webkit-scrollbar {
          display: none;
        }

        .tag-btn {
          flex-shrink: 0;
          padding: 8px 20px;
          border-radius: 20px;
          border: 1px solid;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          background: transparent;
          transition: all 0.25s ease-out;
          user-select: none;
          white-space: nowrap;
        }

        .recipe-card {
          background: white;
          border-radius: 2px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          cursor: pointer;
        }

        .recipe-cover {
          height: 140px;
          border-radius: 2px 2px 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 56px;
        }

        .recipe-content {
          padding: 16px;
        }

        .recipe-title {
          font-weight: bold;
          font-size: 16px;
          color: #333;
          margin-bottom: 8px;
        }

        .recipe-author {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #999;
          margin-bottom: 12px;
        }

        .recipe-stats {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          color: #666;
        }

        .recipe-rating {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .recipe-comments {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .ranking-panel {
          background: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          position: sticky;
          top: 88px;
        }

        .ranking-panel-title {
          font-weight: 600;
          color: #E65100;
          font-size: 16px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ranking-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s ease-out;
        }

        .ranking-item:hover {
          background: #FFF8E1;
        }

        .ranking-badge {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: #FFE0B2;
          color: #E65100;
          font-weight: bold;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ranking-badge.top {
          background: transparent;
          width: 26px;
          height: 26px;
          font-size: 20px;
        }

        .ranking-info {
          flex: 1;
          min-width: 0;
        }

        .ranking-name {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ranking-score {
          font-size: 12px;
          color: #FF9800;
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .skeleton-card {
          background: white;
          border-radius: 2px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .skeleton-cover {
          height: 140px;
          border-radius: 2px 2px 0 0;
        }

        .skeleton-content {
          padding: 16px;
        }

        .skeleton-line {
          height: 16px;
          margin-bottom: 12px;
        }

        .skeleton-line.short {
          width: 60%;
          height: 12px;
          margin-bottom: 0;
        }

        @media (max-width: 768px) {
          .home-layout {
            display: block;
          }

          .home-ranking {
            display: none;
          }

          .tag-bar {
            padding: 4px 2px 16px 2px;
          }
        }
      `}</style>

      <div className="home-layout">
        <div className="home-main">
          <div className="tag-bar">
            {TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag.name)
              return (
                <button
                  key={tag.name}
                  className="tag-btn"
                  onClick={() => toggleTag(tag.name)}
                  style={{
                    color: isSelected ? '#fff' : tag.color,
                    borderColor: tag.color,
                    background: isSelected ? tag.color : 'transparent',
                    boxShadow: isSelected
                      ? `0 0 0 2px white, 0 0 0 4px ${tag.color}`
                      : 'none',
                  }}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <div key="skeleton" className="waterfall">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="waterfall-item">
                    <div className="skeleton-card">
                      <div className="skeleton skeleton-cover" />
                      <div className="skeleton-content">
                        <div className="skeleton skeleton-line" />
                        <div className="skeleton skeleton-line skeleton-line short" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div key="cards" className="waterfall">
                {filteredRecipes.map((recipe) => (
                  <div key={recipe.id} className="waterfall-item">
                    <motion.div
                      className="recipe-card"
                      whileHover={{ y: -5, transition: { duration: 0.25 } }}
                      transition={{ duration: 0.25 }}
                      onClick={() => navigateToDetail(recipe.id)}
                    >
                      <div
                        className="recipe-cover"
                        style={{ background: recipe.coverColor }}
                      >
                        <span>{getEmoji(recipe.id)}</span>
                      </div>
                      <div className="recipe-content">
                        <div className="recipe-title">{recipe.title}</div>
                        <div className="recipe-author">
                          <span style={{ fontSize: 16 }}>{recipe.authorAvatar}</span>
                          <span>{recipe.authorName}</span>
                        </div>
                        <div className="recipe-stats">
                          <div className="recipe-rating">
                            <span>⭐</span>
                            <span>{recipe.averageRating.toFixed(1)}</span>
                          </div>
                          <div className="recipe-comments">
                            <span>💬</span>
                            <span>{recipe.commentCount}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))}
                {filteredRecipes.length === 0 && (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      padding: '60px 20px',
                      textAlign: 'center',
                      color: '#999',
                      fontSize: 14,
                    }}
                  >
                    没有找到匹配的食谱，换个关键词试试吧~
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="home-ranking">
          <div className="ranking-panel">
            <div className="ranking-panel-title">
              <span>🔥</span>
              <span>热门排行 TOP5</span>
            </div>
            {topRecipes.map((recipe, idx) => (
              <div
                key={recipe.id}
                className="ranking-item"
                onClick={() => navigateToDetail(recipe.id)}
              >
                {idx < 3 ? (
                  <div className="ranking-badge top">{rankIcons[idx]}</div>
                ) : (
                  <div className="ranking-badge">{idx + 1}</div>
                )}
                <div className="ranking-info">
                  <div className="ranking-name">{recipe.title}</div>
                  <div className="ranking-score">
                    <span>⭐</span>
                    <span>{recipe.averageRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default Home
