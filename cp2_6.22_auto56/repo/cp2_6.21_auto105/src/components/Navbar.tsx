import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, MapPin, User, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1a73e8] to-[#34a853] flex items-center justify-center">
              <Compass className="text-white" size={20} />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-[#1a73e8] to-[#34a853] bg-clip-text text-transparent">
              旅途规划
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-[#1a73e8] font-medium transition-colors"
            >
              探索
            </Link>
            {isAuthenticated && (
              <Link
                to="/create"
                className="text-gray-700 hover:text-[#1a73e8] font-medium transition-colors"
              >
                创建路线
              </Link>
            )}
            <Link
              to="/explore"
              className="text-gray-700 hover:text-[#1a73e8] font-medium transition-colors"
            >
              发现
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <img
                    src={user?.avatar}
                    alt={user?.username}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 animate-fadeIn">
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50"
                    >
                      <User size={18} />
                      <span>个人主页</span>
                    </Link>
                    <Link
                      to="/create"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50"
                    >
                      <MapPin size={18} />
                      <span>我的路线</span>
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-gray-50 w-full text-left"
                    >
                      <LogOut size={18} />
                      <span>退出登录</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-primary text-sm"
              >
                登录
              </Link>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-fadeInDown">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                探索
              </Link>
              {isAuthenticated && (
                <Link
                  to="/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  创建路线
                </Link>
              )}
              <Link
                to="/explore"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                发现
              </Link>
              <hr className="my-2 border-gray-100" />
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg"
                  >
                    个人主页
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2.5 text-red-500 hover:bg-gray-50 rounded-lg text-left"
                  >
                    退出登录
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mx-4 btn-primary text-center"
                >
                  登录
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
