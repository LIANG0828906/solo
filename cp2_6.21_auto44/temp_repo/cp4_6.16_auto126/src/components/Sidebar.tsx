import React from 'react';
import { ChefHat, Heart, BookOpen, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { ViewMode } from '@/types';
import './Sidebar.css';

interface SidebarProps {
  onNavigate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { viewMode, setViewMode, myRecipeIds, favorites, recipes } = useAppStore();

  const navItems: { mode: ViewMode; label: string; icon: React.ReactNode; count: number }[] = [
    { mode: 'all', label: '全部菜谱', icon: <Sparkles size={20} />, count: recipes.length },
    { mode: 'my-recipes', label: '我的配方', icon: <BookOpen size={20} />, count: myRecipeIds.length },
    { mode: 'favorites', label: '收藏夹', icon: <Heart size={20} />, count: favorites.length },
  ];

  const handleNavClick = (mode: ViewMode) => {
    setViewMode(mode);
    onNavigate?.();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <ChefHat size={32} />
        <h1>FlavorFuse</h1>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.mode}
            className={`nav-item ${viewMode === item.mode ? 'active' : ''}`}
            onClick={() => handleNavClick(item.mode)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            <span className="nav-count">{item.count}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>🍳 创意烹饪，无限可能</p>
      </div>
    </aside>
  );
};

export default Sidebar;
