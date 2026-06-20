import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHeart, FaStar } from 'react-icons/fa';
import type { Recipe } from '../types/recipe';
import { useRecipeStore } from '../store/useRecipeStore';

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
}

export function RecipeCard({ recipe, index }: RecipeCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { favorites, toggleFavorite, selectRecipe, userRatings, rateRecipe } = useRecipeStore();
  
  const isFavorite = favorites.includes(recipe.id);
  const userRating = userRatings.find(r => r.recipeId === recipe.id)?.rating || 0;
  const displayRating = userRating || recipe.rating;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(recipe.id);
  };

  const handleCardClick = () => {
    selectRecipe(recipe);
  };

  const handleRatingClick = (e: React.MouseEvent, star: number) => {
    e.stopPropagation();
    rateRecipe(recipe.id, star);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="recipe-card bg-white rounded-[4px] border border-[#E0E0E0] cursor-pointer overflow-hidden flex flex-col"
      onClick={handleCardClick}
      style={{ height: '320px' }}
    >
      <div className="relative" style={{ height: '50%', overflow: 'hidden' }}>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[#F5F5F5] animate-pulse" />
        )}
        <img
          src={recipe.image}
          alt={recipe.name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm"
        >
          <motion.div
            animate={{ scale: isFavorite ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.4 }}
          >
            <FaHeart
              size={20}
              color={isFavorite ? '#E74C3C' : '#BDC3C7'}
              className="transition-colors duration-200"
            />
          </motion.div>
        </button>
        <div className="absolute bottom-2 left-2 flex gap-1">
          {recipe.tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-white/90 text-[#2C3E50] rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="p-3 flex flex-col flex-1">
        <h3
          className="text-center font-medium text-[#2C3E50] mb-1"
          style={{ fontSize: '18px' }}
        >
          {recipe.name}
        </h3>
        <p className="text-sm text-[#7F8C8D] text-center line-clamp-2 flex-1">
          {recipe.description}
        </p>
        
        <div className="flex items-center justify-center gap-1 mt-2" onClick={e => e.stopPropagation()}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={(e) => handleRatingClick(e, star)}
              className="p-0.5 hover:scale-110 transition-transform"
            >
              <FaStar
                size={16}
                color={star <= displayRating ? '#F39C12' : '#E0E0E0'}
              />
            </button>
          ))}
          <span className="ml-1 text-xs text-[#7F8C8D]">
            {displayRating.toFixed(1)}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {isFavorite && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute -top-1 -right-1 w-6 h-6 bg-[#E74C3C] rounded-full flex items-center justify-center"
          >
            <span className="text-white text-xs">+1</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
