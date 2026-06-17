import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User, ArrowLeft, CheckCircle, Star } from 'lucide-react';
import { useStore } from '../store';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { cn } from '../lib/utils';
import type { Task, TaskStatus } from '../types';

type ActiveStatus = 'claimed' | 'completed' | 'reviewed';

const statusConfig: Record<ActiveStatus, { label: string; badgeClass: string }> = {
  claimed: {
    label: '待完成',
    badgeClass: 'bg-amber-500/20 text-amber-600',
  },
  completed: {
    label: '已完成',
    badgeClass: 'bg-emerald-500/20 text-emerald-600',
  },
  reviewed: {
    label: '已评价',
    badgeClass: 'bg-blue-500/20 text-blue-600',
  },
};

const navItems: { status: ActiveStatus; label: string }[] = [
  { status: 'claimed', label: '待完成' },
  { status: 'completed', label: '已完成' },
  { status: 'reviewed', label: '已评价' },
];

function StarRating({
  value,
  onChange,
  size = 24,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleClick = (star: number) => {
    if (submitted) return;
    onChange(star);
    setSubmitted(true);
  };

  return (
    <div
      className="inline-flex items-center gap-1"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fillValue = submitted ? value : hover || value;
        return (
          <button
            key={star}
            type="button"
            disabled={submitted}
            onMouseEnter={() => !submitted && setHover(star)}
            onClick={() => handleClick(star)}
            className={cn('transition-transform', !submitted && 'hover:scale-110 cursor-pointer')}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={star <= fillValue ? '#FBBF24' : 'none'}
              stroke={star <= fillValue ? '#FBBF24' : '#CBD5E1'}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export default function MyTasksPage() {
  const tasks = useStore((s) => s.tasks);
  const currentUser = useStore((s) => s.currentUser);
  const markCompleted = useStore((s) => s.markCompleted);
  const rateAndFinalize = useStore((s) => s.rateAndFinalize);

  const [activeStatus, setActiveStatus] = useState<ActiveStatus>('claimed');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const myTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        (t.publisherId === currentUser.id) ||
        (t.claimantId === currentUser.id),
    );
  }, [tasks, currentUser.id]);

  const displayedTasks = useMemo(() => {
    const uid = currentUser.id;
    if (activeStatus === 'claimed') {
      return myTasks.filter((t) => {
        if (t.claimantId === uid && t.status === 'claimed') return true;
        return false;
      });
    }
    if (activeStatus === 'completed') {
      return myTasks.filter((t) => {
        if (t.status === 'completed') {
          if (t.publisherId === uid) return true;
          if (t.claimantId === uid) return true;
        }
        return false;
      });
    }
    return myTasks.filter((t) => {
      if (t.status === 'reviewed') {
        if (t.publisherId === uid) return true;
        if (t.claimantId === uid) return true;
      }
      return false;
    });
  }, [myTasks, activeStatus, currentUser.id]);

  const getCounterparty = (task: Task) => {
    if (task.claimantId === currentUser.id) {
      return { label: '发布者', name: task.publisherName };
    }
    return { label: '认领者', name: task.claimantName || '—' };
  };

  const Sidebar = ({ inDrawer = false }: { inDrawer?: boolean }) => (
    <aside
      className={cn(
        'flex flex-col h-full text-white',
        !inDrawer && 'w-60 shrink-0',
        inDrawer && 'w-60 h-full',
      )}
      style={{ backgroundColor: '#1F2937' }}
    >
      <div className="px-4 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shrink-0">
            <User size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{currentUser.nickname}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: '#60A5FA' }}>
              <AnimatedNumber value={currentUser.points} /> 积分
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const count =
            item.status === 'claimed'
              ? myTasks.filter((t) => t.claimantId === currentUser.id && t.status === 'claimed').length
              : item.status === 'completed'
                ? myTasks.filter((t) => t.status === 'completed' && (t.publisherId === currentUser.id || t.claimantId === currentUser.id)).length
                : myTasks.filter((t) => t.status === 'reviewed' && (t.publisherId === currentUser.id || t.claimantId === currentUser.id)).length;
          const isActive = activeStatus === item.status;
          return (
            <button
              key={item.status}
              onClick={() => {
                setActiveStatus(item.status);
                if (inDrawer) setDrawerOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between text-left transition-colors text-sm',
                isActive
                  ? 'text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white',
              )}
              style={{
                padding: '12px 16px',
                backgroundColor: isActive ? '#374151' : undefined,
              }}
            >
              <span>{item.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    isActive ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-200',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700/50">
        <Link
          to="/"
          onClick={() => inDrawer && setDrawerOpen(false)}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-700/50"
        >
          <ArrowLeft size={16} />
          <span>返回首页</span>
        </Link>
      </div>
    </aside>
  );

  const currentCfg = statusConfig[activeStatus];

  return (
    <div className="min-h-screen flex bg-slate-100">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="hidden md:block" style={{ backgroundColor: '#1F2937' }}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold text-slate-800">我的任务</span>
          <Link to="/" className="text-sm text-blue-600 font-medium">首页</Link>
        </div>

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto" style={{ backgroundColor: '#F3F4F6' }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <h1 className="text-xl font-semibold text-slate-800">我的任务</h1>
              <span
                className="inline-flex items-center text-xs font-medium"
                style={{
                  borderRadius: '4px',
                  padding: '2px 8px',
                  backgroundColor: activeStatus === 'claimed' ? 'rgba(245, 158, 11, 0.15)'
                    : activeStatus === 'completed' ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(59, 130, 246, 0.15)',
                  color: activeStatus === 'claimed' ? '#D97706'
                    : activeStatus === 'completed' ? '#10B981'
                    : '#2563EB',
                }}
              >
                {currentCfg.label}
              </span>
            </div>

            {displayedTasks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm py-16 text-center">
                <p className="text-slate-500 text-sm">暂无{currentCfg.label}的任务</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedTasks.map((task) => {
                  const cp = getCounterparty(task);
                  return (
                    <div
                      key={task.id}
                      className="bg-white rounded-xl shadow-sm p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="font-medium text-base text-slate-800 leading-snug flex-1">
                          {task.title}
                        </h3>
                        <span
                          className="text-xs font-medium whitespace-nowrap shrink-0"
                          style={{
                            borderRadius: '4px',
                            padding: '2px 8px',
                            backgroundColor: task.status === 'claimed' ? 'rgba(245, 158, 11, 0.15)'
                              : task.status === 'completed' ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(59, 130, 246, 0.15)',
                            color: task.status === 'claimed' ? '#D97706'
                              : task.status === 'completed' ? '#10B981'
                              : '#2563EB',
                          }}
                        >
                          {task.status === 'claimed' ? '待完成'
                            : task.status === 'completed' ? '已完成'
                            : '已评价'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                        <div className="text-xs text-slate-500">
                          <span className="text-slate-400 mr-1">{cp.label}：</span>
                          <span>{cp.name}</span>
                        </div>
                        <div className="text-xs text-blue-600 font-bold">
                          奖励：{task.reward} 积分
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {task.status === 'claimed' && task.claimantId === currentUser.id && (
                          <button
                            onClick={() => {
                              if (window.confirm(`确认将任务"${task.title}"标记为完成？`)) {
                                markCompleted(task.id);
                              }
                            }}
                            className={cn(
                              'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg',
                              'text-sm font-medium text-white transition-colors',
                              'bg-emerald-500 hover:bg-emerald-600 shadow-sm',
                            )}
                            style={{ borderRadius: '8px' }}
                          >
                            <CheckCircle size={16} />
                            <span>标记完成</span>
                          </button>
                        )}

                        {task.status === 'completed' && task.publisherId === currentUser.id && (
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm text-slate-600">请评分：</span>
                            <StarRating
                              value={0}
                              onChange={(rating) => {
                                rateAndFinalize(task.id, rating as 1 | 2 | 3 | 4 | 5);
                              }}
                            />
                          </div>
                        )}

                        {task.status === 'reviewed' && task.rating && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">评分：</span>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={16}
                                  className={s <= task.rating! ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="absolute left-0 top-0 h-full shadow-2xl"
            style={{
              transform: 'translateX(0)',
              transition: 'transform 0.3s ease-out',
              backgroundColor: '#1F2937',
            }}
          >
            <div className="absolute right-2 top-2">
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-700/60"
              >
                <X size={18} />
              </button>
            </div>
            <Sidebar inDrawer />
          </div>
        </div>
      )}
    </div>
  );
}
