import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Coffee, Package, ShoppingCart, BarChart3 } from 'lucide-react';
import { DrinkManager } from './pages/DrinkManager';
import { InventoryManager } from './pages/InventoryManager';
import { SalesDashboard } from './pages/SalesDashboard';
import { ReportPage } from './pages/ReportPage';
import { useAppStore } from './store/useAppStore';

const App: React.FC = () => {
  const { error, setError } = useAppStore();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const navItems = [
    { path: '/drinks', label: '饮品管理', icon: Coffee },
    { path: '/inventory', label: '原料库存', icon: Package },
    { path: '/sales', label: '销售面板', icon: ShoppingCart },
    { path: '/reports', label: '数据分析', icon: BarChart3 },
  ];

  return (
    <BrowserRouter>
      <div className="h-full w-full flex">
        <aside
          className="hidden md:flex flex-col flex-shrink-0"
          style={{
            width: '240px',
            backgroundColor: 'var(--color-sidebar)',
            color: 'var(--color-sidebar-text)',
            borderTopRightRadius: '16px',
          }}
        >
          <div className="p-6 border-b border-white/20">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Coffee size={28} />
              <span>咖啡馆管理</span>
            </h1>
          </div>
          <nav className="flex-1 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 transition-all duration-200 h-12 ${
                    isActive ? 'bg-white/20' : ''
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? 'var(--color-sidebar-hover)' : undefined,
                  textDecoration: 'none',
                  color: 'var(--color-sidebar-text)',
                })}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }}
                onMouseLeave={(e) => {
                  const isActive = e.currentTarget.classList.contains('bg-white/20');
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header
            className="md:hidden flex items-center justify-between px-4 py-3 border-b"
            style={{ backgroundColor: 'var(--color-sidebar)', borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <h1
              className="text-lg font-bold flex items-center gap-2"
              style={{ color: 'var(--color-sidebar-text)' }}
            >
              <Coffee size={24} />
              <span>咖啡馆管理</span>
            </h1>
          </header>

          <nav
            className="md:hidden flex overflow-x-auto border-b"
            style={{ backgroundColor: 'var(--color-sidebar)' }}
          >
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 flex-shrink-0 transition-all ${
                    isActive ? 'bg-white/20' : ''
                  }`
                }
                style={{
                  color: 'var(--color-sidebar-text)',
                  textDecoration: 'none',
                  minHeight: '44px',
                }}
              >
                <item.icon size={18} />
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <main className="flex-1 overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/drinks" replace />} />
              <Route path="/drinks" element={<DrinkManager />} />
              <Route path="/inventory" element={<InventoryManager />} />
              <Route path="/sales" element={<SalesDashboard />} />
              <Route path="/reports" element={<ReportPage />} />
            </Routes>
          </main>
        </div>

        {error && (
          <div
            className="fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-slide-in"
            style={{ backgroundColor: 'var(--color-warning)', color: 'white' }}
          >
            {error}
          </div>
        )}
      </div>
    </BrowserRouter>
  );
};

export default App;
