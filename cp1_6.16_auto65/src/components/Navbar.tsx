import { Heart, ChefHat, Calendar } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';

export default function Navbar() {
  const { favorites } = useFavorites();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
            <ChefHat size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent hidden sm:block">
            美食计划
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              location.pathname === '/'
                ? 'bg-primary/10 text-primary'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChefHat size={18} />
            <span className="hidden sm:inline">食谱浏览</span>
          </Link>

          <Link
            to="/meal-plan"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              location.pathname === '/meal-plan'
                ? 'bg-primary/10 text-primary'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar size={18} />
            <span className="hidden sm:inline">我的计划</span>
          </Link>

          <div className="flex items-center gap-1 pl-2 border-l border-gray-200">
            <Heart size={20} className="text-red-400 fill-red-400" />
            <div className="relative">
              <span className="text-sm text-gray-600">收藏</span>
              {favorites.length > 0 && (
                <span className="absolute -top-2 -right-4 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {favorites.length > 99 ? '99+' : favorites.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
