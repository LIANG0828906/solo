import { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X, Heart, Settings, Home as HomeIcon } from 'lucide-react';
import { useStore } from '@/store';
import Home from '@/pages/Home';
import Favorites from '@/pages/Favorites';
import Detail from '@/components/Detail';
import Admin from '@/components/Admin';
import Sidebar from '@/components/Sidebar';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const cart = useStore((s) => s.cart);
  const openCart = useStore((s) => s.openCart);
  const isMobileMenuOpen = useStore((s) => s.isMobileMenuOpen);
  const openMobileMenu = useStore((s) => s.openMobileMenu);
  const closeMobileMenu = useStore((s) => s.closeMobileMenu);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const searchQuery = useStore((s) => s.searchQuery);
  const [searchValue, setSearchValue] = useState(searchQuery);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname, closeMobileMenu]);

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchValue);
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-warm-100">
        <div className="max-w-content mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={openMobileMenu}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-warm-50 transition-colors"
          >
            <Menu size={20} className="text-stone-600" />
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 flex-shrink-0"
          >
            <span className="font-serif text-xl font-bold text-stone-800">
              手作市集
            </span>
          </Link>

          <form
            onSubmit={handleSearchSubmit}
            className="hidden sm:flex flex-1 max-w-md mx-4"
          >
            <div className="relative w-full">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300"
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="搜索商品或制作者..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-warm-50 border border-warm-100 text-sm focus:outline-none focus:border-warm-400 transition-colors placeholder:text-stone-300"
              />
            </div>
          </form>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === '/'
                  ? 'text-warm-600 bg-warm-50 font-medium'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
              }`}
            >
              <HomeIcon size={16} />
              首页
            </Link>
            <Link
              to="/favorites"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === '/favorites'
                  ? 'text-warm-600 bg-warm-50 font-medium'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Heart size={16} />
              收藏
            </Link>
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                location.pathname === '/admin'
                  ? 'text-warm-600 bg-warm-50 font-medium'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
              }`}
            >
              <Settings size={16} />
              后台
            </Link>
          </nav>

          <button
            onClick={openCart}
            className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-warm-50 transition-colors"
          >
            <ShoppingCart size={20} className="text-stone-600" />
            {cartCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-xs font-bold"
                style={{ backgroundColor: '#E11D48', fontSize: '10px' }}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        </div>

        <div className="sm:hidden px-4 pb-3">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative w-full">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300"
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="搜索商品或制作者..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-warm-50 border border-warm-100 text-sm focus:outline-none focus:border-warm-400 transition-colors placeholder:text-stone-300"
              />
            </div>
          </form>
        </div>
      </header>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 animate-fade-in"
            onClick={closeMobileMenu}
          />
          <div className="fixed top-0 left-0 h-full w-64 max-w-[75vw] bg-white z-50 shadow-2xl animate-slide-in-left">
            <div className="flex items-center justify-between p-4 border-b border-stone-100">
              <span className="font-serif text-lg font-bold text-stone-800">
                手作市集
              </span>
              <button
                onClick={closeMobileMenu}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X size={18} className="text-stone-400" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  location.pathname === '/'
                    ? 'text-warm-600 bg-warm-50 font-medium'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <HomeIcon size={18} />
                首页
              </Link>
              <Link
                to="/favorites"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  location.pathname === '/favorites'
                    ? 'text-warm-600 bg-warm-50 font-medium'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Heart size={18} />
                收藏夹
              </Link>
              <Link
                to="/admin"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  location.pathname === '/admin'
                    ? 'text-warm-600 bg-warm-50 font-medium'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Settings size={18} />
                简易后台
              </Link>
            </nav>
          </div>
        </>
      )}

      <Sidebar />
    </>
  );
}

function Toast() {
  const toastMessage = useStore((s) => s.toastMessage);
  const toastExiting = useStore((s) => s.toastExiting);

  if (!toastMessage) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
      <div
        className={`px-6 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${
          toastExiting ? 'toast-exit' : 'toast-enter'
        }`}
        style={{ backgroundColor: '#059669' }}
      >
        {toastMessage}
      </div>
    </div>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF7ED' }}>
      <Navbar />
      <main className="max-w-content mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<Detail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
