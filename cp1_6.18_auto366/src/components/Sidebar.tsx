import { useState } from 'react';
import { Home, BookOpen, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems = [
    { id: 'home', icon: Home, path: '/' },
    { id: 'projects', icon: BookOpen, path: '/' },
    { id: 'profile', icon: User, path: '/' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname.startsWith('/project');
    }
    return location.pathname === path;
  };

  return (
    <>
      <aside className="hidden md:flex flex-col items-center bg-primary-600 w-[60px] h-screen fixed left-0 top-0 z-50">
        <div className="h-14 flex items-center justify-center mt-4 mb-8">
          <span className="text-white font-bold text-lg">接</span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isHovered = hoveredItem === item.id;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className="relative w-12 h-12 flex items-center justify-center rounded-xl mb-3 transition-all duration-300 ease-out"
              style={{
                backgroundColor: isHovered || active ? 'rgba(255,255,255,0.15)' : 'transparent',
              }}
            >
              <div
                className="transition-all duration-300 ease-out"
                style={{
                  transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                }}
              >
                <Icon
                  size={isHovered ? 36 : 30}
                  color="white"
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>
            </button>
          );
        })}
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-primary-600 z-50 flex items-center justify-around h-16 safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center w-16 h-full"
            >
              <Icon size={28} color={active ? '#F5F3FF' : 'rgba(255,255,255,0.6)'} strokeWidth={active ? 2.5 : 2} />
            </button>
          );
        })}
      </nav>
    </>
  );
}
