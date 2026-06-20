import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaLightbulb } from 'react-icons/fa';
import { useRecipeStore } from '../store/useRecipeStore';
import { getRecommendedRecipes } from '../utils/recommendation';

export function RecommendationPanel() {
  const { recipes, userRatings, favorites, selectRecipe } = useRecipeStore();

  const recommendedRecipes = useMemo(() => {
    return getRecommendedRecipes(recipes, userRatings, favorites, 4);
  }, [recipes, userRatings, favorites]);

  const handleRecipeClick = (recipe: typeof recipes[0]) => {
    selectRecipe(recipe);
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-[240px] flex-shrink-0 bg-white rounded-[10px] shadow-lg p-4 h-fit sticky top-4"
      style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <FaLightbulb color="#E67E22" size={20} />
        <h2 className="font-bold text-[#2C3E50]" style={{ fontSize: '22px' }}>
          为你推荐
        </h2>
      </div>

      <div className="space-y-3">
        {recommendedRecipes.map((recipe, index) => (
          <motion.div
            key={recipe.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-3 p-2 rounded-lg cursor-pointer hover:bg-[#FFF8E7] transition-colors"
            onClick={() => handleRecipeClick(recipe)}
            whileHover={{ scale: 1.02 }}
          >
            <img
              src={recipe.image}
              alt={recipe.name}
              className="object-cover rounded-md flex-shrink-0"
              style={{ width: '80px', height: '80px' }}
            />
            <div className="flex flex-col justify-between min-w-0">
              <div>
                <h3 className="font-medium text-[#2C3E50] truncate" style={{ fontSize: '14px' }}>
                  {recipe.name}
                </h3>
                <p className="text-xs text-[#7F8C8D] line-clamp-1 mt-1">
                  {recipe.description}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <FaStar size={12} color="#F39C12" />
                <span className="text-xs text-[#7F8C8D]">{recipe.rating.toFixed(1)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {favorites.length === 0 && userRatings.length === 0 && (
        <p className="text-xs text-[#BDC3C7] mt-4 text-center">
          评分和收藏越多，推荐越精准
        </p>
      )}
    </motion.aside>
  );
}
