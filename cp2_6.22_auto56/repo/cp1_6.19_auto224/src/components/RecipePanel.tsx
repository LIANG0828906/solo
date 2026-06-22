import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles, ChefHat } from 'lucide-react';
import RecipeCard from './RecipeCard';
import type { Recipe } from '@/types';

interface RecipePanelProps {
  recipes: Recipe[];
  loading: boolean;
  onSelectRecipe: (recipe: Recipe) => void;
  onRefresh: () => void;
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="w-[320px] overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/5"
    >
      <div className="h-3 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between">
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-16 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-5 w-12 animate-pulse rounded-full bg-gray-200" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded bg-gray-200" />
          ))}
        </div>
        <div className="h-10 w-full animate-pulse rounded-xl bg-gray-200" />
      </div>
    </motion.div>
  );
}

export default function RecipePanel({ recipes, loading, onSelectRecipe, onRefresh }: RecipePanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="flex h-screen flex-1 flex-col overflow-hidden"
    >
      <div className="border-b border-[var(--border)] bg-white/40 p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text)]">今日智能推荐</h2>
              <p className="text-xs text-gray-400">基于您的冰箱食材和口味偏好</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="ripple flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 active:scale-[0.97] disabled:opacity-50"
          >
            <RefreshCw className={'h-4 w-4 ' + (loading ? 'animate-spin' : '')} />
            刷新
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap justify-center gap-6"
            >
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} index={i} />
              ))}
            </motion.div>
          ) : recipes.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex h-full flex-col items-center justify-center py-20 text-center"
            >
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50">
                <ChefHat className="h-10 w-10 text-orange-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-600">暂无推荐食谱</h3>
              <p className="max-w-xs text-sm text-gray-400">
                请先在左侧添加冰箱食材，系统将为您智能匹配最合适的食谱
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="recipes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap justify-center gap-6"
            >
              {recipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onSelect={onSelectRecipe}
                  index={index}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
