import { NavLink, useLocation } from 'react-router-dom';
import { ChefHat, PlusCircle, Home } from 'lucide-react';

export function Navbar() {
  const location = useLocation();

  const navItems = [
    { to: '/', label: '首页', icon: Home },
    { to: '/create', label: '新建配方', icon: PlusCircle },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 font-bold text-xl">
          <ChefHat size={28} style={{ color: '#e67e22' }} />
          <span style={{ background: 'linear-gradient(135deg, #e67e22, #e8a87c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            烘焙日志
          </span>
        </NavLink>
        <div className="flex items-center gap-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="relative flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 py-1"
              >
                <Icon size={20} />
                <span>{item.label}</span>
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300"
                  style={{
                    background: isActive ? 'linear-gradient(90deg, #e67e22, #e8a87c)' : 'transparent',
                    transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left',
                  }}
                />
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
