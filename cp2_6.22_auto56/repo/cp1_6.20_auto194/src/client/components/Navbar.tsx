import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Heart, ShoppingCart, User, ChefHat } from 'lucide-react';

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/favorites', label: '收藏夹', icon: Heart },
    { path: '/shopping-list', label: '购物清单', icon: ShoppingCart },
    { path: '/profile', label: '个人中心', icon: User },
  ];

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return ['首页'];
    if (path.startsWith('/recipe/')) return ['首页', '食谱详情'];
    if (path === '/favorites') return ['首页', '收藏夹'];
    if (path === '/shopping-list') return ['首页', '购物清单'];
    if (path === '/profile') return ['首页', '个人中心'];
    return ['首页'];
  };

  const breadcrumb = getBreadcrumb();

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'nav-blur shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <ChefHat size={28} style={{ color: 'var(--secondary)' }} />
            <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              美食厨房
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'font-semibold'
                    : 'hover:bg-white/50'
                }`}
                style={{
                  color: location.pathname === item.path ? 'var(--secondary)' : 'var(--text)',
                }}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <button
            className="md:hidden btn"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'transparent' }}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {breadcrumb.length > 1 && (
          <div className="hidden md:flex items-center gap-2 pb-2 text-sm" style={{ color: 'var(--text-light)' }}>
            {breadcrumb.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && <span>/</span>}
                <span className={index === breadcrumb.length - 1 ? 'font-medium' : ''}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        )}

        {menuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg rounded-b-xl">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-4 border-b last:border-b-0 ${
                  location.pathname === item.path ? 'bg-gray-50' : ''
                }`}
                style={{
                  color: location.pathname === item.path ? 'var(--secondary)' : 'var(--text)',
                }}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};
