import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Star,
  User,
  Calendar,
  Tag,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { taskApi } from '@/utils/api';
import MemberAvatar from '@/components/MemberAvatar';
import type { Task, Member, Category } from '@/types';

function getCountdown(deadline: string): { text: string; isUrgent: boolean; isExpired: boolean } {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { text: '已过期', isUrgent: true, isExpired: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let text = '';
  if (days > 0) text = `${days}天 ${hours}小时 ${minutes}分`;
  else if (hours > 0) text = `${hours}小时 ${minutes}分 ${seconds}秒`;
  else text = `${minutes}分 ${seconds}秒`;

  return {
    text,
    isUrgent: diff < 1000 * 60 * 60 * 24,
    isExpired: false,
  };
}

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { members, categories, updateTask, updateMember, isLoading, setIsLoading } = useStore();

  const [task, setTask] = useState<Task | null>(null);
  const [countdown, setCountdown] = useState({ text: '', isUrgent: false, isExpired: false });
  const [showCompleteAnimation, setShowCompleteAnimation] = useState(false);
  const [showPetals, setShowPetals] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (id) {
      loadTask(id);
    }
  }, [id]);

  useEffect(() => {
    if (!task || task.status !== 'pending') return;

    const updateCountdown = () => {
      setCountdown(getCountdown(task.deadline));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [task]);

  const loadTask = async (taskId: string) => {
    try {
      setIsLoading(true);
      const data = await taskApi.getTasks();
      const foundTask = data.find((t: Task) => t.id === taskId);
      setTask(foundTask || null);
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const assignee = task?.assigneeId
    ? members.find((m) => m.id === task.assigneeId)
    : undefined;

  const category = task
    ? categories.find((c) => c.id === task.category)
    : undefined;

  const handleComplete = async () => {
    if (!task || task.status !== 'pending' || isCompleting) return;

    setIsCompleting(true);
    setShowCompleteAnimation(true);
    setShowPetals(true);

    try {
      const response = await taskApi.completeTask(task.id);
      const result = response as unknown as { task: Task; member: Member };
      setTask(result.task);
      updateTask(result.task);
      if (result.member) {
        updateMember(result.member);
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setTimeout(() => {
        setIsCompleting(false);
        setShowCompleteAnimation(false);
        setShowPetals(false);
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-gray-500">任务不存在</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
        >
          返回看板
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-cream to-primary-100">
      {showPetals && <PetalEffect />}

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">返回看板</span>
        </button>

        <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl">
          {showCompleteAnimation && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/90 backdrop-blur-sm">
              <div className="text-center">
                <div className="relative flex h-24 w-24 items-center justify-center mx-auto mb-4">
                  <svg
                    className="h-24 w-24 text-green-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path
                      d="M5 12l5 5L20 7"
                      strokeDasharray="24"
                      strokeDashoffset="24"
                      style={{ animation: 'drawCheck 0.6s ease forwards' }}
                    />
                  </svg>
                </div>
                <p className="text-xl font-bold text-green-600">任务完成！</p>
                <p className="text-gray-500">+{task.points} 积分已到账</p>
              </div>
            </div>
          )}

          <div
            className={cn(
              'absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-400 to-primary-500',
              task.status === 'completed' && 'from-green-400 to-green-500',
              countdown.isExpired && 'from-red-400 to-red-500'
            )}
          />

          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
                    style={{ backgroundColor: category?.color || '#9CA3AF' }}
                  >
                    <Tag className="h-3.5 w-3.5 mr-1" />
                    {category?.name || '其他'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {task.points} 积分
                  </span>
                  <span className="inline-flex items-center rounded-full bg-warmGray-100 px-3 py-1 text-sm font-medium text-warmGray-600">
                    {task.cycle === 'daily' ? '每日任务' : '每周任务'}
                  </span>
                </div>

                <h1
                  className={cn(
                    'text-2xl sm:text-3xl font-bold text-gray-800 mb-2',
                    task.status === 'completed' && 'line-through text-gray-400'
                  )}
                >
                  {task.title}
                </h1>

                <p className="text-gray-600">{task.description}</p>
              </div>

              {task.status === 'completed' && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 flex-shrink-0">
                  <Check className="h-5 w-5" />
                </div>
              )}

              {countdown.isExpired && task.status === 'pending' && (
                <div className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1.5 text-red-600 flex-shrink-0">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">已过期</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-warmGray-50">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">截止时间</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(task.deadline).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  'flex items-center gap-4 p-4 rounded-2xl',
                  countdown.isUrgent ? 'bg-red-50' : 'bg-warmGray-50'
                )}
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl',
                    countdown.isUrgent ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'
                  )}
                >
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">剩余时间</p>
                  <p
                    className={cn(
                      'font-semibold',
                      countdown.isUrgent ? 'text-red-600' : 'text-gray-800'
                    )}
                  >
                    {countdown.text}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-warmGray-50 sm:col-span-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">负责人</p>
                  {assignee ? (
                    <div className="flex items-center gap-2">
                      <MemberAvatar
                        name={assignee.name}
                        avatar={assignee.avatar}
                        size="sm"
                      />
                      <span className="font-semibold text-gray-800">
                        {assignee.name}
                      </span>
                    </div>
                  ) : (
                    <p className="font-semibold text-gray-400">待分配</p>
                  )}
                </div>
              </div>
            </div>

            {task.status === 'pending' && !countdown.isExpired && (
              <button
                onClick={handleComplete}
                disabled={isCompleting}
                className={cn(
                  'w-full py-4 rounded-2xl font-semibold text-white text-lg',
                  'bg-gradient-to-r from-green-500 to-green-400',
                  'shadow-xl shadow-green-200',
                  'transition-all duration-300',
                  'hover:shadow-2xl hover:shadow-green-300 hover:-translate-y-1',
                  'active:translate-y-0 active:shadow-lg',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'group overflow-hidden relative'
                )}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Check className="h-5 w-5" />
                  {isCompleting ? '完成中...' : '完成任务'}
                </span>
                <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
            )}

            {task.status === 'completed' && (
              <div className="text-center p-6 rounded-2xl bg-green-50 border-2 border-green-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 mx-auto mb-3">
                  <Check className="h-6 w-6" />
                </div>
                <p className="font-semibold text-green-700">任务已完成</p>
                <p className="text-sm text-green-600">
                  完成时间：{task.completedAt ? new Date(task.completedAt).toLocaleString('zh-CN') : ''}
                </p>
              </div>
            )}

            {countdown.isExpired && task.status === 'pending' && (
              <div className="text-center p-6 rounded-2xl bg-red-50 border-2 border-red-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mx-auto mb-3">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <p className="font-semibold text-red-700">任务已过期</p>
                <p className="text-sm text-red-600">请联系管理员重新分配</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}

function PetalEffect() {
  const petals = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    size: 8 + Math.random() * 10,
    color: ['#FF8C42', '#FFD199', '#FFA333', '#FFB86C', '#FFE4B5', '#FF6B35'][Math.floor(Math.random() * 6)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="absolute rounded-full"
          style={{
            left: `${petal.left}%`,
            top: '-30px',
            width: `${petal.size}px`,
            height: `${petal.size}px`,
            backgroundColor: petal.color,
            animation: `petalFall ${petal.duration}s ease-in ${petal.delay}s forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes petalFall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0.3);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
