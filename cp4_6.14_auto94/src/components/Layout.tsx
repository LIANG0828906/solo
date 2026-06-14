import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ClipboardCheck, TrendingUp, Settings, BarChart3, ImageIcon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [activeNav, setActiveNav] = useState(location.pathname);

  const navItems = [
    { path: '/', label: '缺陷标注', icon: <ClipboardCheck size={18} /> },
    { path: '/trend', label: '趋势分析', icon: <TrendingUp size={18} /> },
  ];

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <aside
        className="flex flex-col flex-shrink-0"
        style={{ width: '240px', backgroundColor: '#1e293b' }}
      >
        <div className="px-6 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#3b82f6' }}
            >
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base">质检管理系统</h1>
              <p className="text-slate-400 text-xs">缺陷标注与分析</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setActiveNav(item.path)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                style={
                  isActive
                    ? { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }
                    : {}
                }
              >
                {item.icon}
                {item.label}
                {isActive && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#3b82f6' }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: '#3b82f6' }}
            >
              质
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">质检员</p>
              <p className="text-slate-400 text-xs truncate">质检一组</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="flex items-center justify-between px-6 flex-shrink-0 border-b border-slate-200"
          style={{ height: '56px', backgroundColor: '#ffffff' }}
        >
          <div className="flex items-center gap-4">
            <h2 className="text-base font-semibold text-gray-800">
              {location.pathname === '/' ? '产品缺陷标注' : '不良率趋势分析'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              style={{ height: '36px', width: '36px' }}
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6" style={{ padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
