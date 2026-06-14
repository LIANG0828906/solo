import { useEffect } from 'react';
import { useAppStore } from '@/shared/store';
import type { AppPage } from '@/shared/types';
import InventoryManager from '@/inventory/InventoryManager';
import RecipeRecommender from '@/recipes/RecipeRecommender';
import CookingGuide from '@/cooking/CookingGuide';
import { Package, ChefHat, CookingPot, Star, ShoppingCart } from 'lucide-react';

const NAV_ITEMS: { page: AppPage; label: string; icon: typeof Package }[] = [
  { page: 'inventory', label: '食材库', icon: Package },
  { page: 'recipes', label: '菜谱推荐', icon: ChefHat },
  { page: 'cooking', label: '烹饪引导', icon: CookingPot },
];

export default function App() {
  const currentPage = useAppStore((s) => s.currentPage);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const experiencePoints = useAppStore((s) => s.experiencePoints);
  const shoppingList = useAppStore((s) => s.shoppingList);
  const loadFromStorage = useAppStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'inventory':
        return <InventoryManager />;
      case 'recipes':
        return <RecipeRecommender />;
      case 'cooking':
        return <CookingGuide />;
      default:
        return <InventoryManager />;
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 font-sans">
      <nav className="sticky top-0 z-40 border-b border-wood-100 bg-cream-100/80 backdrop-blur-glass">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <CookingPot className="h-7 w-7 text-olive-500" />
              <span className="text-xl font-serif font-bold text-wood-700">厨房故事</span>
            </div>

            <div className="flex items-center gap-1">
              {NAV_ITEMS.map(({ page, label, icon: Icon }) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-olive-500 text-white shadow-md'
                      : 'text-wood-600 hover:bg-wood-100 hover:text-wood-800'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm text-wood-600">
                <Star size={16} className="text-olive-500" />
                <span>{experiencePoints}</span>
              </div>
              {shoppingList.length > 0 && (
                <div className="flex items-center gap-1 text-sm text-wood-600">
                  <ShoppingCart size={16} className="text-wood-400" />
                  <span>{shoppingList.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="pb-20 md:pb-8">{renderPage()}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-wood-100 bg-cream-100/90 backdrop-blur-glass md:hidden">
        <div className="flex items-center justify-around py-2">
          {NAV_ITEMS.map(({ page, label, icon: Icon }) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-medium transition-colors ${
                currentPage === page
                  ? 'text-olive-500'
                  : 'text-wood-400'
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
