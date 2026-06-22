import { useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Home, Map, Compass } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isHome = location.pathname === '/';
  const isMap = location.pathname === '/map';

  return (
    <nav className="sticky top-0 z-50 bg-cream dark:bg-brown/95 border-b border-brown/10 dark:border-cream/10 backdrop-blur-sm transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <Compass className="w-7 h-7 text-rust transition-transform duration-300 group-hover:rotate-45" />
          <span className="text-xl font-bold text-brown dark:text-cream tracking-wide transition-colors duration-300">
            TravelMemoir
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              isHome
                ? 'bg-rust text-white shadow-md'
                : 'text-brown/70 dark:text-cream/70 hover:bg-brown/5 dark:hover:bg-cream/10 hover:text-brown dark:hover:text-cream'
            }`}
            aria-label="返回首页"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">首页</span>
          </button>

          <button
            onClick={() => navigate('/map')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              isMap
                ? 'bg-rust text-white shadow-md'
                : 'text-brown/70 dark:text-cream/70 hover:bg-brown/5 dark:hover:bg-cream/10 hover:text-brown dark:hover:text-cream'
            }`}
            aria-label="地图视图"
          >
            <Map className="w-4 h-4" />
            <span className="hidden sm:inline">地图</span>
          </button>

          <div className="w-px h-6 bg-brown/10 dark:bg-cream/10 mx-1" />

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-brown/70 dark:text-cream/70 hover:bg-brown/5 dark:hover:bg-cream/10 hover:text-brown dark:hover:text-cream transition-all duration-300"
            aria-label="切换主题"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 transition-transform duration-300 hover:scale-110" />
            ) : (
              <Sun className="w-5 h-5 transition-transform duration-300 hover:scale-110" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
