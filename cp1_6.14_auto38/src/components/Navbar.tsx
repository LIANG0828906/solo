import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, BarChart3, Settings, Star, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import MemberAvatar from './MemberAvatar';

export default function Navbar() {
  const location = useLocation();
  const { members, currentMemberId, setCurrentMemberId } = useStore();
  const currentMember = members.find((m) => m.id === currentMemberId);

  const navItems = [
    { path: '/', label: '看板', icon: Home },
    { path: '/shop', label: '积分商城', icon: ShoppingBag },
    { path: '/report', label: '周报', icon: BarChart3 },
  ];

  if (currentMember?.isAdmin) {
    navItems.push({ path: '/admin', label: '管理', icon: Settings });
  }

  const handleLogout = () => {
    setCurrentMemberId(null);
  };

  if (!currentMember) return null;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-primary-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-500 shadow-lg shadow-primary-200">
              <span className="text-xl">🏠</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">家庭家务</h1>
              <p className="text-xs text-gray-500">一起分担，共同成长</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2">
              <Star className="h-4 w-4 fill-primary-500 text-primary-500" />
              <span className="text-sm font-semibold text-primary-700">
                {currentMember.points}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <MemberAvatar
                name={currentMember.name}
                avatar={currentMember.avatar}
                size="md"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-800">
                  {currentMember.name}
                </p>
                <p className="text-xs text-gray-500">
                  {currentMember.isAdmin ? '管理员' : '家庭成员'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              title="切换账号"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap',
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
