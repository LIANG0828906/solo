import { useState, useEffect, useRef } from 'react';
import { Plus, Target, Calendar, TrendingUp, Trash2 } from 'lucide-react';
import Fireworks from '@/components/Fireworks';
import { cn } from '@/lib/utils';

interface SavingsGoalData {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
}

interface AnimatedProgressProps {
  progress: number;
  color?: string;
}

function AnimatedProgress({ progress, color = '#3EB489' }: AnimatedProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const prevProgress = useRef(0);

  useEffect(() => {
    const start = prevProgress.current;
    const end = progress;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - t, 4);
      const current = start + (end - start) * easeOutQuart;
      setDisplayProgress(current);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        prevProgress.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [progress]);

  return (
    <div className="relative w-full h-3 bg-gray-200 dark:bg-navy-400/30 rounded-full overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${displayProgress}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          boxShadow: `0 0 10px ${color}66`,
          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      <div
        className="absolute inset-y-0 w-1/3 opacity-50"
        style={{
          left: `calc(${displayProgress}% - 33%)`,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
          backgroundSize: '200% 100%',
          animation: displayProgress > 5 ? 'shimmer 1.5s infinite ease-in-out' : 'none',
        }}
      />
    </div>
  );
}

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

function AnimatedNumber({ value, decimals = 1, suffix = '', className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - t, 3);
      const current = start + (end - start) * easeOutCubic;
      setDisplayValue(current);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className={className}>
      {displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}

const initialGoals: SavingsGoalData[] = [
  {
    id: '1',
    name: '日本旅行',
    targetAmount: 20000,
    currentAmount: 12500,
    deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: '新款手机',
    targetAmount: 8000,
    currentAmount: 8000,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: '应急储蓄',
    targetAmount: 50000,
    currentAmount: 18500,
    deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

const calculateEstimatedDate = (goal: SavingsGoalData): string => {
  const now = new Date();
  const created = new Date(goal.createdAt);
  const daysElapsed = Math.max(1, Math.floor((now.getTime() - created.getTime()) / (24 * 60 * 60 * 1000)));
  const savedPerDay = goal.currentAmount / daysElapsed;
  const remaining = goal.targetAmount - goal.currentAmount;

  if (remaining <= 0 || savedPerDay <= 0) {
    return '已达成';
  }

  const daysNeeded = Math.ceil(remaining / savedPerDay);
  const estimatedDate = new Date(now.getTime() + daysNeeded * 24 * 60 * 60 * 1000);
  return formatDate(estimatedDate.toISOString().split('T')[0]);
};

export default function SavingsGoal() {
  const [goals, setGoals] = useState<SavingsGoalData[]>(initialGoals);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
  });
  const [showFireworks, setShowFireworks] = useState(false);
  const [celebratedGoals, setCelebratedGoals] = useState<Set<string>>(new Set());
  const newlyCompletedRef = useRef<SavingsGoalData | null>(null);

  useEffect(() => {
    const newlyCompleted = goals.find(
      (g) => g.currentAmount >= g.targetAmount && !celebratedGoals.has(g.id)
    );

    if (newlyCompleted) {
      newlyCompletedRef.current = newlyCompleted;
      setShowFireworks(true);
      setCelebratedGoals((prev) => new Set([...prev, newlyCompleted.id]));

      const timer = setTimeout(() => {
        setShowFireworks(false);
        newlyCompletedRef.current = null;
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [goals, celebratedGoals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount || !formData.deadline) return;

    const newGoal: SavingsGoalData = {
      id: Date.now().toString(),
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: 0,
      deadline: formData.deadline,
      createdAt: new Date().toISOString(),
    };

    setGoals((prev) => [newGoal, ...prev]);
    setFormData({ name: '', targetAmount: '', deadline: '' });
    setShowForm(false);
  };

  const handleAddProgress = (goalId: string, amount: number) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, currentAmount: Math.min(g.currentAmount + amount, g.targetAmount) }
          : g
      )
    );
  };

  const handleDelete = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-navy-500 dark:to-navy-600">
      <Fireworks active={showFireworks} duration={4000} />

      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy-500 dark:text-white">储蓄目标</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
              共 {goals.length} 个目标，已完成 {goals.filter((g) => g.currentAmount >= g.targetAmount).length} 个
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-mint-500 to-mint-600 text-white font-medium shadow-lg shadow-mint-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <Plus size={20} />
            新建目标
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-navy-500 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
              <h2 className="text-xl font-bold text-navy-500 dark:text-white mb-6">创建储蓄目标</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    目标名称
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="例如：旅行基金"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-400/30 border border-gray-200 dark:border-navy-400/30 text-navy-500 dark:text-white placeholder-gray-400 focus:border-mint-400 dark:focus:border-mint-400/50 outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    目标金额
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300">
                      ¥
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, targetAmount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-400/30 border border-gray-200 dark:border-navy-400/30 text-navy-500 dark:text-white placeholder-gray-400 focus:border-mint-400 dark:focus:border-mint-400/50 outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    截止日期
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-navy-400/30 border border-gray-200 dark:border-navy-400/30 text-navy-500 dark:text-white focus:border-mint-400 dark:focus:border-mint-400/50 outline-none transition-colors"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-navy-400/30 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-navy-400/50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-mint-500 to-mint-600 text-white font-medium shadow-lg shadow-mint-500/30 hover:shadow-xl transition-all duration-300"
                  >
                    创建
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {goals.length === 0 ? (
          <div className="bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-2xl p-16 text-center shadow-lg border border-white/50 dark:border-navy-400/20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-mint-100 dark:bg-mint-500/20 flex items-center justify-center">
              <Target size={40} className="text-mint-500" />
            </div>
            <h3 className="text-xl font-semibold text-navy-500 dark:text-white mb-2">
              还没有储蓄目标
            </h3>
            <p className="text-gray-500 dark:text-gray-300 mb-6">
              开始创建你的第一个储蓄目标吧！
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-mint-500 to-mint-600 text-white font-medium shadow-lg shadow-mint-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              创建目标
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {goals.map((goal, idx) => {
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              const isCompleted = goal.currentAmount >= goal.targetAmount;
              const daysLeft = Math.ceil(
                (new Date(goal.deadline).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
              );

              return (
                <div
                  key={goal.id}
                  className={cn(
                    'relative bg-white/70 dark:bg-navy-400/30 backdrop-blur-xl rounded-2xl p-6 shadow-lg border transition-all duration-500 hover:shadow-xl animate-fade-in',
                    isCompleted
                      ? 'border-mint-400/50 dark:border-mint-400/30 bg-gradient-to-br from-white/80 to-mint-50/50 dark:from-navy-400/40 dark:to-mint-500/10'
                      : 'border-white/50 dark:border-navy-400/20 hover:scale-[1.02]'
                  )}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  {isCompleted && (
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-mint-500 to-mint-600 text-white text-xs font-medium shadow-md shadow-mint-500/30 flex items-center gap-1 animate-scale-in">
                      🎉 已达成
                    </div>
                  )}

                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="absolute top-4 left-4 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 transition-all duration-200 opacity-0 group-hover:opacity-100"
                    style={{ opacity: 1 }}
                  >
                    <Trash2 size={16} />
                  </button>

                  <div className="flex items-start gap-4 mb-4 mt-2">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0',
                        isCompleted
                          ? 'bg-gradient-to-br from-mint-400 to-mint-600 shadow-mint-500/30'
                          : 'bg-gradient-to-br from-navy-400 to-navy-600 shadow-navy-500/30'
                      )}
                    >
                      <Target size={28} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-navy-500 dark:text-white truncate">
                        {goal.name}
                      </h3>
                      <p className="text-2xl font-bold mt-1 text-mint-600 dark:text-mint-300">
                        ¥{goal.currentAmount.toLocaleString()}
                        <span className="text-base text-gray-400 dark:text-gray-500 font-normal">
                          {' '}
                          / ¥{goal.targetAmount.toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-300">进度</span>
                      <AnimatedNumber
                        value={progress}
                        decimals={1}
                        suffix="%"
                        className={cn(
                          'text-sm font-bold',
                          isCompleted
                            ? 'text-mint-600 dark:text-mint-300'
                            : 'text-navy-500 dark:text-white'
                        )}
                      />
                    </div>
                    <AnimatedProgress progress={progress} color={isCompleted ? '#3EB489' : '#1E3A5F'} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-navy-500/30">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-300 mb-1">
                        <Calendar size={14} />
                        截止日期
                      </div>
                      <p className="text-sm font-medium text-navy-500 dark:text-white">
                        {formatDate(goal.deadline)}
                      </p>
                      <p
                        className={cn(
                          'text-xs mt-0.5',
                          daysLeft < 0
                            ? 'text-red-500'
                            : daysLeft <= 30
                            ? 'text-yellow-500'
                            : 'text-gray-500 dark:text-gray-300'
                        )}
                      >
                        {daysLeft < 0
                          ? `已逾期 ${Math.abs(daysLeft)} 天`
                          : `还剩 ${daysLeft} 天`}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-navy-500/30">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-300 mb-1">
                        <TrendingUp size={14} />
                        预估达成
                      </div>
                      <p className="text-sm font-medium text-navy-500 dark:text-white truncate">
                        {calculateEstimatedDate(goal)}
                      </p>
                    </div>
                  </div>

                  {!isCompleted && (
                    <div className="flex gap-2">
                      {[100, 500, 1000].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => handleAddProgress(goal.id, amount)}
                          className="flex-1 py-2.5 rounded-xl bg-mint-50 dark:bg-mint-500/10 text-mint-600 dark:text-mint-300 font-medium hover:bg-mint-100 dark:hover:bg-mint-500/20 hover:scale-105 transition-all duration-200 text-sm"
                        >
                          +¥{amount}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translateX(200%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
