import { Link } from 'react-router-dom';
import { Clock, Flame } from 'lucide-react';
import type { Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
}

const difficultyLabel = { easy: '简单', medium: '中等', hard: '困难' } as const;
const difficultyColor = { easy: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', hard: 'bg-red-100 text-red-700' } as const;

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="group bg-warm-card rounded-2xl overflow-hidden shadow-sm border border-warm-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={recipe.thumbnail}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColor[recipe.difficulty]}`}>
          {difficultyLabel[recipe.difficulty]}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg text-warm-brown mb-1 truncate">{recipe.title}</h3>
        <p className="text-sm text-warm-brown-light line-clamp-2 mb-3">{recipe.description}</p>
        <div className="flex items-center justify-between text-xs text-warm-gray">
          <span className="flex items-center gap-1"><Clock size={14} /> {recipe.prepTime + recipe.cookTime}分钟</span>
          <span className="flex items-center gap-1"><Flame size={14} /> {recipe.avgRating.toFixed(1)}</span>
        </div>
      </div>
    </Link>
  );
}
