import { useRecipeStore } from '../stores/recipeStore';
import { SolarTermIcon } from './SolarTermIcon';
import { Heart } from 'lucide-react';

export function NavBar() {
  const currentSolarTerm = useRecipeStore((state) => state.currentSolarTerm);
  const recipes = useRecipeStore((state) => state.recipes);
  const favorites = useRecipeStore((state) => state.favorites);

  const currentRecipe = recipes.find((r) => r.solarTerm === currentSolarTerm);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center"
      style={{
        height: '64px',
        backgroundColor: 'rgba(255, 247, 237, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(212, 201, 184, 0.3)',
      }}
    >
      <div className="flex items-center gap-3">
        {currentRecipe && (
          <SolarTermIcon
            icon={currentRecipe.solarTermIcon}
            color={currentRecipe.decorationColor}
            size={28}
          />
        )}
        <h1
          className="text-2xl font-bold tracking-wider"
          style={{
            fontFamily: '"Ma Shan Zheng", cursive',
            color: '#3D2914',
          }}
        >
          {currentSolarTerm}
        </h1>
        <span className="text-sm" style={{ color: '#8B7355' }}>
          · 时令美食
        </span>
      </div>

      <div
        className="absolute right-6 flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{ backgroundColor: 'rgba(229, 107, 93, 0.1)' }}
      >
        <Heart size={16} style={{ color: '#E56B5D', fill: '#E56B5D' }} />
        <span className="text-sm font-medium" style={{ color: '#E56B5D' }}>
          {favorites.length}
        </span>
      </div>
    </nav>
  );
}
