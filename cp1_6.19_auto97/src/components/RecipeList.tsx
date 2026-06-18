import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecipeCard } from './RecipeCard';
import { useRecipeStore } from '../store/useRecipeStore';

export function RecipeList() {
  const { getFilteredRecipes, searchQuery, cuisineFilter, difficultyFilter } = useRecipeStore();
  const filteredRecipes = useMemo(() => getFilteredRecipes(), [getFilteredRecipes, searchQuery, cuisineFilter, difficultyFilter]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="flex-1 overflow-auto">
      <AnimatePresence mode="wait">
        {filteredRecipes.length > 0 ? (
          <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4"
          >
            {filteredRecipes.map((recipe, index) => (
              <motion.div key={recipe.id} variants={itemVariants} layout>
                <RecipeCard recipe={recipe} index={index} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-64 text-[#7F8C8D]"
          >
            <p className="text-lg">没有找到匹配的菜谱</p>
            <p className="text-sm mt-2">试试其他搜索词或筛选条件</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
