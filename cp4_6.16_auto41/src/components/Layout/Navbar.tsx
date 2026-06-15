import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, Leaf, User } from 'lucide-react';

const navLinks = [
  { to: '/', label: '仪表盘', end: true },
  { to: '/activities', label: '活动记录' },
  { to: '/leaderboard', label: '排行榜' },
  { to: '/settings', label: '设置' },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-white/95 backdrop-blur-sm transition-all duration-200 ${
          isScrolled ? 'shadow-nav-scrolled' : 'border-b border-gray-100'
        }`}
      >
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-xl bg-primary-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-primary-800 hidden sm:block">
                碳足迹追踪
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100">
                <div className="w-7 h-7 rounded-full bg-primary-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-700" />
                </div>
                <span className="text-sm font-medium text-primary-700">
                  环保达人
                </span>
              </div>

              <button
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                onClick={() => setIsDrawerOpen(true)}
                aria-label="打开菜单"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in md:hidden"
          onClick={() => setIsDrawerOpen(false)}
        >
          <aside
            className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-2xl animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-bold text-gray-800">导航菜单</span>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="关闭菜单"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary-50">
                <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-700" />
                </div>
                <div>
                  <div className="font-medium text-gray-800">环保达人</div>
                  <div className="text-xs text-gray-500">低碳生活践行者</div>
                </div>
              </div>
            </div>

            <nav className="p-3 space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
};

export default Navbar;
