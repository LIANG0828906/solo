import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, FileSpreadsheet } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onNavClick: () => void;
}

export default function Sidebar({ isOpen, onNavClick }: SidebarProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '仪表盘', icon: LayoutDashboard, end: true },
    { path: '/customers', label: '客户管理', icon: Users },
    { path: '/receipts', label: '收据管理', icon: FileText },
    { path: '/statements', label: '对账单', icon: FileSpreadsheet },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">收据管理系统</h1>
      </div>

      <nav className="py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.end
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={onNavClick}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
