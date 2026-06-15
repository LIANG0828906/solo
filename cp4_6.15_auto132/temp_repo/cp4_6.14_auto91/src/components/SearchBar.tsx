import { useState, KeyboardEvent } from 'react'

interface Props {
  onSearch?: (ingredients: string[]) => void
  placeholder?: string
  className?: string
}

export default function SearchBar({ onSearch, placeholder = '输入已有食材，按回车添加...' }: Props) {
  const [inputValue, setInputValue] = useState('')
  const [ingredients, setIngredients] = useState<string[]>([])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      const val = inputValue.trim()
      if (!ingredients.includes(val)) {
        const newIngredients = [...ingredients, val]
        setIngredients(newIngredients)
        onSearch?.(newIngredients)
      }
      setInputValue('')
    }
  }

  const removeIngredient = (ing: string) => {
    const newIngredients = ingredients.filter(i => i !== ing)
    setIngredients(newIngredients)
    onSearch?.(newIngredients)
  }

  const clearAll = () => {
    setIngredients([])
    onSearch?.([])
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: '20px',
        padding: '8px 16px',
        border: '1px solid #e2e8f0',
        transition: 'border-color 0.2s, box-shadow 0.2s'
      }}
        onFocus={() => { /* no-op */ }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            padding: '6px 10px',
            fontSize: '14px',
            color: '#334155'
          }}
        />
        {inputValue && (
          <button
            onClick={() => {
              if (inputValue.trim()) {
                const val = inputValue.trim()
                if (!ingredients.includes(val)) {
                  const newIngredients = [...ingredients, val]
                  setIngredients(newIngredients)
                  onSearch?.(newIngredients)
                }
                setInputValue('')
              }
            }}
            style={{
              backgroundColor: '#f97316',
              color: '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '14px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              flexShrink: 0
            }}
          >
            搜索
          </button>
        )}
      </div>

      {ingredients.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
          {ingredients.map((ing, idx) => (
            <span
              key={idx}
              onClick={() => removeIngredient(ing)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: '#e2e8f0',
                color: '#1e293b',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                animation: 'slide-in-left 0.3s ease-out'
              }}
            >
              {ing}
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>×</span>
            </span>
          ))}
          <button
            onClick={clearAll}
            style={{
              background: 'none',
              border: 'none',
              color: '#f97316',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            清空全部
          </button>
        </div>
      )}
    </div>
  )
}
