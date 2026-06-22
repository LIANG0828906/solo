import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ListTodo, Calendar, BarChart3, Users, Menu, X, Target } from 'lucide-react';

const navItems = [
  { path: '/habits', label: '习惯列表', icon: ListTodo },
  { path: '/record', label: '每日记录', icon: Calendar },
  { path: '/stats', label: '统计分析', icon: BarChart3 },
  { path: '/community', label: '社区挑战', icon: Users },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg-dark">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-bg-dark/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Target size={18} className="text-accent" />
            </div>
            <span className="font-bold text-text-primary">习惯养成</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/10 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="absolute top-14 left-0 right-0 bg-bg-dark/95 backdrop-blur-md border-b border-white/5 p-4 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <nav className="space-y-1">
              {navItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                    ${location.pathname === item.path
                      ? 'bg-accent/20 text-accent'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                    }
                  `}
                >
                  <item.icon size={20} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-bg-dark/50 backdrop-blur-xl border-r border-white/5 z-20">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Target size={22} className="text-accent" />
            </div>
            <div>
              <h1 className="font-bold text-text-primary text-lg">习惯养成</h1>
              <p className="text-xs text-text-muted">追踪每一天</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ease-out
                ${location.pathname === item.path
                  ? 'bg-accent/20 text-accent shadow-lg shadow-accent/10'
                  : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                }
              `}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4">
          <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl p-4 border border-accent/20">
            <p className="text-sm text-text-secondary mb-2">今日进度</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-accent">65%</span>
              <span className="text-xs text-text-muted mb-1">已完成</span>
            </div>
            <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-accent to-accent-hover rounded-full"
                style={{ width: '65%' }}
              />
            </div>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
