import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Plus, Loader2, Flame } from 'lucide-react'
import type { Food, MealType } from '@/types'
import { useNutritionStore } from '@/store/useNutritionStore'
import { searchFoods } from '@/services/food-api'
import { cn } from '@/lib/utils'

const MEAL_TYPE_OPTIONS: Array<{ value: MealType; label: string; icon: string }> = [
  { value: 'breakfast', label: '早餐', icon: '🌅' },
  { value: 'lunch', label: '午餐', icon: '☀️' },
  { value: 'dinner', label: '晚餐', icon: '🌙' },
  { value: 'snack', label: '加餐', icon: '🍎' },
]

interface SelectedFoodModalProps {
  food: Food
  onClose: () => void
  onAdd: (foodId: string, amount: number, mealType: MealType) => void
}

function SelectedFoodModal({ food, onClose, onAdd }: SelectedFoodModalProps) {
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [amount, setAmount] = useState<string>('100')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const numAmount = parseFloat(amount) || 0
  const ratio = numAmount / 100
  const calcCalories = Math.round(food.calories * ratio)
  const calcProtein = Math.round(food.protein * ratio * 10) / 10
  const calcFat = Math.round(food.fat * ratio * 10) / 10
  const calcCarbs = Math.round(food.carbs * ratio * 10) / 10
  const calcFiber = Math.round(food.fiber * ratio * 10) / 10

  const handleAdd = async () => {
    if (numAmount <= 0) return
    setIsSubmitting(true)
    try {
      await onAdd(food.id, numAmount, mealType)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-3xl shadow-xl animate-slide-in-bottom sm:animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-surface-border">
          <h3 className="font-semibold text-gray-900 text-lg">添加食物</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50/50">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-3xl">
              🍽️
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">{food.name}</div>
              <div className="text-sm text-gray-500 mt-0.5">每100克营养成分</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-primary-600 font-bold">
                <Flame className="w-4 h-4" />
                {food.calories}
              </div>
              <div className="text-xs text-gray-400">kcal</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择餐次</label>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMealType(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border-2 transition-all duration-200',
                    mealType === opt.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-surface-border bg-white text-gray-600 hover:border-primary-200',
                  )}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">食用量（克）</label>
              <div className="text-xs text-gray-400">
                约 <span className="font-semibold text-primary-600">{calcCalories}</span> 千卡
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-surface-border text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
                min="1"
                step="1"
                placeholder="100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">g</span>
            </div>
            <div className="flex gap-2 mt-2">
              {[50, 100, 150, 200].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v.toString())}
                  className={cn(
                    'flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    amount === v.toString()
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {v}g
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-500 mb-3">预计摄入营养</div>
            <div className="grid grid-cols-5 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-gray-800">{calcCalories}</div>
                <div className="text-[10px] text-gray-500">kcal</div>
              </div>
              <div>
                <div className="text-lg font-bold text-nutrient-protein">{calcProtein}</div>
                <div className="text-[10px] text-gray-500">蛋白(g)</div>
              </div>
              <div>
                <div className="text-lg font-bold text-nutrient-fat">{calcFat}</div>
                <div className="text-[10px] text-gray-500">脂肪(g)</div>
              </div>
              <div>
                <div className="text-lg font-bold text-nutrient-carbs">{calcCarbs}</div>
                <div className="text-[10px] text-gray-500">碳水(g)</div>
              </div>
              <div>
                <div className="text-lg font-bold text-nutrient-fiber">{calcFiber}</div>
                <div className="text-[10px] text-gray-500">纤维(g)</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-surface-border bg-white">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              disabled={isSubmitting || numAmount <= 0}
              className="flex-[1.5] py-3 rounded-xl font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-card hover:shadow-card-hover"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isSubmitting ? '添加中...' : '添加'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FoodResultCardProps {
  food: Food
  onClick: () => void
}

function FoodResultCard({ food, onClick }: FoodResultCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative bg-white rounded-xl p-4 shadow-card border border-surface-border',
        'transition-all duration-300 ease-out cursor-pointer',
        'hover:shadow-card-hover hover:border-primary-400 hover:-translate-y-1',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-50 group-hover:bg-primary-100 transition-colors flex items-center justify-center text-2xl">
          🍽️
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
              {food.name}
            </h4>
            <div className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary-50 text-primary-600 text-xs font-bold">
              <Flame className="w-3 h-3" />
              {food.calories}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            <div className="text-center px-1.5 py-1 rounded-md bg-nutrient-protein/10">
              <div className="text-sm font-bold text-nutrient-protein">{food.protein}</div>
              <div className="text-[10px] text-gray-500">蛋白</div>
            </div>
            <div className="text-center px-1.5 py-1 rounded-md bg-nutrient-fat/10">
              <div className="text-sm font-bold text-nutrient-fat">{food.fat}</div>
              <div className="text-[10px] text-gray-500">脂肪</div>
            </div>
            <div className="text-center px-1.5 py-1 rounded-md bg-nutrient-carbs/10">
              <div className="text-sm font-bold text-nutrient-carbs">{food.carbs}</div>
              <div className="text-[10px] text-gray-500">碳水</div>
            </div>
            <div className="text-center px-1.5 py-1 rounded-md bg-nutrient-fiber/10">
              <div className="text-sm font-bold text-nutrient-fiber">{food.fiber}</div>
              <div className="text-[10px] text-gray-500">纤维</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 rounded-xl ring-2 ring-primary-400 ring-offset-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  )
}

export default function FoodSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Food[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { addFoodEntry, fetchTodayLogs } = useNutritionStore()

  const executeSearch = useCallback(async (searchQuery: string) => {
    setIsSearching(true)
    try {
      const data = await searchFoods(searchQuery)
      setResults(data)
    } catch (err) {
      console.error('Search failed:', err)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (query.trim().length === 0) {
      setResults([])
      setIsSearching(false)
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(query.trim())
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [query, executeSearch])

  const handleAdd = async (foodId: string, amount: number, mealType: MealType) => {
    await addFoodEntry(foodId, amount, mealType)
    await fetchTodayLogs()
  }

  const hasSearched = query.trim().length > 0

  return (
    <div className="w-full">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索食物，如：鸡胸肉、米饭、苹果..."
          className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white border-2 border-surface-border text-gray-900 placeholder:text-gray-400 shadow-card focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
        />
        {query.length > 0 && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-4">
        {isSearching && (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2 text-primary-500" />
            <span>搜索中...</span>
          </div>
        )}

        {!isSearching && !hasSearched && (
          <div className="text-center py-10 px-4">
            <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-3">
              <Search className="w-7 h-7 text-primary-400" />
            </div>
            <p className="text-gray-500 text-sm">输入食物名称开始搜索</p>
          </div>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <div className="text-center py-10 px-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <X className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">没有找到与 "{query}" 相关的食物</p>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2.5">
            {results.map((food) => (
              <FoodResultCard
                key={food.id}
                food={food}
                onClick={() => setSelectedFood(food)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedFood && (
        <SelectedFoodModal
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}
