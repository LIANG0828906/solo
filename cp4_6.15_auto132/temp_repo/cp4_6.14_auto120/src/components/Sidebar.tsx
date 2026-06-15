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
      <aside className="hidden lg:flex lg:flex-col lg:w-[220px] lg:min-h-screen shrink-0" style={{ backgroundColor: '#1e293b' }}>
        <div className="flex items-center gap-2 px-5 h-16 border-b" style={{ borderColor: '#334155' }}>
          <Dumbbell className="w-6 h-6" style={{ color: '#3b82f6' }} />
          <span className="text-white font-bold text-lg tracking-wide">FitClub</span>
        </div>
        <nav className="flex flex-col gap-1 px-2 pt-4">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => {
                const baseStyle = 'flex items-center gap-3 h-12 px-4 text-[14px] font-normal transition-colors duration-150';
                if (isActive) {
                  return `${baseStyle} text-white`;
                }
                return `${baseStyle} text-slate-300 hover:bg-slate-800`;
              }}
              style={({ isActive }) => ({
                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                backgroundColor: isActive ? '#334155' : 'transparent',
                borderRadius: isActive ? '0 6px 6px 0' : '0 6px 6px 0',
                paddingLeft: isActive ? '13px' : '16px',
              })}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <nav className="lg:hidden flex items-center gap-1 px-4 h-14 overflow-x-auto" style={{ backgroundColor: '#1e293b' }}>
        <div className="flex items-center gap-2 mr-4 shrink-0">
          <Dumbbell className="w-5 h-5" style={{ color: '#3b82f6' }} />
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
                  ? 'text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`
            }
            style={({ isActive }) => ({
              borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
              backgroundColor: isActive ? '#334155' : 'transparent',
            })}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
