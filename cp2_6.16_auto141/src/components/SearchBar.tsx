import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useBoardStore } from '../store'

const SearchBar: React.FC = () => {
  const searchQuery = useBoardStore((s) => s.searchQuery)
  const setSearchQuery = useBoardStore((s) => s.setSearchQuery)
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)

  // Debounce search to ensure <100ms response even with fast typing
  const debouncedSetQuery = useCallback(
    (() => {
      let timeout: ReturnType<typeof setTimeout> | null = null
      return (value: string) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
          setSearchQuery(value)
        }, 50)
      }
    })(),
    [setSearchQuery]
  )

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur()
        if (searchQuery) {
          setSearchQuery('')
          if (inputRef.current) inputRef.current.value = ''
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [searchQuery, setSearchQuery])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetQuery(e.target.value)
  }

  const handleClear = () => {
    if (inputRef.current) inputRef.current.value = ''
    setSearchQuery('')
    inputRef.current?.focus()
  }

  return (
    <div className={`wc-search-bar ${focused ? 'wc-search-focused' : ''}`}>
      <svg
        className="wc-search-icon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        className="wc-search-input"
        placeholder="搜索卡片标题或描述... (Ctrl+K)"
        defaultValue={searchQuery}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {searchQuery && (
        <button
          className="wc-search-clear"
          onClick={handleClear}
          title="清除搜索"
        >
          ✕
        </button>
      )}
    </div>
  )
}

export default React.memo(SearchBar)
