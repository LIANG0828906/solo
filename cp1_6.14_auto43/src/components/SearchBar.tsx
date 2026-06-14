import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { useTagStore } from '@/store/tagStore'
import moment from 'moment'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const { searchResults, searchTags, clearSearch } = useTagStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const [isOpen, setIsOpen] = useState(false)

  const handleSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        searchTags(value)
        setIsOpen(true)
        setSelectedIndex(-1)
      }, 300)
    },
    [searchTags]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    handleSearch(val)
  }

  const handleClear = () => {
    setQuery('')
    clearSearch()
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      const tag = searchResults[selectedIndex]
      if (tag) window.open(tag.url, '_blank')
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  useEffect(() => {
    const handleClickOutside = () => {
      if (!isFocused) setIsOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isFocused])

  const highlightText = (text: string) => {
    if (!query.trim()) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-[#2d3748] rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div
        className={`relative flex items-center transition-all duration-200 ${
          isFocused ? 'search-glow' : ''
        }`}
      >
        <Search className="absolute left-3 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => {
            setIsFocused(true)
            if (searchResults.length > 0) setIsOpen(true)
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="搜索标签..."
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#2d3748] placeholder-gray-400 focus:outline-none focus:border-[#3182ce] transition-colors"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 z-50 max-h-80 overflow-y-auto">
          {searchResults.map((tag, index) => (
            <div
              key={tag.id}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => window.open(tag.url, '_blank')}
            >
              <div className="text-sm font-medium text-[#2d3748] truncate">
                {highlightText(tag.title)}
              </div>
              <div className="text-xs text-gray-400 truncate mt-0.5">
                {highlightText(tag.url)}
              </div>
              <div className="text-xs text-gray-300 mt-1">
                {moment(tag.savedAt).format('YYYY-MM-DD HH:mm')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
