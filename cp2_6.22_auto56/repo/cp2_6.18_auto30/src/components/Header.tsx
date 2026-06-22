import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Menu, X, Code2 } from 'lucide-react';
import { useStore } from '@/store';

const NAV_LINKS = [
  { to: '/', label: '主页' },
  { to: '/portfolio', label: '项目' },
  { to: '/blog', label: '博客' },
  { to: '/messages', label: '留言' },
  { to: '/admin', label: '管理' },
];

export default function Header() {
  const { theme, toggleTheme, sidebarOpen, toggleSidebar } = useStore();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
      <div className="flex items-center justify-between px-4 md:px-6 h-14">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-1.5 rounded-lg hover:opacity-80"
            style={{ color: 'var(--color-text)' }}
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link to="/" className="flex items-center gap-2 no-underline" style={{ color: 'var(--color-text)' }}>
            <Code2 size={24} className="text-brand-500" />
            <span className="font-display font-bold text-lg tracking-tight">DevPortfolio</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to ||
              (link.to !== '/' && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors"
                style={{
                  color: isActive ? '#6C63FF' : 'var(--color-text-secondary)',
                  backgroundColor: isActive ? 'rgba(108,99,255,0.08)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:opacity-80 transition-colors"
          style={{ color: 'var(--color-text)' }}
          aria-label="切换主题"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
}
