import { NavLink } from 'react-router-dom';
import { Dumbbell, Users, Calendar, Clock } from 'lucide-react';

const menuItems = [
  { path: '/', label: '会员管理', icon: Users },
  { path: '/booking', label: '课程预约', icon: Calendar },
  { path: '/coach', label: '教练看板', icon: Clock },
];

export default function Sidebar() {
  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-[220px] lg:min-h-screen bg-slate-900 shrink-0">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-700">
          <Dumbbell className="w-6 h-6 text-blue-500" />
          <span className="text-white font-bold text-lg tracking-wide">FitClub</span>
        </div>
        <nav className="flex flex-col gap-1 px-2 pt-4">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 h-12 px-4 text-[14px] font-normal rounded-md transition-colors duration-150 ${
                  isActive
                    ? 'bg-slate-700 text-white border-l-[3px] border-blue-500'
                    : 'text-slate-300 hover:bg-slate-800 border-l-[3px] border-transparent'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <nav className="lg:hidden flex items-center gap-1 bg-slate-900 px-4 h-14 overflow-x-auto">
        <div className="flex items-center gap-2 mr-4 shrink-0">
          <Dumbbell className="w-5 h-5 text-blue-500" />
          <span className="text-white font-bold text-base">FitClub</span>
        </div>
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2 h-10 px-3 text-[14px] font-normal rounded-md shrink-0 transition-colors duration-150 ${
                isActive
                  ? 'bg-slate-700 text-white border-b-2 border-blue-500'
                  : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
