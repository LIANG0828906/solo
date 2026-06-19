import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Work, allTags } from '../data/mockData'

interface FeedListProps {
  works: Work[]
  triggerEffect: (type: 'applaud' | 'criticize' | 'inspire', x: number, y: number) => void
  onWorkUpdate: (id: string, field: 'applauds' | 'criticizes' | 'inspires', delta: number) => void
}

type SortType = 'date' | 'applauds'

const ITEMS_PER_PAGE = 5
const SCROLL_DEBOUNCE_MS = 200

const FeedList: React.FC<FeedListProps> = ({ works, triggerEffect, onWorkUpdate }) => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sortType, setSortType] = useState<SortType>('date')
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE)
  const [isLoading, setIsLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userActionsRef = useRef<Set<string>>(new Set())

  const filteredWorks = works
    .filter((work) => !selectedTag || work.tags.includes(selectedTag))
    .sort((a, b) => {
      if (sortType === 'applauds') return b.applauds - a.applauds
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })

  const displayedWorks = filteredWorks.slice(0, displayedCount)
  const hasMore = displayedCount < filteredWorks.length

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return
    setIsLoading(true)
    setTimeout(() => {
      setDisplayedCount((prev) => prev + ITEMS_PER_PAGE)
      setIsLoading(false)
    }, 300)
  }, [isLoading, hasMore])

  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {
        if (!listRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = listRef.current
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          loadMore()
        }
      }, SCROLL_DEBOUNCE_MS)
    }

    const container = listRef.current?.parentElement
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [loadMore])

  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE)
  }, [selectedTag, sortType])

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return '刚刚'
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const handleAction = (
    workId: string,
    action: 'applaud' | 'criticize' | 'inspire',
    event: React.MouseEvent,
  ) => {
    const actionKey = `${workId}-${action}`
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2

    if (userActionsRef.current.has(actionKey)) {
      userActionsRef.current.delete(actionKey)
      onWorkUpdate(workId, `${action}s` as 'applauds' | 'criticizes' | 'inspires', -1)
    } else {
      userActionsRef.current.add(actionKey)
      onWorkUpdate(workId, `${action}s` as 'applauds' | 'criticizes' | 'inspires', 1)
      triggerEffect(action, x, y)
    }
  }

  const getInitial = (name: string): string => {
    return name.charAt(0)
  }

  const isActionActive = (workId: string, action: string): boolean => {
    return userActionsRef.current.has(`${workId}-${action}`)
  }

  return (
    <div ref={listRef}>
      <div className="page-header">
        <h1 className="page-title">社区作品</h1>
        <p className="page-subtitle">探索其他创作者的灵感与故事</p>
      </div>

      <div className="filter-bar">
        <select
          className="filter-select"
          value={sortType}
          onChange={(e) => setSortType(e.target.value as SortType)}
        >
          <option value="date">按时间排序</option>
          <option value="applauds">按热度排序</option>
        </select>

        <div className="tag-filter">
          <button
            className={`tag-chip ${!selectedTag ? 'active' : ''}`}
            onClick={() => setSelectedTag(null)}
          >
            全部
          </button>
          {allTags.slice(0, 8).map((tag) => (
            <button
              key={tag}
              className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {filteredWorks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">暂无相关作品</div>
          <div className="empty-state-desc">换个标签试试，或者成为第一个创作的人</div>
        </div>
      ) : (
        <div className="feed-list">
          {displayedWorks.map((work) => (
            <div key={work.id} className="feed-item">
              <div className="feed-header">
                <div className="feed-avatar">
                  {work.author.avatar ? (
                    <img
                      src={work.author.avatar}
                      alt={work.author.name}
                      style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                    />
                  ) : (
                    getInitial(work.author.name)
                  )}
                </div>
                <div className="feed-author-info">
                  <div className="feed-author-name">{work.author.name}</div>
                  <div className="feed-time">{formatDate(work.publishedAt)}</div>
                </div>
              </div>

              <div className="feed-title">{work.title}</div>
              <div className="feed-excerpt">{work.excerpt}</div>

              <div className="feed-tags">
                {work.tags.map((tag) => (
                  <span key={tag} className="feed-tag">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="feed-actions">
                <button
                  className={`action-btn applaud ${isActionActive(work.id, 'applaud') ? 'active' : ''}`}
                  onClick={(e) => handleAction(work.id, 'applaud', e)}
                >
                  <span className="action-icon">👏</span>
                  <span>{work.applauds}</span>
                </button>
                <button
                  className={`action-btn criticize ${isActionActive(work.id, 'criticize') ? 'active' : ''}`}
                  onClick={(e) => handleAction(work.id, 'criticize', e)}
                >
                  <span className="action-icon">🧱</span>
                  <span>{work.criticizes}</span>
                </button>
                <button
                  className={`action-btn inspire ${isActionActive(work.id, 'inspire') ? 'active' : ''}`}
                  onClick={(e) => handleAction(work.id, 'inspire', e)}
                >
                  <span className="action-icon">⭐</span>
                  <span>{work.inspires}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading && <div className="loading-indicator">加载中...</div>}

      {!hasMore && filteredWorks.length > 0 && (
        <div className="loading-indicator">已经到底啦 ~</div>
      )}
    </div>
  )
}

export default FeedList
