import { useState } from 'react'
import { Trash2, Check, X } from 'lucide-react'
import type { FoodLogEntry, MealType } from '@/types'
import { cn } from '@/lib/utils'

interface MealDetailProps {
  entry: FoodLogEntry
  showAnimation?: boolean
  onDelete: (id: string) => void
  onUpdate?: (id: string, amount: number, mealType: MealType) => void
}

const FOOD_EMOJI_MAP: Array<{ keywords: string[]; emoji: string; category: string }> = [
  { keywords: ['鸡', '肉', '牛', '猪', '羊', '鸭', '鹅', '里脊', '胸', '腿', '排', '肝'], emoji: '🍗', category: '肉' },
  { keywords: ['鱼', '虾', '蟹', '贝', '海鲜', '鱿', '带', '鳕', '三文'], emoji: '🐟', category: '鱼' },
  { keywords: ['菜', '菠', '白', '青', '油麦', '生', '黄瓜', '番茄', '茄', '豆', '辣椒', '胡萝卜', '萝卜', '洋葱', '蒜', '葱', '姜', '芹', '香菜', '韭菜'], emoji: '🥬', category: '菜' },
  { keywords: ['苹果', '香蕉', '橙', '葡萄', '西瓜', '草莓', '桃', '梨', '芒', '菠萝', '蓝莓', '樱桃', '猕猴', '柚', '柠檬', '李', '枣'], emoji: '🍎', category: '果' },
  { keywords: ['米', '饭', '面', '包', '馒', '饼', '粥', '麦', '燕麦', '玉米', '红薯', '土豆', '山', '糙', '糯'], emoji: '🍚', category: '谷' },
  { keywords: ['奶', '牛奶', '酸奶', '奶酪', '芝士', '奶', '黄', '蛋'], emoji: '🥛', category: '奶' },
  { keywords: ['豆', '腐', '豆花', '豆浆', '黄豆', '绿豆'], emoji: '🫘', category: '豆' },
  { keywords: ['油', '酱', '盐', '糖', '醋', '胡椒', '调料'], emoji: '🧂', category: '调' },
  { keywords: ['坚果', '核桃', '杏仁', '花生', '瓜子', '腰果'], emoji: '🥜', category: '坚果' },
  { keywords: ['蛋', '鸡蛋', '鸭蛋', '鹌鹑'], emoji: '🥚', category: '蛋' },
]

function getFoodEmoji(name: string): string {
  for (const item of FOOD_EMOJI_MAP) {
    if (item.keywords.some((k) => name.includes(k))) {
      return item.emoji
    }
  }
  return '🍽️'
}

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}

export default function MealDetail({ entry, showAnimation, onDelete, onUpdate }: MealDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState(entry.amount.toString())
  const [editMealType, setEditMealType] = useState<MealType>(entry.mealType)

  const handleSave = () => {
    const numAmount = parseFloat(editAmount)
    if (!isNaN(numAmount) && numAmount > 0 && onUpdate) {
      onUpdate(entry.id, numAmount, editMealType)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditAmount(entry.amount.toString())
    setEditMealType(entry.mealType)
    setIsEditing(false)
  }

  return (
    <div
      className={cn(
        'group relative bg-white rounded-xl p-3 sm:p-4 shadow-card border border-surface-border',
        'transition-all duration-300 ease-out cursor-pointer',
        'hover:shadow-card-hover hover:border-primary-300 hover:-translate-y-0.5',
        showAnimation && 'animate-slide-in-bottom',
      )}
      onClick={() => !isEditing && onUpdate && setIsEditing(true)}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl sm:text-3xl">
          {getFoodEmoji(entry.foodName)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-semibold text-gray-900 truncate">{entry.foodName}</span>
            <span className="text-xs sm:text-sm text-gray-400 flex-shrink-0">{entry.amount}g</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-nutrient-protein/10 text-[10px] sm:text-xs text-nutrient-protein font-medium">
              P {entry.protein}g
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-nutrient-fat/10 text-[10px] sm:text-xs text-nutrient-fat font-medium">
              F {entry.fat}g
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-nutrient-carbs/10 text-[10px] sm:text-xs text-nutrient-carbs font-medium">
              C {entry.carbs}g
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-100 text-[10px] sm:text-xs text-gray-600 font-medium">
              {entry.calories}kcal
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(entry.id)
          }}
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
            'text-gray-400 hover:text-white hover:bg-red-500',
            'transition-all duration-200',
          )}
          aria-label="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {isEditing && (
        <div className="mt-3 pt-3 border-t border-surface-border animate-fade-in">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">克数</label>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                min="1"
                step="1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">餐次</label>
              <select
                value={editMealType}
                onChange={(e) => setEditMealType(e.target.value as MealType)}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 rounded-lg border border-surface-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white"
              >
                {Object.entries(MEAL_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleCancel()
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              取消
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSave()
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
