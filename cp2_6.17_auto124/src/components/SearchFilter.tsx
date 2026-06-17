import React, { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import { useDiaryApi } from '../hooks/useDiaryApi'
import { useDiaryStore } from '../store/diaryStore'
import { ALL_TAGS, POSITIVE_TAGS, NEGATIVE_TAGS, DiaryEntry } from '../types'

interface SearchFilterProps {
  onResultsChange?: (results: DiaryEntry[]) => void
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ onResultsChange }) => {
  const { searchDiaries } = useDiaryApi()
  const { searchFilters, setSearchFilters, searchResults, setSearchResults } = useDiaryStore()
  const [keyword, setKeyword] = useState('')
  const [showTagDropdown, setShowTagDropdown] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTagDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      performSearch()
    }, 300)
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [keyword, selectedTags])

  const performSearch = async () => {
    const results = await searchDiaries(keyword, selectedTags)
    setSearchResults(results)
    setSearchFilters({ keyword, tags: selectedTags })
    if (onResultsChange) {
      onResultsChange(results)
    }
  }

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(t => t !== tagName)
      } else {
        return [...prev, tagName]
      }
    })
  }

  const clearKeyword = () => {
    setKeyword('')
  }

  const clearTag = (tagName: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tagName))
  }

  const truncateContent = (content: string, maxLen: number = 100): string => {
    if (content.length <= maxLen) return content
    return content.slice(0, maxLen) + '...'
  }

  return (
    <div className="search-filter">
      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="搜索日记内容或标签…"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
        />
        {keyword && (
          <button className="clear-btn" onClick={clearKeyword}>
            <X size={14} />
          </button>
        )}

        <div className="tag-dropdown-wrapper" ref={dropdownRef}>
          <button
            className="tag-dropdown-btn"
            onClick={() => setShowTagDropdown(!showTagDropdown)}
          >
            标签筛选
            <ChevronDown size={16} className={showTagDropdown ? 'rotate' : ''} />
          </button>

          {showTagDropdown && (
            <div className="tag-dropdown" onMouseDown={(e) => e.preventDefault()}>
              <div className="tag-dropdown-group">
                <div className="tag-dropdown-label">正面情绪</div>
                <div className="tag-dropdown-list">
                  {POSITIVE_TAGS.map(tag => (
                    <button
                      key={tag.name}
                      className={`tag-dropdown-item ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTag(tag.name)
                      }}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="tag-dropdown-group">
                <div className="tag-dropdown-label">负面情绪</div>
                <div className="tag-dropdown-list">
                  {NEGATIVE_TAGS.map(tag => (
                    <button
                      key={tag.name}
                      className={`tag-dropdown-item ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTag(tag.name)
                      }}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedTags.length > 0 && (
        <div className="selected-tags">
          {selectedTags.map(tag => (
            <span key={tag} className="selected-tag">
              #{tag}
              <button onClick={() => clearTag(tag)}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {(keyword || selectedTags.length > 0) && (
        <div className="search-results">
          <div className="search-results-count">
            找到 {searchResults.length} 篇日记
          </div>
          <div className="diary-cards">
            {searchResults.map(diary => (
              <DiaryCard key={diary.id} diary={diary} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface DiaryCardProps {
  diary: DiaryEntry
}

const DiaryCard: React.FC<DiaryCardProps> = ({ diary }) => {
  const { setCurrentDate, setCurrentPage, setCurrentDiary } = useDiaryStore()
  const { getDiary } = useDiaryApi()

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  const handleClick = async () => {
    setCurrentDate(diary.date)
    const d = await getDiary(diary.date)
    setCurrentDiary(d)
    setCurrentPage('diary')
  }

  const truncateContent = (content: string, maxLen: number = 100): string => {
    if (content.length <= maxLen) return content
    return content.slice(0, maxLen) + '...'
  }

  return (
    <div className="diary-card" onClick={handleClick}>
      <div className="diary-card-header">
        <span className="diary-card-date">{formatDate(diary.date)}</span>
        <span className={`diary-card-score ${diary.score > 0 ? 'positive' : diary.score < 0 ? 'negative' : 'neutral'}`}>
          {diary.score > 0 ? '+' : ''}{diary.score}
        </span>
      </div>
      <div className="diary-card-content">
        {truncateContent(diary.content)}
      </div>
      <div className="diary-card-tags">
        {diary.tags.map(tag => (
          <span key={tag} className="diary-card-tag">#{tag}</span>
        ))}
      </div>
    </div>
  )
}
