import { NavLink } from 'react-router-dom';
import { Home, Compass, BookOpen, Heart, User, ChefHat } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const menuItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/discover', label: '发现', icon: Compass },
    { path: '/my-recipes', label: '我的食谱', icon: BookOpen },
    { path: '/favorites', label: '我的收藏', icon: Heart },
    { path: '/profile', label: '个人主页', icon: User },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static md:z-0 md:shadow-none md:bg-transparent md:w-auto`}
      >
        <div className="p-6 md:p-0">
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <ChefHat className="w-8 h-8 text-[var(--primary)]" />
            <span className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "'Playfair Display', serif" }}>
              RecipeShare
            </span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-[var(--primary)] text-white shadow-md'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
