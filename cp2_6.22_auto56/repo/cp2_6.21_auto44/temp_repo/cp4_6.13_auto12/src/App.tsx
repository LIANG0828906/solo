import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  CalendarRange,
  User as UserIcon,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Menu,
  Search,
  ChevronDown,
  Plus,
  Clock,
  BookOpen,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '@/store';
import { subjectApi } from '@/utils/api';
import type { Subject } from '@/types';
import { getWeekDates, formatHours, getDefaultAvatar } from '@/utils/helpers';
import Timer from '@/components/Timer';
import SubjectModal from '@/components/SubjectModal';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { sidebarCollapsed, setSidebarCollapsed, mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<Record<number, number>>({});
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [, force] = useState(0);

  const loadSubjects = async () => {
    try {
      const list = await subjectApi.getAll();
      setSubjects(list);
      const { start, end } = getWeekDates();
      const { sessionApi } = await import('@/utils/api');
      const sessions = await sessionApi.getAll({
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
      });
      const progress: Record<number, number> = {};
      for (const s of sessions) {
        progress[s.subject_id] = (progress[s.subject_id] || 0) + s.duration_seconds;
      }
      const pr: Record<number, number> = {};
      for (const sub of list) {
        const goalSec = sub.weekly_goal_hours * 3600;
        pr[sub.id] = Math.min(1, goalSec > 0 ? (progress[sub.id] || 0) / goalSec : 0);
      }
      setSubjectProgress(pr);
    } catch {}
  };

  useEffect(() => {
    loadSubjects();
    const t = setInterval(() => force((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/profile?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: '仪表盘' },
    { path: '/trends', icon: TrendingUp, label: '趋势分析' },
    { path: '/weekly', icon: CalendarRange, label: '学习周报' },
    { path: '/profile', icon: UserIcon, label: '个人中心' },
  ];

  const avatar = user?.avatar || getDefaultAvatar(user?.nickname || 'U');

  return (
    <div className="flex flex-col h-screen bg-bg-primary overflow-hidden">
      <header className="flex-shrink-0 flex items-center h-16 px-4 md:px-6 bg-bg-secondary border-b border-zinc-700/40 z-40">
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-bg-tertiary mr-2 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="w-5 h-5 text-text-secondary" />
        </button>
        <button
          className="hidden lg:flex p-2 rounded-lg hover:bg-bg-tertiary mr-2 transition-colors"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-5 h-5 text-text-secondary" />
          ) : (
            <PanelLeftClose className="w-5 h-5 text-text-secondary" />
          )}
        </button>

        <div
          className="flex items-center gap-2 cursor-pointer mr-6"
          onClick={() => navigate('/')}
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-primary to-purple-600 flex items-center justify-center shadow-lg shadow-accent-primary/30">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gradient hidden sm:block">学习追踪</span>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-md mx-auto hidden md:flex"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索科目名或学习备注..."
              className="input-field pl-10 pr-4 py-2 text-sm"
            />
          </div>
        </form>

        <div className="flex items-center gap-3 ml-auto">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              <img
                src={avatar}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-accent-primary/30"
              />
              <span className="text-sm text-text-primary font-medium hidden sm:block max-w-[100px] truncate">
                {user?.nickname}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-text-muted transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
              />
            </button>
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-bg-secondary border border-zinc-700/40 rounded-xl shadow-xl py-2 z-20 animate-fade-slide-up">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-primary hover:bg-bg-tertiary transition-colors"
                  >
                    <UserIcon className="w-4 h-4" /> 个人中心
                  </button>
                  <div className="my-1 border-t border-zinc-700/30"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> 退出登录
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`flex-shrink-0 bg-bg-secondary border-r border-zinc-700/40 transition-all duration-300 ease-out z-30 ${
            sidebarCollapsed ? 'w-16 lg:w-16' : 'w-60'
          } ${
            mobileMenuOpen ? 'fixed inset-y-16 left-0 w-60 shadow-2xl' : 'hidden lg:block'
          }`}
        >
          <div className="flex flex-col h-full overflow-y-auto py-4">
            <nav className="px-2 space-y-1 mb-6">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-accent-primary/15 text-accent-primary border-l-2 border-accent-primary'
                        : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="px-3 mb-3 flex items-center justify-between">
              {!sidebarCollapsed && (
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  学习科目
                </h3>
              )}
              <button
                onClick={() => {
                  setEditingSubject(null);
                  setShowSubjectModal(true);
                }}
                className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-muted hover:text-accent-primary transition-colors"
                title="添加科目"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="px-2 space-y-1 flex-1">
              {subjects.map((sub) => {
                const progress = subjectProgress[sub.id] || 0;
                const progressPct = Math.round(progress * 100);
                return (
                  <div
                    key={sub.id}
                    className="group p-2.5 rounded-lg hover:bg-bg-tertiary/70 cursor-pointer transition-colors"
                    onClick={() => {
                      setEditingSubject(sub);
                      setShowSubjectModal(true);
                    }}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white/10"
                        style={{ backgroundColor: sub.color }}
                      />
                      {!sidebarCollapsed && (
                        <>
                          <span className="text-sm text-text-primary truncate flex-1">
                            {sub.name}
                          </span>
                          <span className="text-xs text-text-muted whitespace-nowrap">
                            {sub.weekly_goal_hours}h
                          </span>
                        </>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <div className="ml-[22px]">
                        <div className="progress-bar">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${progressPct}%`,
                              backgroundColor: sub.color,
                            }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[11px] text-text-muted">
                            {progressPct}%
                          </span>
                          <span className="text-[11px] text-text-muted">
                            {formatHours(sub.weekly_goal_hours * progress)} / {formatHours(sub.weekly_goal_hours)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {subjects.length === 0 && !sidebarCollapsed && (
                <div className="text-center py-6 text-text-muted text-sm">
                  点击上方 <Plus className="w-3 h-3 inline" /> 添加科目
                </div>
              )}
            </div>

            <div className="px-4 pt-4 mt-4 border-t border-zinc-700/30">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Clock className="w-3.5 h-3.5 text-accent-primary" />
                <span>本周目标：坚持每一天</span>
              </div>
            </div>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="min-h-full p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>

        <Timer subjects={subjects} />
      </div>

      {showSubjectModal && (
        <SubjectModal
          subject={editingSubject}
          onClose={() => {
            setShowSubjectModal(false);
            setEditingSubject(null);
          }}
          onSaved={() => {
            setShowSubjectModal(false);
            setEditingSubject(null);
            loadSubjects();
          }}
        />
      )}
    </div>
  );
}
