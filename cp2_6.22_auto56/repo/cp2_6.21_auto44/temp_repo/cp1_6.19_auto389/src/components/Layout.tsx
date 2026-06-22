import { Link, useNavigate } from 'react-router-dom';
import { Plus, User, ShoppingCart } from 'lucide-react';
import { useStore } from '../store';
import '../index.css';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { favorites } = useStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <header
        className="sticky top-0 z-40 shadow-md"
        style={{ backgroundColor: '#1E1E1E' }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white" style={{ backgroundColor: '#FF9800' }}>
              乐
            </div>
            <span className="text-white font-bold text-xl tracking-wide">乐音二手</span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className="text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              首页
            </Link>
            <Link
              to="/compare"
              className="text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium relative"
            >
              <ShoppingCart className="w-5 h-5 inline mr-1" />
              对比
            </Link>
            <Link
              to="/seller-dashboard"
              className="text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <User className="w-5 h-5 inline mr-1" />
              卖家中心
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/publish')}
              className="flex items-center gap-1 px-4 py-2 rounded-lg text-white font-medium text-sm transition-all hover:scale-105 shadow-md"
              style={{ backgroundColor: '#FF9800' }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">发布商品</span>
            </button>

            <button
              onClick={() => navigate('/compare')}
              className="relative p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {favorites.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                  style={{ backgroundColor: '#FF9800' }}
                >
                  {favorites.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
