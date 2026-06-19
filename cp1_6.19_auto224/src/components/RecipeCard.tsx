import { motion } from 'framer-motion';
import { Clock, Star } from 'lucide-react';
import type { Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  index?: number;
}

function DifficultyStars({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={
            'h-3.5 w-3.5 ' +
            (i <= level ? 'fill-amber-400 text-amber-400' : 'text-gray-300')
          }
        />
      ))}
    </div>
  );
}

export default function RecipeCard({ recipe, onSelect, index = 0 }: RecipeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      transition={{ duration: 0.3, delay: index * 0.1, ease: 'easeOut' }}
      className="flex w-[320px] flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/5"
    >
      <div className="relative h-3 bg-gradient-to-r from-green-400 via-green-500 to-emerald-500" />

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-tight text-[var(--text)]">{recipe.name}</h3>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-black text-[var(--primary)] leading-none">
              {recipe.matchScore}
            </span>
            <span className="mt-0.5 text-[10px] font-medium text-gray-400">匹配度%</span>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span>{recipe.time}分钟</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DifficultyStars level={recipe.difficulty} />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {recipe.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-[var(--primary)]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mb-5 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            所需食材
          </div>
          {recipe.ingredients.slice(0, 3).map((ing) => (
            <div key={ing.name} className="flex items-center justify-between text-xs text-gray-600">
              <span className="truncate">{ing.name}</span>
              <span className="ml-2 flex-shrink-0 text-gray-400">
                {ing.quantity}{ing.unit}
              </span>
            </div>
          ))}
          {recipe.ingredients.length > 3 && (
            <div className="text-[11px] text-gray-400">
              +{recipe.ingredients.length - 3} 项更多...
            </div>
          )}
        </div>

        <button
          onClick={() => onSelect(recipe)}
          className="ripple mt-auto w-full rounded-xl bg-[var(--secondary)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#FB8C00] active:scale-[0.98]"
        >
          选择此食谱
        </button>
      </div>
    </motion.div>
  );
}
