import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChefHat, Home, PlusCircle, User, Search } from 'lucide-react';
import type { User as UserType } from '../types';

interface NavbarProps {
  searchKeyword?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  currentUser?: UserType | null;
}

export default function Navbar({ searchKeyword, onSearchChange, currentUser }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/create', icon: PlusCircle, label: '创建' },
    { path: '/profile', icon: User, label: '我的' },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
            >
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-xl font-bold text-[var(--text-primary)] hidden sm:block"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              RecipeShare
            </span>
          </Link>

          {onSearchChange && (
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={searchKeyword || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="搜索食谱或食材..."
                className="input pl-10 w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate('/');
                  }
                }}
              />
            </div>
          )}

          <div className="flex items-center gap-1 sm:gap-2">
            {navLinks.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === path
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--primary)]/5 hover:text-[var(--primary)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
