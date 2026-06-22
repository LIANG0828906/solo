import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { PlusCircle, BarChart3, FileText, PieChart } from 'lucide-react';

const navItems = [
  {
    path: '/asset',
    label: '资产录入',
    icon: PlusCircle,
  },
  {
    path: '/analysis',
    label: '绩效分析',
    icon: BarChart3,
  },
  {
    path: '/report',
    label: '报告生成',
    icon: FileText,
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-bg-secondary/50 backdrop-blur-md border-r border-bg-tertiary flex flex-col h-full">
      <div className="p-6 border-b border-bg-tertiary">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-light rounded-xl flex items-center justify-center">
            <PieChart className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">投资助手</h1>
            <p className="text-xs text-text-secondary">Portfolio Manager</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-bg-tertiary">
        <div className="text-xs text-text-secondary text-center">
          数据本地存储 · 安全可靠
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
