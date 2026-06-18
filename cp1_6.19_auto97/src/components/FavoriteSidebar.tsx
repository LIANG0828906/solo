import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaHeart } from 'react-icons/fa';
import { useRecipeStore } from '../store/useRecipeStore';

export function FavoriteSidebar() {
  const { showFavorites, toggleShowFavorites, getFavoriteRecipes, selectRecipe, toggleFavorite } = useRecipeStore();
  const favoriteRecipes = getFavoriteRecipes();

  const handleRecipeClick = (recipe: typeof favoriteRecipes[0]) => {
    selectRecipe(recipe);
    toggleShowFavorites();
  };

  const handleRemoveFavorite = (e: React.MouseEvent, recipeId: string) => {
    e.stopPropagation();
    toggleFavorite(recipeId);
  };

  return (
    <>
      <AnimatePresence>
        {showFavorites && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 z-40 md:hidden"
              onClick={toggleShowFavorites}
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, type: 'tween', ease: 'easeOut' }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50 flex flex-col rounded-l-[10px] md:rounded-[10px] md:top-4 md:bottom-4 md:right-4 md:w-80 md:h-auto"
              style={{
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                ...(window.innerWidth >= 768 ? { top: '1rem', bottom: '1rem', right: '1rem', width: '320px' } : {}),
              }}
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E0E0E0]">
                <div className="flex items-center gap-2">
                  <FaHeart color="#E74C3C" size={20} />
                  <h2 className="font-bold text-[#2C3E50] text-lg">我的收藏</h2>
                  <span className="px-2 py-0.5 text-xs bg-[#FDF0EF] text-[#E74C3C] rounded-full">
                    {favoriteRecipes.length}
                  </span>
                </div>
                <button
                  onClick={toggleShowFavorites}
                  className="p-2 hover:bg-[#F8F9FA] rounded-full transition-colors"
                >
                  <FaTimes color="#7F8C8D" size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {favoriteRecipes.length > 0 ? (
                  <div className="space-y-3">
                    {favoriteRecipes.map((recipe, index) => (
                      <motion.div
                        key={recipe.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-3 p-3 rounded-lg bg-[#F8F9FA] cursor-pointer hover:bg-[#FFF8E7] transition-colors group"
                        onClick={() => handleRecipeClick(recipe)}
                      >
                        <img
                          src={recipe.image}
                          alt={recipe.name}
                          className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#2C3E50] text-sm truncate">
                            {recipe.name}
                          </h3>
                          <p className="text-xs text-[#7F8C8D] line-clamp-1 mt-1">
                            {recipe.description}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <div
                                key={star}
                                className="w-2.5 h-2.5"
                                style={{
                                  backgroundColor: star <= recipe.rating ? '#F39C12' : '#E0E0E0',
                                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleRemoveFavorite(e, recipe.id)}
                          className="opacity-0 group-hover:opacity-100 self-start p-1 hover:bg-white rounded transition-opacity"
                        >
                          <FaTimes color="#BDC3C7" size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-[#BDC3C7]">
                    <FaHeart size={48} className="mb-3 opacity-30" />
                    <p className="text-sm">还没有收藏任何菜谱</p>
                    <p className="text-xs mt-1">点击菜谱卡片上的心形按钮收藏</p>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
