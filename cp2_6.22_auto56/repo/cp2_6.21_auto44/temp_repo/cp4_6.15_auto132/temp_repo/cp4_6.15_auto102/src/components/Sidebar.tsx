import { useLocation, Link } from 'react-router-dom';
import {
  Home,
  PlusCircle,
  Wallet,
  BookOpen,
  Smartphone,
  Home as HomeIcon,
  Dumbbell,
  Shirt,
  Package,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  { name: '教材书籍', icon: BookOpen, color: '#6BB7F0', path: '/category/books' },
  { name: '电子产品', icon: Smartphone, color: '#a78bfa', path: '/category/electronics' },
  { name: '生活用品', icon: HomeIcon, color: '#34d399', path: '/category/lifestyle' },
  { name: '运动器材', icon: Dumbbell, color: '#fb923c', path: '/category/sports' },
  { name: '服饰鞋包', icon: Shirt, color: '#f472b6', path: '/category/clothing' },
  { name: '其他', icon: Package, color: '#9ca3af', path: '/category/other' },
];

const navLinks = [
  { name: '首页', icon: Home, path: '/' },
  { name: '发布物品', icon: PlusCircle, path: '/add' },
  { name: '我的积分', icon: Wallet, path: '/wallet' },
];

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-52 bg-white shadow-lg z-40 flex-col">
      <div className="p-5 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="font-display font-bold text-lg text-primary">校园漂流</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1 mb-6">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 no-underline',
                  active
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          分类浏览
        </div>
        <div className="space-y-1">
          {categories.map((cat) => {
            const active = isActive(cat.path);
            return (
              <Link
                key={cat.path}
                to={cat.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 no-underline',
                  active
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: active ? 'rgba(255,255,255,0.2)' : `${cat.color}20` }}
                >
                  <cat.icon
                    className="w-4 h-4"
                    style={{ color: active ? '#fff' : cat.color }}
                  />
                </span>
                <span>{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
