import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { Recipe } from '@/types';
import { useLazyImage } from '@/hooks/useLazyImage';

interface RecipeCardProps {
  recipe: Recipe;
  matchScore?: number;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, matchScore }) => {
  const { imgRef, imageSrc, isLoaded } = useLazyImage(recipe.coverImage);

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="group block break-inside-avoid mb-4"
    >
      <div
        ref={imgRef}
        className="relative bg-white rounded-2xl overflow-hidden shadow-md transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-orange-200/50"
      >
        <div className="relative overflow-hidden">
          {!isLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-amber-50 animate-pulse" />
          )}
          {imageSrc && (
            <img
              src={imageSrc}
              alt={recipe.title}
              className={`w-full object-cover transition-all duration-500 group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ aspectRatio: '4/3' }}
              loading="lazy"
            />
          )}
          {matchScore !== undefined && (
            <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              匹配度 {Math.round(matchScore * 100)}%
            </div>
          )}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-md">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-sm font-medium text-stone-700">{recipe.rating}</span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-stone-800 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors" style={{ fontFamily: "'Playfair Display', serif" }}>
            {recipe.title}
          </h3>

          <p className="text-sm text-stone-500 mb-3 line-clamp-2">
            {recipe.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {recipe.authorAvatar ? (
                <img
                  src={recipe.authorAvatar}
                  alt={recipe.authorName}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-xs text-orange-600 font-medium">
                    {recipe.authorName.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-xs text-stone-500">{recipe.authorName}</span>
            </div>

            <div className="flex items-center gap-1 text-stone-400">
              <Heart className="w-4 h-4" />
              <span className="text-xs">{recipe.favoriteCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
