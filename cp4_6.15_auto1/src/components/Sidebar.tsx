import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  Send,
  BarChart3,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useStore } from '@/store';

const navItems = [
  { to: '/questions', icon: BookOpen, label: '题目管理' },
  { to: '/submit', icon: Send, label: '学生提交' },
  { to: '/analytics', icon: BarChart3, label: '分析看板' },
  { to: '/records', icon: ClipboardList, label: '评分记录' },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, toggleMobileMenu } = useStore();

  useEffect(() => {
    const checkWidth = () => {
      const width = window.innerWidth;
      if (width < 768) {
        useStore.setState({ mobileMenuOpen: false });
      }
      if (width >= 768 && width < 1024) {
        useStore.setState({ sidebarCollapsed: true });
      }
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  return (
    <>
      <button
        onClick={toggleMobileMenu}
        className="fixed top-4 left-4 z-50 md:hidden bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg hover:shadow-xl transition-all active:scale-95"
        style={{ minHeight: 48, minWidth: 48 }}
        aria-label="菜单"
      >
        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-sm z-30 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ease-out
          bg-gradient-to-b from-[#e0f7fa] via-[#e0f7fa] to-[#b2dfdb] shadow-xl
          ${sidebarCollapsed ? 'w-[64px]' : 'w-[220px]'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-5'} pt-7 pb-5`}>
          {!sidebarCollapsed ? (
            <h1 className="text-lg font-bold text-[#00695c] whitespace-nowrap truncate tracking-wide">
              智能批改系统
            </h1>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#00695c]/10 flex items-center justify-center">
              <BookOpen size={20} className="text-[#00695c]" />
            </div>
          )}
        </div>

        <nav className="flex-1 px-2.5 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => mobileMenuOpen && toggleMobileMenu()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-200 group
                ${sidebarCollapsed ? 'justify-center' : ''}
                ${
                  isActive
                    ? 'bg-gradient-to-r from-[#00695c]/15 to-[#00897b]/10 text-[#00695c] font-semibold shadow-sm border border-[#00695c]/10'
                    : 'text-[#546e7a] hover:bg-white/60 hover:text-[#00695c] hover:-translate-y-0.5'
                }`
              }
              style={{ minHeight: 48 }}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={toggleSidebar}
          className="hidden md:flex items-center justify-center py-4 text-[#546e7a] hover:text-[#00695c] transition-colors border-t border-[#b2dfdb]/30"
          style={{ minHeight: 44 }}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>
    </>
  );
}
