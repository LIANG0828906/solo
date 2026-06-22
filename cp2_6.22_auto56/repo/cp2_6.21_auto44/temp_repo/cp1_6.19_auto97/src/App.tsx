import { FaHeart } from 'react-icons/fa';
import { useRecipeStore } from './store/useRecipeStore';
import { RecommendationPanel } from './components/RecommendationPanel';
import { SearchFilterBar } from './components/SearchFilterBar';
import { RecipeList } from './components/RecipeList';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { FavoriteSidebar } from './components/FavoriteSidebar';

export default function App() {
  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: '#FFF8E7' }}
    >
      <div className="hidden md:block p-4">
        <RecommendationPanel />
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        <SearchFilterBar />
        <RecipeList />
      </div>

      <RecipeDetailModal />
      <FavoriteSidebar />

      <div className="md:hidden fixed bottom-4 right-4 z-30">
        <MobileFavoriteButton />
      </div>
    </div>
  );
}

function MobileFavoriteButton() {
  const { toggleShowFavorites, favorites } = useRecipeStore();
  
  return (
    <button
      onClick={toggleShowFavorites}
      className="relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center"
      style={{ backgroundColor: '#E67E22' }}
    >
      <FaHeart color="white" size={24} />
      {favorites.length > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {favorites.length}
        </span>
      )}
    </button>
  );
}
