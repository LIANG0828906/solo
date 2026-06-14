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

  return (
    <>
      <button
        onClick={toggleMobileMenu}
        className="fixed top-4 left-4 z-50 md:hidden bg-white/80 backdrop-blur-sm rounded-lg p-2 shadow-md hover:shadow-lg transition-all"
        style={{ minHeight: 44, minWidth: 44 }}
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out
          bg-gradient-to-b from-[#e0f7fa] to-[#b2dfdb] shadow-lg
          ${sidebarCollapsed ? 'w-[60px]' : 'w-[220px]'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-5'} pt-6 pb-4`}>
          {!sidebarCollapsed && (
            <h1 className="text-lg font-bold text-[#00695c] whitespace-nowrap truncate">
              智能批改系统
            </h1>
          )}
        </div>

        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => mobileMenuOpen && toggleMobileMenu()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                ${sidebarCollapsed ? 'justify-center' : ''}
                ${
                  isActive
                    ? 'bg-[#00695c]/15 text-[#00695c] font-semibold shadow-sm'
                    : 'text-[#37474f] hover:bg-[#00695c]/8 hover:text-[#00695c]'
                }`
              }
              style={{ minHeight: 44 }}
            >
              <item.icon size={20} />
              {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={toggleSidebar}
          className="hidden md:flex items-center justify-center py-4 text-[#37474f] hover:text-[#00695c] transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>
    </>
  );
}
