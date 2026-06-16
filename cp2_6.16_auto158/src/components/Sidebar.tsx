import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, BookOpen, Music } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: '仪表盘', end: true },
  { path: '/schedule', icon: Calendar, label: '课程排期' },
  { path: '/students', icon: Users, label: '学生管理' },
  { path: '/assignments', icon: BookOpen, label: '作业中心' },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <>
      <aside className="fixed left-0 top-0 h-full w-[240px] bg-gradient-to-b from-sidebar-start to-sidebar-end text-white z-40 hidden md:flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Music size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">TuneTracker</h1>
              <p className="text-xs text-white/60">音乐教学管理</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.end
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) => (
                      twMerge(
                        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-fast relative',
                        isActive
                          ? 'bg-white/15 text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      )
                    )}
                    style={{
                      borderLeft: isActive ? '4px solid #D98A4A' : '4px solid transparent',
                      boxShadow: isActive ? 'inset 4px 0 20px rgba(217, 138, 74, 0.3)' : 'none',
                    }}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-white/50 text-center">
            © 2026 TuneTracker
          </div>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border-color z-40 flex md:hidden items-center justify-around">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.end
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => (
                twMerge(
                  'flex flex-col items-center gap-1 py-2 px-4 rounded-lg text-xs font-medium transition-all duration-fast',
                  isActive ? 'text-accent' : 'text-text-muted'
                )
              )}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default Sidebar;
