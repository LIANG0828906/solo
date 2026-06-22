import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Sparkles, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavbarProps {
  className?: string;
}

const navItems = [
  { to: '/', label: '技能广场', icon: Sparkles },
  { to: '/messages', label: '我的消息', icon: MessageCircle },
  { to: '/profile', label: '个人中心', icon: User },
];

export default function Navbar({ className }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-40 h-14 bg-white shadow-sm',
        className
      )}
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full">
          <NavLink to="/" className="flex items-center gap-2">
            <span
              className="text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              SkillSwapHub
            </span>
          </NavLink>

          <div className="hidden md:flex items-center gap-1 h-full">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-2 px-4 h-full text-sm font-medium',
                    'transition-colors duration-200',
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} />
                    <span>{item.label}</span>
                    <span
                      className={cn(
                        'absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-blue-500 rounded-full',
                        'transition-all duration-300 ease-out',
                        isActive ? 'w-8' : 'w-0'
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'md:hidden absolute top-14 left-0 right-0 bg-white shadow-lg border-t border-gray-100',
          'transition-all duration-300 ease-out overflow-hidden',
          mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg',
                  'transition-colors duration-200',
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                )
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
