import { useState, useRef, useCallback } from 'react'
import { Search } from 'lucide-react'
import { useRecipeStore } from '@/client/RecipeManager'

const cuisineOptions = [
  { label: '中餐', value: 'chinese' },
  { label: '西餐', value: 'western' },
  { label: '日料', value: 'japanese' },
]

function SearchBar() {
  const [focused, setFocused] = useState(false)
  const [localValue, setLocalValue] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchKeyword = useRecipeStore((s) => s.searchKeyword)
  const cuisineFilter = useRecipeStore((s) => s.cuisineFilter)
  const setSearchKeyword = useRecipeStore((s) => s.setSearchKeyword)
  const setCuisineFilter = useRecipeStore((s) => s.setCuisineFilter)

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setLocalValue(val)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setSearchKeyword(val)
      }, 250)
    },
    [setSearchKeyword]
  )

  const activeCuisine = cuisineFilter || searchKeyword ? cuisineFilter : ''

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative">
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-4 text-[#8B4513]/50" />
          <input
            type="text"
            value={localValue}
            onChange={handleInput}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="搜索菜谱、食材..."
            className="w-full h-11 pl-11 pr-4 rounded-full bg-white border border-[#e8ddd0] text-[#333] placeholder:text-[#bbb] outline-none text-sm transition-shadow duration-200 focus:shadow-[0_0_0_2px_rgba(244,164,96,0.2)]"
          />
        </div>
        <div
          className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full transition-all duration-300 origin-left"
          style={{
            background: 'linear-gradient(to right, #F4A460, #8B4513)',
            transform: focused ? 'scaleX(1)' : 'scaleX(0)',
          }}
        />
      </div>

      <div className="flex items-center gap-2 mt-3">
        {cuisineOptions.map(({ label, value }) => {
          const isActive = activeCuisine === value
          return (
            <button
              key={value}
              onClick={() => setCuisineFilter(isActive ? '' : value)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border"
              style={
                isActive
                  ? { backgroundColor: '#F4A460', borderColor: '#F4A460', color: '#fff' }
                  : { borderColor: '#e8ddd0', color: '#8B4513', backgroundColor: 'transparent' }
              }
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SearchBar
