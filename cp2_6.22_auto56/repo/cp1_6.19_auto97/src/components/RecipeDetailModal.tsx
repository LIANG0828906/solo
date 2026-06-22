import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaStar, FaClock, FaHeart, FaUtensils, FaListOl } from 'react-icons/fa';
import { useRecipeStore } from '../store/useRecipeStore';

export function RecipeDetailModal() {
  const { selectedRecipe, selectRecipe, toggleFavorite, favorites, rateRecipe, userRatings, addComment } = useRecipeStore();
  const [commentText, setCommentText] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);

  const isFavorite = selectedRecipe ? favorites.includes(selectedRecipe.id) : false;
  const userRating = selectedRecipe
    ? userRatings.find(r => r.recipeId === selectedRecipe.id)?.rating || 0
    : 0;

  const handleClose = () => {
    selectRecipe(null);
  };

  useEffect(() => {
    if (selectedRecipe) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedRecipe]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedRecipe) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecipe]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleFavoriteClick = () => {
    if (selectedRecipe) {
      toggleFavorite(selectedRecipe.id);
    }
  };

  const handleRatingClick = (star: number) => {
    if (selectedRecipe) {
      rateRecipe(selectedRecipe.id, star);
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() && selectedRecipe) {
      addComment(selectedRecipe.id, commentText.trim());
      setCommentText('');
    }
  };

  if (!selectedRecipe) return null;

  const displayRating = userRating || selectedRecipe.rating;

  const difficultyLabels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };

  const cuisineLabels: Record<string, string> = {
    chinese: '中餐',
    western: '西餐',
    japanese: '日料',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2, type: 'spring', damping: 25 }}
          className="bg-white rounded-[10px] overflow-hidden flex flex-col relative"
          style={{ width: '60%', maxWidth: '900px', maxHeight: '80vh' }}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <FaTimes color="#2C3E50" size={20} />
          </button>

          <div className="relative h-64 flex-shrink-0">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-[#F5F5F5] animate-pulse" />
            )}
            <img
              src={selectedRecipe.image}
              alt={selectedRecipe.name}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <h2 className="text-2xl font-bold text-white mb-2">{selectedRecipe.name}</h2>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-1">
                  <FaClock size={14} />
                  <span className="text-sm">{selectedRecipe.cookTime}分钟</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaUtensils size={14} />
                  <span className="text-sm">{cuisineLabels[selectedRecipe.cuisine]}</span>
                </div>
                <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">
                  {difficultyLabels[selectedRecipe.difficulty]}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => handleRatingClick(star)}
                    className="hover:scale-110 transition-transform"
                  >
                    <FaStar
                      size={24}
                      color={star <= displayRating ? '#F39C12' : '#E0E0E0'}
                    />
                  </button>
                ))}
                <span className="ml-2 text-[#7F8C8D]">
                  {displayRating.toFixed(1)} 分
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFavoriteClick}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors"
                style={{
                  borderColor: isFavorite ? '#E74C3C' : '#E0E0E0',
                  color: isFavorite ? '#E74C3C' : '#7F8C8D',
                  backgroundColor: isFavorite ? '#FDF0EF' : 'white',
                }}
              >
                <motion.div
                  animate={{ scale: isFavorite ? [1, 1.3, 1] : 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <FaHeart size={18} />
                </motion.div>
                <span className="text-sm font-medium">
                  {isFavorite ? '已收藏' : '收藏'}
                </span>
              </motion.button>
            </div>

            <p className="text-[#7F8C8D] mb-6">{selectedRecipe.description}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {selectedRecipe.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm bg-[#FFF8E7] text-[#E67E22] rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#2C3E50] mb-3 flex items-center gap-2">
                <FaListOl color="#E67E22" />
                食材清单
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {selectedRecipe.ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-[#F8F9FA] rounded-lg"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#E67E22]" />
                    <span className="text-sm text-[#2C3E50]">{ingredient}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-[#2C3E50] mb-3 flex items-center gap-2">
                <FaListOl color="#E67E22" />
                烹饪步骤
              </h3>
              <ol className="space-y-4">
                {selectedRecipe.steps.map((step, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#E67E22] text-white text-sm flex items-center justify-center font-medium">
                      {index + 1}
                    </div>
                    <p className="text-[#2C3E50] leading-relaxed pt-0.5">{step}</p>
                  </motion.li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#2C3E50] mb-3">评论</h3>

              <form onSubmit={handleSubmitComment} className="mb-4">
                <div className="relative">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value.slice(0, 200))}
                    placeholder="分享你的烹饪心得..."
                    className="w-full p-3 border border-[#E0E0E0] rounded-lg resize-none focus:outline-none focus:border-[#E67E22] transition-colors"
                    rows={3}
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-[#BDC3C7]">
                    {commentText.length}/200
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="mt-2 px-4 py-2 bg-[#E67E22] text-white rounded-lg text-sm font-medium hover:bg-[#D35400] transition-colors disabled:bg-[#BDC3C7] disabled:cursor-not-allowed"
                >
                  发表评论
                </button>
              </form>

              <div className="space-y-3">
                <AnimatePresence>
                  {selectedRecipe.comments.map((comment, index) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="p-3 bg-[#F8F9FA] rounded-lg"
                    >
                      <p className="text-[#2C3E50] text-sm">{comment.text}</p>
                      <p className="text-xs text-[#BDC3C7] mt-1">
                        {new Date(comment.timestamp).toLocaleDateString('zh-CN')}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {selectedRecipe.comments.length === 0 && (
                  <p className="text-center text-[#BDC3C7] text-sm py-4">
                    暂无评论，来发表第一条评论吧~
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
