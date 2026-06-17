import { useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart } from 'lucide-react'
import { useGroceryStore } from '@/client/GroceryListGenerator'

interface RecipeCardProps {
  recipe: {
    id: string
    name: string
    coverImage: string
    author: string
    likes: number
    cuisine: 'chinese' | 'western' | 'japanese'
    difficulty: 'easy' | 'medium' | 'hard'
  }
}

const cuisineGradients: Record<string, string> = {
  chinese: 'linear-gradient(135deg, #e53e3e, #ed8936)',
  western: 'linear-gradient(135deg, #4299e1, #9f7aea)',
  japanese: 'linear-gradient(135deg, #ed64a6, #38b2ac)',
}

const difficultyLabels: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

const difficultyColors: Record<string, string> = {
  easy: '#48bb78',
  medium: '#F4A460',
  hard: '#e53e3e',
}

function RecipeCard({ recipe }: RecipeCardProps) {
  const navigate = useNavigate()
  const addFromRecipe = useGroceryStore((s) => s.addFromRecipe)

  return (
    <div
      onClick={() => navigate(`/recipe/${recipe.id}`)}
      className="group w-80 max-w-[320px] rounded-xl bg-white shadow-md hover:shadow-lg cursor-pointer animate-[fadeSlideIn_0.4s_ease-out_both]"
      style={{ transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out' }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div
        className="w-full h-[180px] rounded-t-xl"
        style={{ background: cuisineGradients[recipe.cuisine] }}
      >
        {recipe.coverImage && (
          <img
            src={recipe.coverImage}
            alt={recipe.name}
            className="w-full h-full object-cover rounded-t-xl"
          />
        )}
      </div>

      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-800 truncate">{recipe.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{recipe.author}</p>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Heart size={14} className="text-red-400" />
              {recipe.likes}
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: difficultyColors[recipe.difficulty] }}
            >
              {difficultyLabels[recipe.difficulty]}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              addFromRecipe(recipe.id)
            }}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-full border border-[#F4A460] text-[#F4A460] hover:bg-[#F4A460] hover:text-white transition-colors"
          >
            <ShoppingCart size={13} />
            加入清单
          </button>
        </div>
      </div>
    </div>
  )
}

export default RecipeCard
