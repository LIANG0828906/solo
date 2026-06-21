import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, Plus, User, LogOut, Search } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { SearchBox } from '@/SearchBox';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-orange-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 group-hover:shadow-xl group-hover:shadow-orange-300 transition-all">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-800 hidden sm:block" style={{ fontFamily: "'Playfair Display', serif" }}>
              美食工坊
            </span>
          </Link>

          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <SearchBox variant="navbar" />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden p-2 text-stone-600 hover:text-orange-500 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/create"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300"
                >
                  <Plus className="w-4 h-4" />
                  发布食谱
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-orange-50 transition-colors"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-9 h-9 rounded-full object-cover border-2 border-orange-200"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white font-medium">
                        {user?.username.charAt(0)}
                      </div>
                    )}
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-orange-100 overflow-hidden animate-fadeIn">
                      <div className="px-4 py-3 border-b border-stone-100">
                        <p className="text-sm font-medium text-stone-800">{user?.username}</p>
                        <p className="text-xs text-stone-500">{user?.email}</p>
                      </div>
                      <Link
                        to="/create"
                        className="sm:hidden flex items-center gap-2 px-4 py-2.5 text-sm text-stone-700 hover:bg-orange-50 transition-colors"
                        onClick={() => setShowMenu(false)}
                      >
                        <Plus className="w-4 h-4" />
                        发布食谱
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-stone-600 hover:text-orange-500 font-medium transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-200"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>

        {showMobileSearch && (
          <div className="md:hidden pb-4 animate-fadeIn">
            <SearchBox variant="navbar" />
          </div>
        )}
      </div>
    </nav>
  );
};
