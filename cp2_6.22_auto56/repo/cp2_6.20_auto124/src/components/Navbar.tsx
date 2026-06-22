import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div
        className="border-b border-white/10"
        style={{
          backgroundColor: 'rgba(26, 29, 35, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center h-16 gap-8">
            <NavLink
              to="/timeline"
              className={({ isActive }) =>
                cn(
                  'relative px-1 py-2 text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'text-[#ff6b35]'
                    : 'text-gray-300 hover:text-[#ff6b35]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span>里程碑</span>
                  <span
                    className={cn(
                      'absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff6b35] transition-all duration-200',
                      isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                    )}
                  />
                </>
              )}
            </NavLink>
            <NavLink
              to="/achievements"
              className={({ isActive }) =>
                cn(
                  'relative px-1 py-2 text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'text-[#ff6b35]'
                    : 'text-gray-300 hover:text-[#ff6b35]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span>成就</span>
                  <span
                    className={cn(
                      'absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff6b35] transition-all duration-200',
                      isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                    )}
                  />
                </>
              )}
            </NavLink>
            <NavLink
              to="/stats"
              className={({ isActive }) =>
                cn(
                  'relative px-1 py-2 text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'text-[#ff6b35]'
                    : 'text-gray-300 hover:text-[#ff6b35]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span>统计</span>
                  <span
                    className={cn(
                      'absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff6b35] transition-all duration-200',
                      isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                    )}
                  />
                </>
              )}
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}
