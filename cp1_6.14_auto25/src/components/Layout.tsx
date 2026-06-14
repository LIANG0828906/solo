import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Sparkles, MessageCircle, User, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, setSidebarOpen } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isRegister = location.pathname === '/';

  return (
    <div className="min-h-screen bg-[#FFF5E6]">
      {!isRegister && currentUser && (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/discover')}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#FF6B6B] to-[#FFB26B] flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" fill="white" />
              </div>
              <h1 className="text-lg font-bold text-gray-800 hidden sm:block">心动信号</h1>
            </div>

            <nav className="flex items-center gap-1">
              <Link
                to="/discover"
                className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl transition-colors text-sm font-medium ${
                  location.pathname === '/discover'
                    ? 'bg-[#FFE5E5] text-[#FF6B6B]'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span className="hidden sm:inline">发现</span>
              </Link>
              <Link
                to="/chat"
                className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl transition-colors text-sm font-medium ${
                  location.pathname.startsWith('/chat')
                    ? 'bg-[#FFE5E5] text-[#FF6B6B]'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="hidden sm:inline">聊天</span>
              </Link>
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl transition-colors text-sm font-medium text-gray-500 hover:bg-gray-100"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline">我的</span>
              </button>
            </nav>
          </div>
        </header>
      )}

      <main>{children}</main>

      <Sidebar />
    </div>
  );
};

export default Layout;
