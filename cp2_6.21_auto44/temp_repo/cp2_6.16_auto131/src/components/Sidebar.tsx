import { NavLink, useNavigate } from 'react-router-dom';
import { ClipboardList, BarChart3, Trophy, Settings, LogOut } from 'lucide-react';
import { useUserStore } from '@/modules/user/userStore';
import { useTaskStore } from '@/modules/task/taskStore';
import { useTimerStore } from '@/modules/timer/timerStore';

const navItems = [
  { path: '/', label: '任务列表', icon: ClipboardList },
  { path: '/dashboard', label: '仪表盘', icon: BarChart3 },
  { path: '/leaderboard', label: '排行榜', icon: Trophy },
  { path: '/settings', label: '设置', icon: Settings },
];

export default function Sidebar() {
  const currentUser = useUserStore((state) => state.currentUser);
  const logout = useUserStore((state) => state.logout);
  const navigate = useNavigate();
  const timerTaskId = useTimerStore((state) => state.taskId);
  const currentTask = useTaskStore((state) => timerTaskId ? state.getTaskById(timerTaskId) : undefined);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside
      className="sidebar h-screen w-60 flex flex-col text-white fixed left-0 top-0 z-50"
      style={{
        background: 'linear-gradient(180deg, #1A237E 0%, #283593 100%)',
      }}
    >
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          TeamTally
        </h1>
        <p className="text-xs text-white/60 mt-1">团队任务协作平台</p>
      </div>

      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-colors relative ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r"
                    style={{ backgroundColor: '#4FC3F7' }}
                  />
                )}
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {currentTask && (
        <div className="mx-4 mb-4 p-3 rounded-lg bg-white/10">
          <p className="text-xs text-white/60 mb-1">正在计时</p>
          <p className="text-sm font-medium truncate">{currentTask.title}</p>
        </div>
      )}

      <div className="p-4 border-t border-white/10">
        {currentUser ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                style={{ backgroundColor: '#4FC3F7', color: '#1A237E' }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{currentUser.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/settings')}
            className="w-full py-2 text-sm text-white/70 hover:text-white"
          >
            点击登录
          </button>
        )}
      </div>
    </aside>
  );
}
