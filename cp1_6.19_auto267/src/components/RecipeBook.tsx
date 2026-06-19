import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store';
import { RECIPES, MATERIAL_INFO } from '../data/recipes';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export const RecipeBook: React.FC = () => {
  const { showRecipeBook, toggleRecipeBook, currentPage, setCurrentPage, unlockedRecipes } =
    useGameStore();

  const recipesPerPage = 4;
  const totalPages = Math.ceil(RECIPES.length / recipesPerPage);
  const currentRecipes = RECIPES.slice(
    currentPage * recipesPerPage,
    (currentPage + 1) * recipesPerPage
  );

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <AnimatePresence>
      {showRecipeBook && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={toggleRecipeBook}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative z-10 w-full max-w-2xl"
            initial={{ scale: 0.8, opacity: 0, rotateY: -15 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.8, opacity: 0, rotateY: 15 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={toggleRecipeBook}
              className="absolute -top-3 -right-3 z-20 w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-lg hover:bg-amber-700 transition-colors"
            >
              <X size={20} />
            </button>

            {/* 书本封面/书页效果 */}
            <div
              className="relative rounded-lg overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #5D4037 0%, #3E2723 100%)',
                padding: '8px',
              }}
            >
              {/* 书页 */}
              <div
                className="relative rounded-md p-6 min-h-[500px]"
                style={{
                  background:
                    'linear-gradient(to right, #F5DEB3 0%, #FFF8DC 5%, #FFF8DC 95%, #F5DEB3 100%)',
                  boxShadow: 'inset 0 0 30px rgba(139, 90, 43, 0.2)',
                }}
              >
                {/* 标题 */}
                <h2
                  className="text-center text-2xl font-bold mb-6 pb-4 border-b-2 border-amber-800/30"
                  style={{
                    color: '#5D4037',
                    fontFamily: 'serif',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                  }}
                >
                  📜 配方图鉴
                </h2>

                {/* 页码指示 */}
                <div className="text-center text-amber-800/60 text-sm mb-4">
                  第 {currentPage + 1} / {totalPages} 页
                </div>

                {/* 配方卡片网格 */}
                <div className="grid grid-cols-2 gap-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPage}
                      className="contents"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {currentRecipes.map((recipe) => {
                        const isUnlocked = unlockedRecipes.includes(recipe.id);

                        return (
                          <motion.div
                            key={recipe.id}
                            className="relative rounded-lg p-4 border-2 transition-all"
                            style={{
                              background: isUnlocked
                                ? 'linear-gradient(135deg, #FFE4B5 0%, #FFDAB9 100%)'
                                : 'linear-gradient(135deg, #D7CCC8 0%, #BCAAA4 100%)',
                              borderColor: isUnlocked ? '#8D6E63' : '#795548',
                              boxShadow: isUnlocked
                                ? '0 4px 12px rgba(139, 69, 19, 0.2)'
                                : 'inset 0 0 20px rgba(0,0,0,0.1)',
                            }}
                            whileHover={isUnlocked ? { scale: 1.02, y: -2 } : {}}
                          >
                            {isUnlocked ? (
                              <>
                                <div className="flex items-start gap-3">
                                  <div
                                    className="w-12 h-16 rounded-b-full rounded-t-sm flex-shrink-0 relative overflow-hidden border border-amber-700/30"
                                    style={{
                                      background: recipe.potionGradient,
                                      boxShadow: `0 0 10px ${recipe.potionColor}40`,
                                    }}
                                  >
                                    <div className="absolute top-1 left-1 w-1.5 h-8 rounded-full bg-white/30" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3
                                      className="font-bold text-amber-900 text-sm mb-1"
                                      style={{ fontFamily: 'serif' }}
                                    >
                                      {recipe.name}
                                    </h3>
                                    <p className="text-amber-800/70 text-xs mb-2 line-clamp-2">
                                      {recipe.effect}
                                    </p>
                                    <div className="flex gap-1 flex-wrap">
                                      {recipe.materials.map((mat, i) => {
                                        const info = MATERIAL_INFO[mat];
                                        return (
                                          <div
                                            key={i}
                                            className="w-5 h-5 rounded-full border border-amber-700/30"
                                            style={{
                                              background: info.gradient,
                                            }}
                                            title={info.name}
                                          />
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 pt-2 border-t border-amber-700/20 text-xs text-amber-800/60">
                                  温度: {recipe.optimalTemp.min}-{recipe.optimalTemp.max}°C |
                                  搅拌: {recipe.optimalStir.min}-{recipe.optimalStir.max}
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-6 text-amber-900/40">
                                <div className="text-4xl mb-2">❓</div>
                                <p className="text-sm font-medium">未解锁</p>
                                <p className="text-xs mt-1">成功合成更多药水以解锁</p>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* 翻页按钮 */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-between px-6">
                  <motion.button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className="w-10 h-10 rounded-full bg-amber-700 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-800 transition-colors shadow-md"
                    whileHover={currentPage > 0 ? { scale: 1.1 } : {}}
                    whileTap={currentPage > 0 ? { scale: 0.9 } : {}}
                  >
                    <ChevronLeft size={20} />
                  </motion.button>
                  <motion.button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1}
                    className="w-10 h-10 rounded-full bg-amber-700 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-800 transition-colors shadow-md"
                    whileHover={currentPage < totalPages - 1 ? { scale: 1.1 } : {}}
                    whileTap={currentPage < totalPages - 1 ? { scale: 0.9 } : {}}
                  >
                    <ChevronRight size={20} />
                  </motion.button>
                </div>

                {/* 进度显示 */}
                <div className="absolute bottom-16 left-0 right-0 text-center">
                  <span className="text-amber-800/50 text-xs">
                    已解锁 {unlockedRecipes.length} / {RECIPES.length} 个配方
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
