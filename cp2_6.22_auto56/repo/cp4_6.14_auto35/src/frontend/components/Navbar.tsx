import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, Plus } from 'lucide-react';

interface NavbarProps {
  onCreateClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onCreateClick }) => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
      isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
    }`;

  return (
    <nav className="bg-[#1a237e] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Target size={28} />
            <h1 className="text-xl font-bold">OKR 目标管理</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <NavLink to="/" className={linkClass}>
              <LayoutDashboard size={18} />
              <span>仪表盘</span>
            </NavLink>
            <NavLink to="/objectives" className={linkClass}>
              <Target size={18} />
              <span>目标列表</span>
            </NavLink>
            <button
              onClick={onCreateClick}
              className="ml-4 bg-white text-[#1a237e] px-4 py-2 rounded-lg font-medium btn hover:bg-gray-100 flex items-center gap-2"
            >
              <Plus size={18} />
              <span>新建目标</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
