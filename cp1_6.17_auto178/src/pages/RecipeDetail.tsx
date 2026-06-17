import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Flame, ShoppingCart } from 'lucide-react'
import { useRecipeStore } from '@/client/RecipeManager'
import { useGroceryStore } from '@/client/GroceryListGenerator'
import StepTimeline from '@/components/StepTimeline'

const difficultyMap: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

const difficultyColor: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
}

const categoryMap: Record<string, string> = {
  vegetable: '蔬菜',
  meat: '肉类',
  seasoning: '调料',
  other: '其他',
}

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentRecipe, fetchRecipeById } = useRecipeStore()
  const addFromRecipe = useGroceryStore((s) => s.addFromRecipe)

  useEffect(() => {
    if (id) fetchRecipeById(id)
  }, [id, fetchRecipeById])

  const handleAddToGrocery = () => {
    if (id) addFromRecipe(id)
  }

  if (!currentRecipe) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF8F0]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F4A460] border-t-transparent" />
      </div>
    )
  }

  const { name, author, prepTime, cookTime, difficulty, ingredients, steps } = currentRecipe

  return (
    <div className="min-h-screen animate-fadeIn bg-[#FFF8F0]">
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-[#8B4513] transition-colors hover:text-[#F4A460]"
        >
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>

        <div className="h-[300px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#F4A460] to-[#8B4513] shadow-lg" />

        <div className="mt-6">
          <h1 className="text-3xl font-bold text-[#8B4513]">{name}</h1>
          <p className="mt-1 text-[#8B4513]/70">by {author}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#8B4513]/80">
            <span className="flex items-center gap-1">
              <Clock size={16} />
              {prepTime}
            </span>
            <span className="flex items-center gap-1">
              <Flame size={16} />
              {cookTime}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${difficultyColor[difficulty]}`}>
              {difficultyMap[difficulty]}
            </span>
          </div>

          <button
            onClick={handleAddToGrocery}
            className="mt-6 flex items-center gap-2 rounded-xl bg-[#F4A460] px-6 py-3 font-medium text-white shadow-md transition-transform hover:scale-105 hover:bg-[#e09040] active:scale-95"
          >
            <ShoppingCart size={18} />
            加入杂货清单
          </button>
        </div>

        <div className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-[#8B4513]">食材</h2>
          <div className="flex flex-wrap gap-3">
            {ingredients.map((ing, i) => (
              <span
                key={i}
                className="rounded-full border border-[#F4A460]/30 bg-white px-4 py-2 text-sm text-[#8B4513] shadow-sm"
              >
                <span className="font-medium">{ing.name}</span>
                <span className="ml-1 text-[#8B4513]/60">{ing.amount}</span>
                <span className="ml-1 text-xs text-[#8B4513]/40">({categoryMap[ing.category]})</span>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="mb-4 text-xl font-bold text-[#8B4513]">烹饪步骤</h2>
          <StepTimeline steps={steps} />
        </div>
      </div>
    </div>
  )
}
