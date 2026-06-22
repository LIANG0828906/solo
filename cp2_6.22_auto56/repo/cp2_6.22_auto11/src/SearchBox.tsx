import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './SearchBox.css'

interface SearchBoxProps {
  placeholder?: string
  showIngredientMode?: boolean
  onSearch?: (query: string) => void
  initialValue?: string
}

const COMMON_INGREDIENTS = [
  '鸡蛋', '番茄', '土豆', '牛肉', '猪肉', '鸡肉',
  '豆腐', '青椒', '洋葱', '胡萝卜', '白菜', '菠菜',
  '米饭', '面条', '面粉', '牛奶', '黄油', '芝士',
  '苹果', '香蕉', '草莓', '芒果', '柠檬', '蜂蜜',
]

export default function SearchBox({
  placeholder = '搜索食谱、食材、标签...',
  showIngredientMode = false,
  onSearch,
  initialValue = '',
}: SearchBoxProps) {
  const [query, setQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)
  const [ingredients, setIngredients] = useState<string[]>([])
  const [ingredientInput, setIngredientInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      if (searchQuery.trim()) {
        const filtered = COMMON_INGREDIENTS.filter((item) =>
          item.includes(searchQuery)
        ).slice(0, 8)
        setSuggestions(filtered)
        setShowSuggestions(true)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
      setIsTyping(false)
    }, 200),
    []
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsTyping(true)
    setSelectedSuggestionIndex(-1)
    debouncedSearch(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedSuggestionIndex])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    handleSearchWithQuery(suggestion)
  }

  const handleSearch = () => {
    if (query.trim()) {
      handleSearchWithQuery(query.trim())
    }
  }

  const handleSearchWithQuery = (searchQuery: string) => {
    if (onSearch) {
      onSearch(searchQuery)
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
    setShowSuggestions(false)
  }

  const handleAddIngredient = (ingredient: string) => {
    if (ingredient.trim() && !ingredients.includes(ingredient.trim())) {
      setIngredients([...ingredients, ingredient.trim()])
    }
    setIngredientInput('')
    setShowSuggestions(false)
  }

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleMatchRecipes = () => {
    if (ingredients.length > 0) {
      const queryStr = ingredients.join(',')
      navigate(`/search?ingredients=${encodeURIComponent(queryStr)}`)
    }
  }

  return (
    <div ref={containerRef} className={`search-box-container ${isFocused ? 'focused' : ''}`}>
      {!showIngredientMode ? (
        <div className="search-input-wrapper">
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true)
              if (query && suggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={`search-input ${isTyping ? 'typing' : ''}`}
            autoComplete="off"
          />
          {query && (
            <button
              className="clear-button"
              onClick={() => {
                setQuery('')
                setSuggestions([])
                inputRef.current?.focus()
              }}
            >
              ×
            </button>
          )}
          <button className="search-button" onClick={handleSearch}>
            搜索
          </button>

          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  className={`suggestion-item ${
                    index === selectedSuggestionIndex ? 'selected' : ''
                  }`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                >
                  <svg
                    className="suggestion-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="suggestion-text">{suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="ingredient-search-wrapper">
          <div className="ingredients-tags">
            {ingredients.map((ing, index) => (
              <span key={index} className="ingredient-tag">
                {ing}
                <button
                  className="remove-ingredient-btn"
                  onClick={() => handleRemoveIngredient(index)}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={ingredientInput}
              onChange={(e) => {
                setIngredientInput(e.target.value)
                setIsTyping(true)
                debouncedSearch(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && ingredientInput.trim()) {
                  e.preventDefault()
                  handleAddIngredient(ingredientInput)
                }
              }}
              onFocus={() => {
                setIsFocused(true)
                if (ingredientInput && suggestions.length > 0) {
                  setShowSuggestions(true)
                }
              }}
              onBlur={() => setIsFocused(false)}
              placeholder={ingredients.length === 0 ? '输入冰箱里的食材...' : ''}
              className="ingredient-input"
            />
          </div>
          <button
            className="match-button"
            onClick={handleMatchRecipes}
            disabled={ingredients.length === 0}
          >
            匹配食谱
          </button>
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions-dropdown ingredient-suggestions">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion}
                  className={`suggestion-item ${
                    index === selectedSuggestionIndex ? 'selected' : ''
                  }`}
                  onClick={() => handleAddIngredient(suggestion)}
                  onMouseEnter={() => setSelectedSuggestionIndex(index)}
                >
                  <span className="suggestion-text">+ 添加 {suggestion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}
