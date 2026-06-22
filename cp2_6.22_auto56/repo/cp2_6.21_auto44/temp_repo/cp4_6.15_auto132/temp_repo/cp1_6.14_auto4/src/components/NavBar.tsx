/**
 * 【组件职责】应用顶部导航栏，固定定位，响应式布局（桌面完整导航 / 移动汉堡菜单），随滚动变化毛玻璃效果
 * 【被调用方】App.tsx 或布局组件（全局渲染）
 * 【数据流向】父组件传入 user/onLogout → 组件内部通过 useEffect 监听 window scroll → 根据视口宽度切换桌面/移动端布局
 */
import { useState, useEffect } from 'react';
import { Menu, X, Basketball } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '@/utils/api';
import { cn } from '@/lib/utils';

interface NavBarProps {
  user: User | null;
  onLogout: () => void;
}

export function NavBar({ user, onLogout }: NavBarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    onLogout();
  };

  const handleNavClick = (to: string) => {
    setMobileMenuOpen(false);
    navigate(to);
  };

  const initial = user?.nickname?.charAt(0)?.toUpperCase() ?? '?';

  const navItems = [
    { label: '首页', path: '/' },
    { label: '发布赛事', path: '/create' },
    { label: '我的历史', path: '/history' },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-court-brownDark/90 backdrop-blur-md shadow-lg'
          : 'bg-court-brownDark/60',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity"
          >
            <div className="w-9 h-9 rounded-full bg-court-green flex items-center justify-center shadow-md">
              <Basketball className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-wide">
              CourtCall
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-cream/90 hover:text-white transition-colors font-body text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-court-green flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {initial}
                  </div>
                  <span className="text-white text-sm font-medium max-w-[100px] truncate">
                    {user.nickname}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg bg-court-pin/90 hover:bg-court-pin text-white text-sm font-medium transition-colors shadow-sm"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg border border-cream/30 text-cream hover:bg-cream/10 text-sm font-medium transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-lg bg-court-green hover:bg-court-greenDark text-white text-sm font-medium transition-colors shadow-sm"
                >
                  注册
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label={mobileMenuOpen ? '关闭菜单' : '打开菜单'}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-300 origin-top',
          mobileMenuOpen
            ? 'max-h-[500px] opacity-100 border-t border-white/10'
            : 'max-h-0 opacity-0',
        )}
      >
        <div className="px-4 py-4 bg-court-brownDark/95 backdrop-blur-md space-y-3">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className="block w-full text-left text-white/90 hover:text-white hover:bg-white/5 py-2.5 px-3 rounded-lg font-body text-base transition-colors"
            >
              {item.label}
            </button>
          ))}

          <div className="pt-3 border-t border-white/10 space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-3 py-2 px-3">
                  <div className="w-9 h-9 rounded-full bg-court-green flex items-center justify-center text-white font-bold shadow-sm">
                    {initial}
                  </div>
                  <span className="text-white font-medium">
                    {user.nickname}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-lg bg-court-pin/90 hover:bg-court-pin text-white font-medium transition-colors shadow-sm"
                >
                  退出登录
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('/login')}
                  className="w-full py-2.5 rounded-lg border border-cream/30 text-cream hover:bg-cream/10 font-medium transition-colors"
                >
                  登录
                </button>
                <button
                  onClick={() => handleNavClick('/register')}
                  className="w-full py-2.5 rounded-lg bg-court-green hover:bg-court-greenDark text-white font-medium transition-colors shadow-sm"
                >
                  注册
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
