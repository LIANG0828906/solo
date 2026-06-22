import { Star, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Recipe } from '@/state/appStore';
import { Link, useParams } from 'react-router-dom';
import StarRating from './StarRating';

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: (recipe: Recipe) => void;
  className?: string;
  gradientIndex?: 1 | 2 | 3 | 4 | 5;
  index?: number;
}

const GRADIENT_CLASSES = {
  1: 'recipe-gradient-1',
  2: 'recipe-gradient-2',
  3: 'recipe-gradient-3',
  4: 'recipe-gradient-4',
  5: 'recipe-gradient-5',
} as const;

export default function RecipeCard({
  recipe,
  onClick,
  className,
  gradientIndex,
  index,
}: RecipeCardProps) {
  const { inviteCode = 'demo' } = useParams<{ inviteCode: string }>();
  const baseIdx = index !== undefined ? (index % 5) + 1 : (Number(recipe.id.replace(/\D/g, '').slice(-1)) || 1) % 5 + 1;
  const gradient = (gradientIndex ?? baseIdx) as 1 | 2 | 3 | 4 | 5;
  const gradientClass = GRADIENT_CLASSES[gradient];

  const handleClick = () => {
    onClick?.(recipe);
  };

  return (
    <Link
      to={`/room/${inviteCode}/recipes/${recipe.id}`}
      onClick={handleClick}
      className={cn(
        'group card card-hover overflow-hidden flex flex-col',
        index !== undefined && 'animate-fade-in',
        className
      )}
      style={index !== undefined ? { animationDelay: `${index * 40}ms` } : undefined}
    >
      <div className={cn('relative h-40 w-full overflow-hidden', gradientClass)}>
        {recipe.thumbnail ? (
          <img
            src={recipe.thumbnail}
            alt={recipe.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-display text-6xl text-white/30 drop-shadow-sm">
              {recipe.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">
          <Clock className="h-3.5 w-3.5 text-primary" />
          {recipe.cookTimeMinutes}分钟
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg text-gray-800 group-hover:text-primary transition-colors line-clamp-1">
            {recipe.name}
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {recipe.mainIngredients.slice(0, 3).map((ing) => (
            <span
              key={ing}
              className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700"
            >
              {ing}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            {recipe.author?.avatarUrl ? (
              <img
                src={recipe.author.avatarUrl}
                alt={recipe.author.nickname}
                className="h-6 w-6 rounded-full border border-white shadow-sm object-cover"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                <User className="h-3.5 w-3.5 text-gray-400" />
              </div>
            )}
            <span className="text-xs text-gray-500">{recipe.author?.nickname}</span>
          </div>

          <div className="flex items-center gap-1">
            <StarRating value={recipe.avgRating} size="sm" readOnly />
            <span className="ml-1 text-xs font-medium text-gray-600">
              {recipe.avgRating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
