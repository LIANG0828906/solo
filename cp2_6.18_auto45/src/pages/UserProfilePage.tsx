import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Star } from 'lucide-react';
import { useStore } from '../store';
import { TaskCard } from '../components/TaskCard';
import { cn } from '../lib/utils';

function usePointsAnimation(target: number, trigger: { old: number; new: number; timestamp: number } | null, onDone: () => void) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number | null>(null);
  const lastTriggerRef = useRef<number>(0);

  useEffect(() => {
    if (!trigger) {
      setDisplay(target);
      return;
    }
    if (trigger.timestamp === lastTriggerRef.current) return;
    lastTriggerRef.current = trigger.timestamp;

    const { old: from, new: to } = trigger;
    const duration = 500;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(to);
        const t = setTimeout(onDone, 100);
        return () => clearTimeout(t);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [trigger, target, onDone]);

  return display;
}

export default function UserProfilePage() {
  const currentUser = useStore((s) => s.currentUser);
  const tasks = useStore((s) => s.tasks);
  const lastPointsChange = useStore((s) => s.lastPointsChange);
  const clearPointsAnimation = useStore((s) => s.clearPointsAnimation);

  const [activeTab, setActiveTab] = useState<'published' | 'claimed'>('published');

  const displayedPoints = usePointsAnimation(currentUser.points, lastPointsChange, clearPointsAnimation);

  useEffect(() => {
    return () => clearPointsAnimation();
  }, [clearPointsAnimation]);

  const publishedTasks = tasks.filter((t) => t.publisherId === currentUser.id);
  const claimedTasks = tasks.filter((t) => t.claimantId === currentUser.id);

  const displayTasks = activeTab === 'published' ? publishedTasks : claimedTasks;

  const completedClaimed = claimedTasks.filter((t) => t.status === 'reviewed' || t.status === 'completed');
  const totalEarnedPoints = completedClaimed.reduce((sum, t) => sum + t.reward, 0);

  return (
    <div className="min-h-screen bg-slate-50">
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

      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 font-medium"
            >
              <ArrowLeft size={18} />
              <span>返回首页</span>
            </Link>
            <span className="font-semibold text-slate-800">个人主页</span>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div
          className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          style={{ padding: '24px' }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div
              className="rounded-full shrink-0 flex items-center justify-center text-white shadow-md bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-500"
              style={{ width: '80px', height: '80px' }}
            >
              <User size={36} />
            </div>

            <div className="flex-1 min-w-0 w-full">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-2">
                    {currentUser.nickname}
                  </h1>

                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <svg
                        key={level}
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill={level <= currentUser.level ? '#FBBF24' : 'none'}
                        stroke={level <= currentUser.level ? '#FBBF24' : '#CBD5E1'}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                    <span className="ml-2 text-xs text-slate-500">
                      声誉等级 Lv.{currentUser.level}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 bg-blue-50 px-4 py-2 rounded-xl">
                  <span
                    className="font-bold tabular-nums"
                    style={{
                      fontSize: '28px',
                      color: '#3B82F6',
                    }}
                  >
                    {displayedPoints}
                  </span>
                  <span className="text-sm text-slate-500 ml-1">积分</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100">
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-800">{currentUser.completedCount}</div>
                  <div className="text-xs text-slate-500 mt-1">已完成任务</div>
                </div>
                <div className="text-center border-x border-slate-100">
                  <div className="text-xl font-bold text-slate-800">
                    {currentUser.avgRating > 0 ? currentUser.avgRating.toFixed(1) : '—'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">平均评分</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-slate-800">{totalEarnedPoints}</div>
                  <div className="text-xs text-slate-500 mt-1">累计获得</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-1 mb-5 bg-white p-1 rounded-xl shadow-sm w-fit border border-slate-100">
            <button
              onClick={() => setActiveTab('published')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'published'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800',
              )}
            >
              发布的任务 ({publishedTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('claimed')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'claimed'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800',
              )}
            >
              认领的任务 ({claimedTasks.length})
            </button>
          </div>

          {displayTasks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm py-16 text-center border border-slate-100">
              <p className="text-slate-500">
                {activeTab === 'published' ? '还没有发布过任务' : '还没有认领过任务'}
              </p>
              <Link
                to="/"
                className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                去首页看看 →
              </Link>
            </div>
          ) : (
            <div
              className="grid gap-5"
              style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              }}
            >
              {displayTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  showClaim={false}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
