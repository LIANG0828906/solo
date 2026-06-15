import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChefHat, Home, Users, PlusCircle } from 'lucide-react';
import { CURRENT_USER } from '@/modules/recipes/RecipeStore';

const NavBar: React.FC = () => {
  const loc = useLocation();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-warm-400 to-warm-500 text-white shadow-card'
        : 'text-cocoa-300 hover:text-warm-500 hover:bg-warm-50'
    }`;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-cream-100/80 border-b border-warm-100">
      <div className="container py-3 flex items-center justify-between gap-4">
        <NavLink to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-300 to-warm-500 flex items-center justify-center shadow-card group-hover:scale-105 transition-transform">
            <ChefHat className="text-white" size={22} />
          </div>
          <div className="hidden sm:block">
            <div className="font-serif text-lg font-bold text-cocoa-400 leading-tight">
              家的味道
            </div>
            <div className="text-[10px] text-cocoa-200 leading-tight tracking-wide">
              Family Recipes
            </div>
          </div>
        </NavLink>

        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>
            <Home size={16} />
            <span className="hidden sm:inline">我的菜谱</span>
          </NavLink>
          <NavLink to="/community" className={linkClass}>
            <Users size={16} />
            <span className="hidden sm:inline">社区广场</span>
          </NavLink>
          <NavLink
            to="/create"
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              loc.pathname === '/create'
                ? 'bg-gradient-to-r from-warm-400 to-warm-500 text-white shadow-card'
                : 'bg-gradient-to-r from-warm-400/10 to-warm-500/10 text-warm-500 hover:from-warm-400/20 hover:to-warm-500/20'
            }`}
          >
            <PlusCircle size={16} />
            <span className="hidden sm:inline">创建菜谱</span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <img
            src={CURRENT_USER.avatar}
            alt={CURRENT_USER.name}
            className="w-9 h-9 rounded-full border-2 border-warm-200 bg-white"
          />
          <span className="hidden md:inline text-sm text-cocoa-300 font-medium">
            {CURRENT_USER.name}
          </span>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
