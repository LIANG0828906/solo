import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, BookOpen, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { createRipple } from '@/utils/helpers';

export const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [cartAnimating, setCartAnimating] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const location = useLocation();

  const handleCartClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    createRipple(e, 'rgba(30, 58, 95, 0.2)');
    setCartAnimating(true);
    setTimeout(() => setCartAnimating(false), 300);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 md:h-16 bg-white border-b border-gray-200 z-50 transition-all duration-300">
      <div className="h-full px-4 md:px-16 flex items-center justify-between max-w-[1920px] mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold text-primary font-serif">书香阁</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors duration-200 ${
              isActive('/') ? 'text-primary' : 'text-gray-600 hover:text-primary'
            }`}
          >
            首页
          </Link>
          <Link
            to="/orders"
            className={`text-sm font-medium transition-colors duration-200 ${
              isActive('/orders') ? 'text-primary' : 'text-gray-600 hover:text-primary'
            }`}
          >
            我的订单
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/cart"
            onClick={handleCartClick}
            className={`relative p-2 rounded-full hover:bg-gray-100 transition-all duration-200 ${
              cartAnimating ? 'animate-slideInRight' : ''
            }`}
          >
            <ShoppingCart className="w-6 h-6 text-primary" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs font-medium rounded-full flex items-center justify-center">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          <button className="hidden md:flex p-2 rounded-full hover:bg-gray-100 transition-colors duration-200">
            <User className="w-6 h-6 text-primary" />
          </button>

          <button
            className="md:hidden p-2"
            onClick={() => setShowMenu(!showMenu)}
          >
            {showMenu ? (
              <X className="w-6 h-6 text-primary" />
            ) : (
              <Menu className="w-6 h-6 text-primary" />
            )}
          </button>
        </div>
      </div>

      {showMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 animate-fadeIn">
          <div className="px-4 py-2 space-y-2">
            <Link
              to="/"
              className="block py-2 text-gray-700 hover:text-primary"
              onClick={() => setShowMenu(false)}
            >
              首页
            </Link>
            <Link
              to="/orders"
              className="block py-2 text-gray-700 hover:text-primary"
              onClick={() => setShowMenu(false)}
            >
              我的订单
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
