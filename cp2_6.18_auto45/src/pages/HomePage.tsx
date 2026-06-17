import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, User } from 'lucide-react';
import { useStore } from '../store';
import { filterByCategory, filterByKeyword, filterByStatus } from '../logic/filterLogic';
import { TaskCard } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import { NotificationPanel } from '../components/NotificationPanel';
import { cn } from '../lib/utils';
import type { TaskCategory } from '../types';

const categories: (TaskCategory | '全部')[] = [
  '全部',
  '跑腿代办',
  '家政服务',
  '工具借用',
  '技能互助',
  '宠物照料',
  '其他',
];

export default function HomePage() {
  const tasks = useStore((s) => s.tasks);
  const currentUser = useStore((s) => s.currentUser);
  const notifications = useStore((s) => s.notifications);
  const publishTask = useStore((s) => s.publishTask);
  const claimTask = useStore((s) => s.claimTask);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);

  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | '全部'>('全部');

  const filteredTasks = useMemo(() => {
    let result = tasks;
    result = filterByStatus(result, 'open');
    result = filterByCategory(result, selectedCategory);
    result = filterByKeyword(result, keyword);
    return result;
  }, [tasks, selectedCategory, keyword]);

  const handlePublish = (title: string, description: string, reward: number, category: TaskCategory) => {
    const result = publishTask(title, description, reward, category);
    return result !== null;
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-slate-800">社区微任务</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <NotificationPanel
                notifications={notifications}
                currentUserId={currentUser.id}
                onMarkRead={markNotificationRead}
                onMarkAllRead={markAllNotificationsRead}
              />

              <Link
                to="/profile"
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                  <User size={16} />
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-slate-800 leading-tight">{currentUser.nickname}</span>
                  <span className="text-xs text-blue-600 font-medium leading-tight">{currentUser.points}积分</span>
                </div>
              </Link>

              <Link
                to="/my-tasks"
                className={cn(
                  'px-3 sm:px-4 py-2 rounded-lg text-sm font-medium',
                  'bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-sm',
                )}
              >
                <span className="hidden sm:inline">我的任务</span>
                <span className="sm:hidden">任务</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center mb-10 gap-6">
          <div className="relative w-full" style={{ maxWidth: '480px' }}>
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索任务标题或描述..."
              className={cn(
                'w-full pl-11 pr-4 text-sm text-slate-800',
                'bg-white border border-slate-300 outline-none transition-all duration-200',
                'placeholder:text-slate-400',
                'focus:border-blue-500',
              )}
              style={{
                borderRadius: '24px',
                padding: '12px 20px 12px 44px',
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'text-sm font-medium transition-all duration-200',
                  'border whitespace-nowrap',
                  selectedCategory === cat
                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50',
                )}
                style={{
                  borderRadius: '20px',
                  padding: '6px 16px',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto mb-10">
          <TaskForm onPublish={handlePublish} currentPoints={currentUser.points} />
        </div>

        {filteredTasks.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-slate-500">暂无任务，快来发布第一个吧！</p>
          </div>
        ) : (
          <div
            className="task-grid grid gap-5"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            }}
          >
            {filteredTasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClaim={claimTask}
                showClaim={true}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="py-8 text-center text-xs text-slate-400 border-t border-slate-100 mt-12">
        <p>社区微任务 · 邻里互助平台</p>
      </footer>
    </div>
  );
}
