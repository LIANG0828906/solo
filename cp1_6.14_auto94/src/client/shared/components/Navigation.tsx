import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  ClipboardList,
  PlayCircle,
  FileText,
  Menu,
  X,
} from 'lucide-react';
import { useAppStore } from '@client/shared/stores/useAppStore';

const NAV_ITEMS = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/clients', label: '客户', icon: Users },
  { path: '/exercises', label: '动作库', icon: Dumbbell },
  { path: '/training-plans', label: '训练计划', icon: ClipboardList },
  { path: '/daily-session', label: '训练执行', icon: PlayCircle },
  { path: '/self-assessment', label: '自评', icon: FileText },
] as const;

function isActive(currentPath: string, itemPath: string) {
  if (itemPath === '/') return currentPath === '/';
  return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
}

export default function Navigation() {
  const location = useLocation();
  const { sidebarOpen, setSidebarOpen } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-[#2F4858] text-white z-30 hidden lg:flex flex-col">
        <div className="flex items-center gap-2 px-6 h-16 border-b border-white/10">
          <Dumbbell className="w-7 h-7 text-[#FF6B35]" />
          <span className="text-xl font-bold tracking-wide">FitPulse</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(location.pathname, item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#FF6B35] text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#2F4858] text-white z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-[#FF6B35]" />
          <span className="text-lg font-bold">FitPulse</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div
        className={`lg:hidden fixed top-0 right-0 bottom-0 w-72 bg-[#2F4858] text-white z-50 transform transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-white/10">
          <span className="text-xl font-bold">FitPulse</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(location.pathname, item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#FF6B35] text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
